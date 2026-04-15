import { FLAVOR } from '../flavor'

export const short =
  FLAVOR === 'knuth'
    ? { en_US: 'Knuth Node — high-performance BCH full node with IPC' }
    : { en_US: 'Bitcoin Cash Node full implementation' }

export const long =
  FLAVOR === 'knuth'
    ? {
        en_US:
          'Knuth Node — a high-performance C++ BCH full node with IPC/C-API bindings, ' +
          'Bitcoin Core-compatible JSON-RPC, ZeroMQ notifications, and UTXO set queries. ' +
          'Optimised for miners and services requiring low-latency access. ' +
          'Flavor-swappable with BCHN — all data and credentials are preserved during swap.',
      }
    : {
        en_US:
          'Bitcoin Cash Node (BCHN) v29.0.0 — a full node implementation of the Bitcoin Cash protocol ' +
          'with support for the May 2026 network upgrade (P2S32, native loops, functions, bitwise operations). ' +
          'Enables peer-to-peer digital cash transactions on mainnet, testnet3, chipnet, or regtest.',
      }
