import { VersionInfo } from '@start9labs/start-sdk'

/**
 * Knuth Node v0.1.0 — COMING SOON placeholder.
 *
 * Knuth is a high-performance C++ BCH full node with:
 *   ✅ Bitcoin Core-compatible JSON-RPC
 *   ✅ ZeroMQ notifications
 *   ✅ IPC / C-API bindings (like Bitcoin Core) — better perf for miners
 *   ✅ UTXO set queries (enabled by default)
 *   ❌ Compact block filters (not planned)
 *
 * Cross-flavor migration from BCHN is defined below.
 * When the Knuth Docker image is ready, update:
 *   1. manifest/index.ts — knuth-node image tag
 *   2. flavor.ts — DAEMON_BIN / CLI_BIN if names differ
 *   3. This file — bump version to match real upstream release
 */
export const knuth_v_0_1_0_0 = VersionInfo.of({
  version: '#knuth:0.1.0:0',
  releaseNotes:
    'Initial Knuth Node flavor — high-performance C++ BCH full node with IPC/C-API, ' +
    'Bitcoin Core-compatible JSON-RPC, ZMQ, and UTXO set queries. ' +
    'Flavor-swappable with BCHN. All data (blockchain, config, credentials) is preserved during swap.',
  migrations: {
    up: async ({ effects }) => {
      // Fresh install as Knuth — set flavor flag
      // TODO: Knuth-specific init (UTXO queries on by default, IPC enabled)
    },
    down: async ({ effects }) => {
      // Downgrade within Knuth versions — no-op for initial release
    },
    other: {
      // Migration FROM any BCHN version TO this Knuth version
      '#bchn:>=28.0.2:0': {
        up: async ({ effects }) => {
          // Swap from BCHN → Knuth
          // Blockchain data and RPC credentials are preserved.
          // Config differences are handled by main.ts flavor detection.
          console.log('Migrating from BCHN to Knuth flavor')
        },
        down: async ({ effects }) => {
          // Swap from Knuth → BCHN (rollback)
          console.log('Rolling back from Knuth to BCHN flavor')
        },
      },
    },
  },
})
