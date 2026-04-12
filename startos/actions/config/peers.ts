import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const peersConfig = sdk.Action.withInput(
  'peers-config',
  async ({ effects: _effects }) => ({
    name: 'Peer Settings',
    description: 'Configure peer connections, network restrictions, and bandwidth limits.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Configuration',
    visibility: 'enabled' as const,
  }),
  fullConfigSpec.filter({
    maxconnections: true,
    peerbloomfilters: true,
    onlynet: true,
    addnode: true,
    maxuploadtarget: true,
  }),
  async ({ effects: _effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
