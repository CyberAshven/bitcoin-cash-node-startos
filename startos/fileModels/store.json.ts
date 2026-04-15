import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const shape = z
  .object({
    flavor: z.enum(['bchn', 'knuth']).catch('bchn'),
    rpcUser: z.string().catch('bitcoin-cash-node'),
    rpcPassword: z.string().catch(''),
    txindex: z.boolean().catch(false),
    zmqEnabled: z.boolean().catch(false),
    // testnet4 excluded (port conflict with ZMQ 28332/28333)
    network: z
      .enum(['mainnet', 'testnet3', 'chipnet', 'regtest'])
      .catch('mainnet'),
    initialized: z.boolean().catch(false),
    reindexBlockchain: z.boolean().catch(false),
    reindexChainstate: z.boolean().catch(false),
    fullySynced: z.boolean().catch(false),
  })
  .strip()

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)
