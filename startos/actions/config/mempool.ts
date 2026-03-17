import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const mempoolConfig = sdk.Action.withInput(
  'mempool-config',
  async ({ effects }) => ({
    name: 'Mempool & Relay',
    description:
      'Configure mempool size, transaction relay fee floor, and mempool expiry. Relevant for miners, service providers, and DSPs.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({
    maxmempool: true,
    minrelaytxfee: true,
    mempoolexpiry: true,
  }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
