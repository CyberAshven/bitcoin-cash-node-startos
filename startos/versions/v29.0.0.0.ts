import { VersionInfo } from '@start9labs/start-sdk'

export const v_29_0_0_0 = VersionInfo.of({
  version: '29.0.0:0',
  releaseNotes:
    'Upgrade to Bitcoin Cash Node v29.0.0. Implements the May 15, 2026 network upgrade ' +
    '(P2S32, native loops, functions, bitwise operations). ' +
    'Nodes running v28.x will stop syncing after the upgrade activates — this update is required for continued operation. ' +
    'All existing settings (network, RPC credentials, ZMQ, config) are preserved.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
