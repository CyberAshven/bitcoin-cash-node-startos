import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const reindexChainstate = sdk.Action.withoutInput(
  'reindex-chainstate',
  async ({ effects: _effects }) => ({
    name: 'Reindex Chainstate',
    description:
      'Rebuild the UTXO chainstate from the existing block index without re-downloading blocks. Faster than a full reindex. Use this if the chainstate is corrupted but blocks are intact.',
    warning:
      'This process rebuilds the chainstate database and can take several hours. The node will restart automatically.',
    allowedStatuses: 'any' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await storeJson.merge(effects, { reindexChainstate: true, fullySynced: false })
    await effects.restart()
    return null
  },
)
