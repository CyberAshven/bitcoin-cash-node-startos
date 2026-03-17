import { VersionInfo } from '@start9labs/start-sdk'

export const v_28_0_2_1 = VersionInfo.of({
  version: '28.0.2:1',
  releaseNotes: [
    'Network selector: mainnet, testnet3, chipnet, regtest',
    'DSP ZMQ streams: push notifications for double-spend attempts (ports 28334/28335)',
    'DSP relay forced always-on with getdsproofscore support noted in UI',
    'New config sections: Mempool & Relay, Pruning, Block Policy',
    'View RPC Credentials action',
    'Peer count health check',
    'Advanced options: excessiveblocksize, ancestor/descendant limits, maxmempool, minrelaytxfee',
  ].join('\n'),
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
