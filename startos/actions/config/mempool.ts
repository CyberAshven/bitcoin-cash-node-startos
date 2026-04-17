import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const mempoolConfig = sdk.Action.withInput(
  'mempool-config',
  async ({ effects }) => ({
    name: 'Mempool & Block Policy',
    description:
      'Configure mempool size, relay fees, expiry, excessive block size, and ancestor/descendant limits.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({
    maxmempool: true,
    minrelaytxfee: true,
    mempoolexpiry: true,
    excessiveblocksize: true,
    limitancestorcount: true,
    limitdescendantcount: true,
  }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
