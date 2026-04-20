import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const peersConfig = sdk.Action.withInput(
  'peers-config',
  async ({ effects: _effects }) => ({
    name: 'RPC & Peers Settings',
    description: 'Configure RPC server tuning, peer connections, network restrictions, and bandwidth limits.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Configuration',
    visibility: 'enabled' as const,
  }),
  fullConfigSpec.filter({
    rpcservertimeout: true,
    rpcthreads: true,
    rpcworkqueue: true,
    maxconnections: true,
    maxuploadtarget: true,
    peerbloomfilters: true,
    onlynet: true,
    onionOnly: true,
    addnode: true,
  }),
  async ({ effects: _effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
