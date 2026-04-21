import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { mainMounts } from '../mounts'
import { rootDir, Network } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  networks: Value.multiselect({
    name: 'Networks To Delete',
    description:
      'Delete all BCHN blockchain data for the selected test networks. Mainnet is intentionally excluded and cannot be selected.',
    warning:
      'This permanently deletes all blockchain data for the selected networks. You cannot undo this. Mainnet data is never affected.',
    default: [],
    minLength: 0,
    maxLength: null,
    values: {
      testnet3: 'Testnet3',
      chipnet: 'Chipnet',
      regtest: 'Regtest',
    },
  }),
})

// Subdirectory names BCHN creates under -datadir for each test network
const testNetSubdirs: Record<string, string> = {
  testnet3: 'testnet3',
  chipnet: 'chipnet',
  regtest: 'regtest',
}

export const deleteTestNetworkData = sdk.Action.withInput(
  'delete-test-network-data',
  async ({ effects: _effects }) => ({
    name: 'Delete Test Network Data',
    description:
      'Delete blockchain data for one or more test networks (Testnet3, Chipnet, Regtest). This frees disk space without touching mainnet.',
    warning:
      'All block data and chainstate for the selected networks will be permanently deleted. Mainnet is never affected.',
    allowedStatuses: 'only-stopped' as const,
    group: 'Maintenance',
    visibility: 'enabled' as const,
  }),
  inputSpec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    const active: Network = store?.network ?? 'mainnet'
    // Pre-fill everything except the currently active test network
    const defaults = (['testnet3', 'chipnet', 'regtest'] as const).filter((n) => n !== active)
    return { networks: defaults }
  },
  async ({ effects, input }) => {
    const networks = (input.networks ?? []).filter(Boolean) as string[]
    if (networks.length === 0) {
      return {
        version: '1' as const,
        title: 'Nothing to Delete',
        message: 'No networks were selected.',
        result: null,
      }
    }

    const store = await storeJson.read().once()
    const activeNetwork: Network = store?.network ?? 'mainnet'

    // Block deletion of the currently active network
    const activeTestNet = activeNetwork !== 'mainnet' ? activeNetwork : null
    if (activeTestNet && networks.includes(activeTestNet)) {
      return {
        version: '1' as const,
        title: 'Cannot Delete Active Network',
        message: `BCHN is currently running on ${activeTestNet}. Stop the service and switch to a different network before deleting its data.`,
        result: null,
      }
    }

    const removed: string[] = []

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoin-cash-node' },
      mainMounts,
      'delete-test-net-data',
      async (sub) => {
        for (const net of networks) {
          const subdir = testNetSubdirs[net]
          if (!subdir) continue
          const dataPath = `${rootDir}/${subdir}`
          const res = await sub.exec(['rm', '-rf', dataPath])
          if (res.exitCode === 0) {
            removed.push(dataPath)
          }
        }
      },
    )

    if (removed.length === 0) {
      return {
        version: '1' as const,
        title: 'Nothing Removed',
        message: 'The selected network data directories did not exist or could not be removed.',
        result: null,
      }
    }

    return {
      version: '1' as const,
      title: 'Test Network Data Deleted',
      message: `Removed: ${removed.join(', ')}. Mainnet data was not touched.`,
      result: null,
    }
  },
)
