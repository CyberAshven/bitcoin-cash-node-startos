import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const reindexBlockchain = sdk.Action.withoutInput(
  'reindex-blockchain',
  async ({ effects: _effects }) => ({
    name: 'Reindex Blockchain',
    description:
      'Delete the chainstate and re-verify every block from genesis. This is necessary if the chainstate database is corrupted. The node will restart automatically.',
    warning:
      'This process re-verifies the entire blockchain from scratch and can take many hours or days. Do not interrupt once started.',
    allowedStatuses: 'any' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await storeJson.merge(effects, { reindexBlockchain: true, fullySynced: false })
    await effects.restart()
    return {
      version: '1' as const,
      title: 'Reindex Queued',
      message: 'The node is restarting and will reindex all blocks from genesis. This can take many hours — do not interrupt.',
      result: null,
    }
  },
)
