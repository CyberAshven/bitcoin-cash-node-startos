import { totalmem } from 'os'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

function generatePassword(length = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const rpcPassword = generatePassword(32)
  // Dynamic dbcache: 25% of system RAM, capped at 5120 MB
  const dbcache = Math.min(Math.floor((totalmem() * 0.25) / (1024 * 1024)), 5120)

  await storeJson.merge(effects, {
    rpcUser: 'bitcoincashd',
    rpcPassword,
    txindex: false,
    zmqEnabled: true,
    network: 'mainnet',
    initialized: true,
    reindexBlockchain: false,
    reindexChainstate: false,
    fullySynced: false,
    advertiseClearnetInbound: false,
  })

  await bitcoinConfFile.merge(effects, {
    raw: {
      rpcuser: 'bitcoincashd',
      rpcpassword: rpcPassword,
    },
    zmqEnabled: true,
    txindex: false,
    coinstatsindex: true,
    persistmempool: true,
    maxconnections: 125,
    rpcthreads: 4,
    rpcworkqueue: 64,
    dbcache,
  })
})
