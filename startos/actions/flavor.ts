import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const flavorSpec = sdk.InputSpec.of({
  flavor: sdk.Value.select({
    name: 'Node Implementation',
    description:
      'Select which BCH node implementation to run. Both provide the same JSON-RPC and ZMQ interfaces.\n\n' +
      '• BCHN — reference C++ implementation (default)\n' +
      '• Knuth — high-performance C++ reimplementation with LMDB',
    default: 'bchn',
    values: {
      bchn: 'Bitcoin Cash Node (BCHN)',
      knuth: 'Knuth',
    },
  }),
})

export const selectFlavor = sdk.Action.withInput(
  'select-flavor',

  async ({ effects }) => ({
    name: 'Select Implementation',
    description:
      'Choose between BCHN and Knuth node implementations. Changing implementations requires a restart and may require a full blockchain re-sync.',
    warning:
      'Switching implementations will restart the node. If switching for the first time, the new implementation must sync the blockchain from scratch.',
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  flavorSpec,

  async ({ effects }) => {
    const store = await storeJson.read().once()
    return {
      flavor: store?.flavor ?? 'bchn',
    }
  },

  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      flavor: input.flavor as 'bchn' | 'knuth',
    })
    return 'Implementation updated. The node will use the selected implementation on next start.'
  },
)
