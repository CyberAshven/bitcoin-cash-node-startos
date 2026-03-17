import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'

export const blockPolicyConfig = sdk.Action.withInput(
  'block-policy-config',
  async ({ effects }) => ({
    name: 'Block Policy',
    description:
      'Configure excessive block size limit and mempool ancestor/descendant limits. Relevant for miners and node operators tracking the BCH roadmap.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({
    excessiveblocksize: true,
    limitancestorcount: true,
    limitdescendantcount: true,
  }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
