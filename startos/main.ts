import { sdk } from './sdk'
import { rpcPort, rootDir } from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { GetBlockchainInfo } from './utils'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  const osIp = await sdk.getOsIp(effects)

  // Ensure bitcoin.conf exists before starting
  await bitcoinConfFile.read().once()

  const bitcoinArgs: string[] = [
    `-conf=${rootDir}/bitcoin.conf`,
    `-datadir=${rootDir}`,
    ...(osIp ? [`-onion=${osIp}:9050`] : []),
  ]

  const bitcoindSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'bitcoin-cash-node' },
    mainMounts,
    'bitcoind-sub',
  )

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
            const res = await bitcoindSub.exec([
              'bitcoin-cli',
              `-rpcconnect=127.0.0.1:${rpcPort}`,
              `-rpccookiefile=${rootDir}/.cookie`,
              'getrpcinfo',
            ])
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
        display: 'Blockchain Sync Progress',
        fn: async () => {
          try {
            const res = await bitcoindSub.exec([
              'bitcoin-cli',
              `-rpcconnect=127.0.0.1:${rpcPort}`,
              `-rpccookiefile=${rootDir}/.cookie`,
              'getblockchaininfo',
            ])
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
            return {
              message: `Blockchain synced at block ${info.blocks}`,
              result: 'success',
            }
          } catch {
            return { message: 'Waiting for sync info', result: 'loading' }
          }
        },
      },
      requires: ['primary'],
    })

  return daemons
})
