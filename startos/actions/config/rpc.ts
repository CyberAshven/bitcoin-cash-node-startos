import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const rpcConfig = sdk.Action.withInput(
  'rpc-config',
  async ({ effects }) => ({
    name: 'RPC Settings',
    description: 'Configure RPC server timeout, threads, and work queue depth.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({
    rpcservertimeout: true,
    rpcthreads: true,
    rpcworkqueue: true,
  }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
