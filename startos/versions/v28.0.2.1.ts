import { VersionInfo } from '@start9labs/start-sdk'

export const v_28_0_2_1 = VersionInfo.of({
  version: '#bchn:28.0.2:1',
  releaseNotes:
    'Network selector (mainnet/testnet3/chipnet/regtest), DSP ZMQ streams (28334/28335), ' +
    'mempool/relay/pruning/block policy config, RPC credentials view, peer count health check.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
