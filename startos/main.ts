import { sdk } from './sdk'
import { rootDir, networkPorts, networkFlag, Network, GetBlockchainInfo, GetPeerInfo } from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { storeJson } from './fileModels/store.json'
import { mainMounts } from './mounts'

export { mainMounts }

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */

  // Read bitcoin.conf (watch for changes — restarts Bitcoin on change)
  const bitcoinConf = await bitcoinConfFile.read().const(effects)

  // Read network and credentials from store
  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const rpcUser = store?.rpcUser ?? 'bitcoin-cash-node'
  const rpcPassword = store?.rpcPassword ?? ''
  const { rpc: rpcPort } = networkPorts[network]
  const netFlag = networkFlag[network]

  // Read and clear reindex flags
  const reindexBlockchain = store?.reindexBlockchain ?? false
  const reindexChainstate = store?.reindexChainstate ?? false
  if (reindexBlockchain || reindexChainstate) {
    await storeJson.merge(effects, { reindexBlockchain: false, reindexChainstate: false })
  }

  // Tor — get container IP (restarts Bitcoin if it changes)
  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()

  // Track Tor running status dynamically (no restart needed for status-only changes)
  let torRunning = false
  if (torIp) {
    sdk.getStatus(effects, { packageId: 'tor' }).onChange((status) => {
      torRunning = status?.desired.main === 'running'
      return { cancel: false }
    })
  }

  const onlynetList: string[] = ([
    (bitcoinConf?.onlynet as string[] | string | undefined) ?? [],
  ] as string[][]).flat().filter(Boolean)
  const onlynetActive = onlynetList.length > 0

  const externalip: (string | undefined)[] =
    ((bitcoinConf?.raw as Record<string, unknown> | undefined)?.externalip as
      (string | undefined)[] | undefined) ?? []

  const bitcoinArgs: string[] = [
    `-conf=${rootDir}/bitcoin.conf`,
    `-datadir=${rootDir}`,
    `-rpcport=${rpcPort}`,
    ...(netFlag ? [netFlag] : []),
    ...(torIp ? [`-onion=${torIp}:9050`] : []),
    ...(reindexBlockchain ? ['-reindex'] : []),
    ...(reindexChainstate ? ['-reindex-chainstate'] : []),
  ]

  const bitcoindSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'bitcoin-cash-node' },
    mainMounts,
    'bitcoind-sub',
  )

  // Helper: run bitcoin-cli inside the container
  async function cli(...args: string[]) {
    return bitcoindSub.exec([
      'bitcoin-cli',
      `-rpcconnect=127.0.0.1`,
      `-rpcport=${rpcPort}`,
      `-rpcuser=${rpcUser}`,
      `-rpcpassword=${rpcPassword}`,
      ...args,
    ])
  }

  /**
   * ======================== Daemons ========================
   */

  const excludedByOnlynet = () => ({
    result: 'disabled' as const,
    message: 'Excluded by onlynet',
  })

  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer: bitcoindSub,
      exec: {
        command: ['bitcoind', ...bitcoinArgs],
        sigtermTimeout: 300_000,
      },
      ready: {
        display: 'RPC',
        fn: async () => {
          try {
            const res = await cli('getrpcinfo')
            return res.exitCode === 0
              ? { message: 'The Bitcoin Cash Node RPC Interface is ready', result: 'success' }
              : { message: 'The Bitcoin Cash Node RPC Interface is not ready', result: 'starting' }
          } catch {
            return { message: 'The Bitcoin Cash Node RPC Interface is not ready', result: 'starting' }
          }
        },
      },
      requires: [],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: 'Blockchain Sync',
        fn: async () => {
          try {
            const res = await cli('getblockchaininfo')
            if (res.exitCode !== 0) return { message: 'Waiting for sync info', result: 'loading' }
            const info: GetBlockchainInfo = JSON.parse(res.stdout.toString())
            if (info.initialblockdownload) {
              const pct = (info.verificationprogress * 100).toFixed(2)
              return { message: `Syncing blocks...${pct}%`, result: 'loading' }
            }
            const currentStore = await storeJson.read().once()
            if (!currentStore?.fullySynced) {
              await storeJson.merge(effects, { fullySynced: true })
            }
            return {
              message: `Synced — block ${info.blocks}${info.pruned ? ' (pruned)' : ''}`,
              result: 'success',
            }
          } catch {
            return { message: 'Waiting for sync info', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('peer-connections', {
      ready: {
        display: 'Peer Connections',
        fn: async () => {
          try {
            const res = await cli('getpeerinfo')
            if (res.exitCode !== 0) return { message: 'Unable to query peers', result: 'loading' }
            const peers: GetPeerInfo = JSON.parse(res.stdout.toString())
            const count = peers.length
            if (count === 0) return { message: 'No peers connected — node may be starting up or isolated', result: 'loading' }
            if (count < 3) return { message: `Only ${count} peer(s) connected — network connectivity may be limited`, result: 'loading' }
            const inbound = peers.filter((p) => p.inbound).length
            return { message: `${count} peers (${count - inbound} outbound, ${inbound} inbound)`, result: 'success' }
          } catch {
            return { message: 'Unable to query peers', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })
    .addHealthCheck('tor', {
      ready: {
        display: 'Tor',
        fn: () => {
          if (!torIp) return { result: 'disabled' as const, message: 'Tor is not installed' }
          if (!torRunning) return { result: 'disabled' as const, message: 'Tor is not running' }
          if (onlynetActive && !onlynetList.includes('onion')) return excludedByOnlynet()
          return {
            result: 'success' as const,
            message: externalip.some((ip) => ip?.includes('.onion'))
              ? 'Inbound and outbound connections'
              : 'Outbound only. Add an onion address to enable inbound.',
          }
        },
      },
      requires: [],
    })
    .addHealthCheck('clearnet', {
      ready: {
        display: 'Clearnet',
        fn: () => {
          if (onlynetActive && !onlynetList.includes('ipv4') && !onlynetList.includes('ipv6'))
            return excludedByOnlynet()
          return {
            result: 'success' as const,
            message: externalip.some((ip) => ip && !ip.includes('.onion'))
              ? 'Inbound and outbound connections'
              : 'Outbound only. Publish an IP address to enable inbound.',
          }
        },
      },
      requires: [],
    })
})
