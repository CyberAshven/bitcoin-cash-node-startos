/**
 * Build-time flavor selector.
 *
 * Two flavors share the same package ID ("bitcoin-cash-node"):
 *   bchn  — Bitcoin Cash Node (C++, reference implementation)
 *   knuth — Knuth Node (C++, high-performance, IPC/C-API)
 *
 * To build the Knuth variant:  FLAVOR=knuth npm run build
 * Default build produces the BCHN variant.
 */
export type Flavor = 'bchn' | 'knuth'
export const FLAVOR: Flavor = (process.env.FLAVOR as Flavor) || 'bchn'

/** Per-flavor Docker image IDs (must match keys in manifest.images) */
export const IMAGE_ID: Record<Flavor, string> = {
  bchn: 'bitcoin-cash-node',
  knuth: 'knuth-node',
}

/** Per-flavor daemon binary */
export const DAEMON_BIN: Record<Flavor, string> = {
  bchn: 'bitcoind',
  knuth: 'kth', // Knuth binary — update when Docker image is finalised
}

/** Per-flavor CLI binary (for RPC health checks) */
export const CLI_BIN: Record<Flavor, string> = {
  bchn: 'bitcoin-cli',
  knuth: 'kth-cli', // Placeholder — Knuth may use curl-based JSON-RPC instead
}

/** Human-readable labels */
export const FLAVOR_LABEL: Record<Flavor, string> = {
  bchn: 'Bitcoin Cash Node',
  knuth: 'Knuth Node',
}
