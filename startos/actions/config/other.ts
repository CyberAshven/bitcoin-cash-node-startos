import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const otherConfig = sdk.Action.withInput(
  'other-config',
  async ({ effects: _effects }) => ({
    name: 'Node Settings',
    description: 'Indexes, pruning, ZeroMQ, mempool persistence, performance cache, and advanced options.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Configuration',
    visibility: 'enabled' as const,
  }),
  fullConfigSpec.filter({
    wallet: true,
    txindex: true,
    coinstatsindex: true,
    peerbloomfilters: true,
    zmqEnabled: true,
    persistmempool: true,
    prune: true,
    dbcache: true,
    dbbatchsize: true,
    blocknotify: true,
  }),
  async ({ effects: _effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    // If pruning is enabled, also clear txindex to avoid incompatibility
    if (input.prune && input.prune > 0) {
      await bitcoinConfFile.merge(effects, { ...input, txindex: false })
    } else {
      await bitcoinConfFile.merge(effects, input)
    }
  },
)
