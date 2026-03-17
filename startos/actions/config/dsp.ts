import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'
import { zmqPortDspHash, zmqPortDspRaw } from '../../utils'

export const dspConfig = sdk.Action.withInput(
  'dsp-config',
  async ({ effects }) => ({
    name: 'Double Spend Proofs',
    description: [
      'DSP relay is always active on this node — when BCHN detects a double-spend attempt it creates a cryptographic proof and broadcasts it to the network automatically.',
      '',
      'This section controls the optional ZMQ push streams for integrators:',
      `• zmqpubhashds  (port ${zmqPortDspHash}) — publishes the TX hash of the conflicting transaction`,
      `• zmqpubrawds   (port ${zmqPortDspRaw}) — publishes the raw bytes of the conflicting transaction`,
      '',
      'Payment processors and exchanges can subscribe to these streams to get instant push notifications when a 0-conf payment is being double-spent, instead of polling via RPC.',
      '',
      'For on-demand checks, use the RPC command: getdsproofscore <txid>',
      '  1.0 = no DSP detected (safe)',
      '  0.0 = double-spend proof exists (payment at risk)',
    ].join('\n'),
    warning: null,
    allowedStatuses: 'any',
    group: 'Configuration',
    visibility: 'enabled',
  }),
  fullConfigSpec.filter({ zmqDspEnabled: true }),
  async ({ effects }) => bitcoinConfFile.read().once(),
  async ({ effects, input }) => {
    await bitcoinConfFile.merge(effects, input)
  },
)
