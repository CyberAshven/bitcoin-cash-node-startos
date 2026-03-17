import { sdk } from '../../sdk'
import { storeJson } from '../../fileModels/store.json'

const { InputSpec, Value } = sdk

const networkSpec = InputSpec.of({
  network: Value.select({
    name: 'Network',
    description:
      'Bitcoin Cash network to connect to. Changing this requires a node restart. Note: testnet4 is not available — its default ports (28332/28333) conflict with the ZMQ block notification ports.',
    warning:
      'Switching networks requires a full restart. The node will sync from scratch on the new network. Your mainnet data is preserved separately on disk.',
    values: {
      mainnet:  'Mainnet (production BCH)',
      testnet3: 'Testnet3 (legacy test network)',
      chipnet:  'Chipnet (upgrade / chip testing)',
      regtest:  'Regtest (local testing only)',
    },
    default: 'mainnet',
  }),
})

export const networkConfig = sdk.Action.withInput(
  'network-config',
  async ({ effects }) => ({
    name: 'Network',
    description:
      'Select the Bitcoin Cash network. RPC and P2P ports adjust automatically for the selected network.',
    warning:
      'Changing the network requires a node restart. RPC and P2P ports will change to match the selected network.',
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  networkSpec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    return { network: store?.network ?? 'mainnet' }
  },
  async ({ effects, input }) => {
    await storeJson.merge(effects, { network: input.network })
  },
)
