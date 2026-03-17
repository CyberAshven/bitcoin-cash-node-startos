import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { networkPorts, Network } from '../utils'

const { InputSpec, Value } = sdk

const credentialsSpec = InputSpec.of({
  rpcUser: Value.text({
    name: 'RPC Username',
    description: 'Username for JSON-RPC authentication.',
    required: true,
    default: null,
    masked: false,
    placeholder: null,
  }),
  rpcPassword: Value.text({
    name: 'RPC Password',
    description: 'Password for JSON-RPC authentication.',
    required: true,
    default: null,
    masked: true,
    placeholder: null,
  }),
  rpcPort: Value.number({
    name: 'RPC Port',
    description: 'RPC listening port for the currently active network.',
    required: true,
    default: 8332,
    integer: true,
    placeholder: '8332',
  }),
})

export const viewCredentials = sdk.Action.withInput(
  'view-credentials',
  async ({ effects }) => ({
    name: 'View RPC Credentials',
    description:
      'Display the current RPC username, password, and port for connecting external tools (wallets, indexers, miners).',
    warning: null,
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),
  credentialsSpec,
  async ({ effects }) => {
    const store = await storeJson.read().once()
    const network: Network = store?.network ?? 'mainnet'
    return {
      rpcUser: store?.rpcUser ?? 'bitcoin-cash-node',
      rpcPassword: store?.rpcPassword ?? '',
      rpcPort: networkPorts[network].rpc,
    }
  },
  // Read-only action — no changes on submit
  async ({ effects, input }) => {},
)
