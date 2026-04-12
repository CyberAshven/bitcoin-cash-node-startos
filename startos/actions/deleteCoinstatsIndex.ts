import { sdk } from '../sdk'
import { mainMounts } from '../mounts'
import { rootDir } from '../utils'

export const deleteCoinstatsIndex = sdk.Action.withoutInput(
  'delete-coinstats-index',
  async ({ effects: _effects }) => ({
    name: 'Delete Coin Stats Index',
    description:
      'Delete a corrupted coin stats index. The index will be rebuilt automatically on next startup if coinstatsindex is still enabled.',
    warning:
      'The coin stats index will be deleted. If coinstatsindex is enabled, it will be rebuilt on startup.',
    allowedStatuses: 'only-stopped' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoin-cash-node' },
      mainMounts,
      'delete-coinstats',
      async (sub) => {
        await sub.exec(['rm', '-rf', `${rootDir}/indexes/coinstats`])
      },
    )
    return {
      version: '1' as const,
      title: 'Coin Stats Index Deleted',
      message: 'indexes/coinstats has been removed. Enable coinstatsindex and restart to rebuild.',
      result: null,
    }
  },
)
