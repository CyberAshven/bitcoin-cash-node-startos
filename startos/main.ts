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

  // Read bitcoin.conf (watch for changes — restarts on change)
  const bitcoinConf = await bitcoinConfFile.read().const(effects)

  // Read network, credentials, and flavor from store
  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const rpcUser = store?.rpcUser ?? 'bitcoin-cash-node'
  const rpcPassword = store?.rpcPassword ?? ''
  const flavor = store?.flavor ?? 'bchn'
  const { rpc: rpcPort } = networkPorts[network]
  const netFlag = networkFlag[network]

  const isKnuth = flavor === 'knuth'

  console.log(`Starting Bitcoin Cash Node (${isKnuth ? 'Knuth' : 'BCHN'})!`)

  // Read and clear reindex flags
  const reindexBlockchain = store?.reindexBlockchain ?? false
  const reindexChainstate = store?.reindexChainstate ?? false
  if (reindexBlockchain || reindexChainstate) {
    await storeJson.merge(effects, { reindexBlockchain: false, reindexChainstate: false })
  }

  // Tor — get container IP (restarts if it changes)
  const torIp = await sdk.getContainerIp(effects, { packageId: 'tor' }).const()

  // Track Tor running status dynamically
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

  // ── Build command args (shared between both implementations) ─────
  const commonArgs: string[] = [
    `-datadir=${rootDir}`,
    `-rpcport=${rpcPort}`,
    ...(netFlag ? [netFlag] : []),
    ...(torIp ? [`-onion=${torIp}:9050`] : []),
    ...(reindexBlockchain ? ['-reindex'] : []),
    ...(reindexChainstate ? ['-reindex-chainstate'] : []),
  ]

  // BCHN uses -conf for config files; Knuth uses command-line overrides
  const daemonArgs: string[] = isKnuth
    ? [
        ...commonArgs,
        `-conf=${rootDir}/bitcoin.conf`,
        `-server`,
        `-txindex`,
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        `-rpcallowip=0.0.0.0/0`,
        `-rpcbind=0.0.0.0`,
      ]
    : [`-conf=${rootDir}/bitcoin.conf`, ...commonArgs]

  const imageId = isKnuth ? 'knuth' : 'bitcoin-cash-node'
  const daemonBin = isKnuth ? 'kth-node' : 'bitcoind'
  const cliBin = isKnuth ? null : 'bitcoin-cli' // Knuth uses JSON-RPC via curl

  const nodeSub = await sdk.SubContainer.of(
    effects,
    { imageId },
    mainMounts,
    'node-sub',
  )

  // Helper: run JSON-RPC call (works for both BCHN and Knuth)
  async function rpcCall(method: string, ...params: unknown[]) {
    if (cliBin) {
      // BCHN: use bitcoin-cli
      return nodeSub.exec([
        cliBin,
        `-rpcconnect=127.0.0.1`,
        `-rpcport=${rpcPort}`,
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        method,
        ...params.map(String),
      ])
    }
    // Knuth: use curl for JSON-RPC
    const body = JSON.stringify({
      jsonrpc: '1.0',
      id: 'sdk',
      method,
      params,
    })
    return nodeSub.exec([
      'curl', '-sf', '--max-time', '5',
      '-u', `${rpcUser}:${rpcPassword}`,
      '-H', 'Content-Type: application/json',
      '-d', body,
      `http://127.0.0.1:${rpcPort}/`,
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
    .addOneshot('nocow', {
      subcontainer: null,
      exec: {
        fn: async () => {
          try {
            const mkdirRes = await nodeSub.exec(['mkdir', '-p', rootDir])
            if (mkdirRes.exitCode !== 0) {
              console.warn(`nocow: mkdir failed for ${rootDir}; continuing without chattr`)
              return null
            }

            const chattrRes = await nodeSub.exec(['chattr', '-R', '+C', rootDir])
            if (chattrRes.exitCode !== 0) {
              console.warn(`nocow: chattr not applied for ${rootDir}; continuing startup`)
            }
          } catch (err) {
            console.warn('nocow: unable to set NoCOW attributes; continuing startup', err)
          }
          return null
        },
      },
      requires: [],
    })
    .addDaemon('primary', {
      subcontainer: nodeSub,
      exec: {
        command: [daemonBin, ...daemonArgs],
        sigtermTimeout: 300_000,
      },
      ready: {
        display: 'RPC',
        fn: async () => {
          try {
            const res = await rpcCall('getrpcinfo')
            return res.exitCode === 0
              ? { message: `The ${isKnuth ? 'Knuth' : 'BCHN'} RPC Interface is ready`, result: 'success' }
              : { message: `The ${isKnuth ? 'Knuth' : 'BCHN'} RPC Interface is not ready`, result: 'starting' }
          } catch {
            return { message: `The ${isKnuth ? 'Knuth' : 'BCHN'} RPC Interface is not ready`, result: 'starting' }
          }
        },
      },
      requires: ['nocow'],
    })
    .addHealthCheck('sync-progress', {
      ready: {
        display: 'Blockchain Sync',
        fn: async () => {
          try {
            const res = await rpcCall('getblockchaininfo')
            if (res.exitCode !== 0) return { message: 'Waiting for sync info', result: 'loading' }
            const stdout = res.stdout.toString()
            // Knuth curl returns JSON-RPC envelope; BCHN bitcoin-cli returns raw result
            const parsed = cliBin ? JSON.parse(stdout) : JSON.parse(stdout).result
            const info: GetBlockchainInfo = parsed
            if (info.initialblockdownload) {
              const pct = (info.verificationprogress * 100).toFixed(2)
              return { message: `Syncing blocks...${pct}%`, result: 'loading' }
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
    .addOneshot('synced-true', {
      subcontainer: null,
      exec: {
        fn: async () => {
          const currentStore = await storeJson.read().once()
          if (!currentStore?.fullySynced) {
            await storeJson.merge(effects, { fullySynced: true })
          }
          return null
        },
      },
      requires: ['sync-progress'],
    })
    .addHealthCheck('peer-connections', {
      ready: {
        display: 'Peer Connections',
        fn: async () => {
          try {
            const res = await rpcCall('getpeerinfo')
            if (res.exitCode !== 0) return { message: 'Unable to query peers', result: 'loading' }
            const stdout = res.stdout.toString()
            const peers: GetPeerInfo = cliBin ? JSON.parse(stdout) : JSON.parse(stdout).result
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
