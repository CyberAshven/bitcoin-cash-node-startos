import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const pruningConfig = sdk.Action.withInput(
  'pruning-config',
  async ({ effects }) => ({
    name: 'Pruning',
    description:
      'Limit blockchain disk usage by pruning old block data. Set to 0 to disable (default). Minimum pruning target is 550 MB. Enabling pruning automatically disables the transaction index.',
    warning:
      'Pruning cannot be undone without re-syncing from genesis. Pruning is incompatible with txindex — enabling it will disable the transaction index.',
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({ prune: true }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    // If pruning is enabled, also clear txindex to avoid incompatibility
    if (input.prune && input.prune > 0) {
      await bitcoinConfFile.merge(effects, { ...input, txindex: false })
    } else {
      await bitcoinConfFile.merge(effects, input)
    }
  },
)
