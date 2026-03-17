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

  await storeJson.merge(effects, {
    rpcUser: 'bitcoin-cash-node',
    rpcPassword,
    txindex: false,
    zmqEnabled: false,
    initialized: true,
  })

  await bitcoinConfFile.merge(effects, {
    raw: {
      rpcuser: 'bitcoin-cash-node',
      rpcpassword: rpcPassword,
    },
    zmqEnabled: false,
    txindex: false,
    maxconnections: 125,
    rpcthreads: 4,
    rpcworkqueue: 64,
  })
})
