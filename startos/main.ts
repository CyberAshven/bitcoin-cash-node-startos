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
  const osIp = await sdk.getOsIp(effects)

  // Ensure bitcoin.conf exists before starting
  await bitcoinConfFile.read().once()

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

  const bitcoinArgs: string[] = [
    `-conf=${rootDir}/bitcoin.conf`,
    `-datadir=${rootDir}`,
    `-rpcport=${rpcPort}`,
    ...(netFlag ? [netFlag] : []),
    ...(osIp ? [`-onion=${osIp}:9050`] : []),
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

  const daemons = sdk.Daemons.of(effects)
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
              ? {
                  message: 'The Bitcoin Cash Node RPC Interface is ready',
                  result: 'success',
                }
              : {
                  message: 'The Bitcoin Cash Node RPC Interface is not ready',
                  result: 'starting',
                }
          } catch {
            return {
              message: 'The Bitcoin Cash Node RPC Interface is not ready',
              result: 'starting',
            }
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
            if (res.exitCode !== 0) {
              return { message: 'Waiting for sync info', result: 'loading' }
            }
            const info: GetBlockchainInfo = JSON.parse(res.stdout.toString())
            if (info.initialblockdownload) {
              const pct = (info.verificationprogress * 100).toFixed(2)
              return {
                message: `Syncing blockchain: ${pct}% (block ${info.blocks} of ${info.headers})`,
                result: 'loading',
              }
            }
            // Mark as fully synced on first completion
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
            if (res.exitCode !== 0) {
              return { message: 'Unable to query peers', result: 'loading' }
            }
            const peers: GetPeerInfo = JSON.parse(res.stdout.toString())
            const count = peers.length
            if (count === 0) {
              return {
                message: 'No peers connected — node may be starting up or isolated',
                result: 'loading',
              }
            }
            if (count < 3) {
              return {
                message: `Only ${count} peer(s) connected — network connectivity may be limited`,
                result: 'loading',
              }
            }
            const inbound = peers.filter((p) => p.inbound).length
            const outbound = count - inbound
            return {
              message: `${count} peers (${outbound} outbound, ${inbound} inbound)`,
              result: 'success',
            }
          } catch {
            return { message: 'Unable to query peers', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })

  return daemons
})
