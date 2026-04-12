import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const otherConfig = sdk.Action.withInput(
  'other-config',
  async ({ effects: _effects }) => ({
    name: 'Node Settings',
    description: 'Indexes, ZeroMQ, mempool persistence, performance cache, and advanced options.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Configuration',
    visibility: 'enabled' as const,
  }),
  fullConfigSpec.filter({
    txindex: true,
    zmqEnabled: true,
    persistmempool: true,
    dbcache: true,
    dbbatchsize: true,
    blocknotify: true,
    wallet: true,
  }),
  async ({ effects: _effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
