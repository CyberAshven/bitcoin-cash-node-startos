import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const otherConfig = sdk.Action.withInput(
  'other-config',
  async ({ effects }) => ({
    name: 'Node Settings',
    description: 'Transaction index, ZeroMQ notifications, and connection limits.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({ txindex: true, zmqEnabled: true, maxconnections: true }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
