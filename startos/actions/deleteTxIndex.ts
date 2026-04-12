import { sdk } from '../sdk'
import { mainMounts } from '../mounts'
import { rootDir } from '../utils'

export const deleteTxIndex = sdk.Action.withoutInput(
  'delete-tx-index',
  async ({ effects: _effects }) => ({
    name: 'Delete Transaction Index',
    description:
      'Delete a corrupted transaction index. The index will be rebuilt automatically on next startup if txindex is still enabled.',
    warning:
      'The transaction index will be deleted. If txindex is enabled, it will be rebuilt on startup (this can take hours).',
    allowedStatuses: 'only-stopped' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoin-cash-node' },
      mainMounts,
      'delete-txindex',
      async (sub) => {
        await sub.exec(['rm', '-rf', `${rootDir}/indexes/txindex`])
      },
    )
    return {
      version: '1' as const,
      title: 'Transaction Index Deleted',
      message: 'indexes/txindex has been removed. Enable txindex and restart to rebuild.',
      result: null,
    }
  },
)
