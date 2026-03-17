import { sdk } from './sdk'
import {
  rpcPort,
  rootDir,
} from './utils'

export const mainMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: rootDir,
  readonly: false,
})

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup (optional) ========================
   */
  const osIp = await sdk.getOsIp(effects)

  const bitcoinArgs: string[] = [
    `-datadir=${rootDir}`,
    `-rpcport=${rpcPort}`,
    `-rpcbind=0.0.0.0:${rpcPort}`,
    `-rpcallowip=0.0.0.0/0`,
    `-server=1`,
    `-onion=${osIp}:9050`,
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
            console.log('Waiting for RPC to be ready')
            return {
              message: 'The Bitcoin Cash Node RPC Interface is not ready',
              result: 'starting',
            }
          }
        },
      },
      requires: [],
    })

  return daemons
})
