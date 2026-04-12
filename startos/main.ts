import { request } from 'node:https'
import { sdk } from './sdk'
import { rootDir, networkPorts, networkFlag, Network, GetBlockchainInfo, GetPeerInfo, i2pControlPort } from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { storeJson } from './fileModels/store.json'
import { mainMounts } from './mounts'

export { mainMounts }

// JSON-RPC helper for i2pd's I2PControl API (self-signed TLS cert)
const i2pControlRpc = (method: string, params: Record<string, unknown>) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    const req = request(
      {
        hostname: '127.0.0.1',
        port: i2pControlPort,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk: string) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as Record<string, unknown>)
          } catch {
            reject(new Error('Invalid JSON from i2pd I2PControl'))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })

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

  // I2P — determine if enabled from config
  const i2pEnabled = !!(bitcoinConf?.raw as Record<string, unknown> | undefined)?.i2psam
  const onlynetList: string[] = (
    (bitcoinConf?.onlynet as string[] | string | undefined) ?? []
  ) as string[]
  const onlynetActive = onlynetList.length > 0
  const runI2pd = i2pEnabled && (!onlynetActive || onlynetList.includes('i2p'))

  const externalip: (string | undefined)[] =
    ((bitcoinConf?.raw as Record<string, unknown> | undefined)?.externalip as (string | undefined)[] | undefined) ?? []

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

  // I2P SubContainer (only created when enabled)
  const i2pdSub = runI2pd
    ? await sdk.SubContainer.of(
        effects,
        { imageId: 'i2pd' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'i2pd',
          mountpoint: '/home/i2pd',
          subpath: null,
          readonly: false,
        }),
        'i2pd-sub',
      )
    : null

  const withBitcoind = sdk.Daemons.of(effects)
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
              return {
                message: `Syncing blocks...${pct}%`,
                result: 'loading',
              }
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

  // I2P daemon (conditional)
  const withI2p = await withBitcoind.addDaemon('i2pd', async () => {
    if (!i2pdSub) return null

    // Fix volume ownership before starting
    await i2pdSub.execFail(['chown', '-R', 'i2pd', '/home/i2pd'], { user: 'root' })

    return {
      subcontainer: i2pdSub,
      exec: { command: sdk.useEntrypoint() },
      ready: {
        display: 'I2P',
        fn: async () => {
          try {
            const auth = await i2pControlRpc('Authenticate', { API: 1, Password: 'itoopie' })
            const token = (auth as Record<string, Record<string, string>>)?.result?.Token
            if (!token) return { result: 'starting' as const, message: '' }

            const info = await i2pControlRpc('RouterInfo', {
              Token: token,
              'i2p.router.net.status': null,
              'i2p.router.netdb.activepeers': null,
            })
            const result = (info as Record<string, Record<string, number>>)?.result
            const netStatus = result?.['i2p.router.net.status']
            const activePeers = result?.['i2p.router.netdb.activepeers']

            if (netStatus >= 8 || activePeers === 0) return { result: 'starting' as const, message: '' }

            const incoming = (bitcoinConf?.raw as Record<string, unknown> | undefined)?.i2pacceptincoming !== false
            return {
              result: 'success' as const,
              message: incoming ? 'Inbound and outbound connections' : 'Outbound connections only',
            }
          } catch {
            return { result: 'starting' as const, message: '' }
          }
        },
      },
      requires: [],
    }
  })

  // I2P health check when disabled
  const withI2pCheck = i2pEnabled && !runI2pd
    ? await withI2p.addHealthCheck('i2p-status', {
        ready: {
          display: 'I2P',
          fn: () => excludedByOnlynet(),
        },
        requires: [],
      })
    : !i2pEnabled
    ? await withI2p.addHealthCheck('i2p-status', {
        ready: {
          display: 'I2P',
          fn: () => ({ result: 'disabled' as const, message: 'I2P is disabled' }),
        },
        requires: [],
      })
    : withI2p

  // Tor health check
  const withTor = withI2pCheck.addHealthCheck('tor', {
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

  // Clearnet health check
  return withTor.addHealthCheck('clearnet', {
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
