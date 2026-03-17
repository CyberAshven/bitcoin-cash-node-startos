import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const shape = z
  .object({
    rpcUser: z.string().catch('bitcoin-cash-node'),
    rpcPassword: z.string().catch(''),
    txindex: z.boolean().catch(false),
    zmqEnabled: z.boolean().catch(false),
    initialized: z.boolean().catch(false),
  })
  .strip()

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  shape,
)
