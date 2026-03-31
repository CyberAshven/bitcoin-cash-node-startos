import { VersionInfo } from '@start9labs/start-sdk'

export const v_29_0_0_0_pre = VersionInfo.of({
  version: '29.0.0:0-pre',
  releaseNotes:
    'Pre-release build tracking mainnet/bitcoin-cash-node:latest Docker image. ' +
    'Based on BCHN v29.0.0 with May 2026 network upgrade support (P2S32, native loops, functions, bitwise operations). ' +
    'Nodes running v28.x will stop syncing after May 15, 2026 — this update is required. ' +
    'Use the stable release for production.',
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
