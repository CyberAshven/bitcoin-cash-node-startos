import { setupManifest } from '@start9labs/start-sdk'
import { FLAVOR, FLAVOR_LABEL } from '../flavor'
import { long, short } from './i18n'

const flavorLabel = FLAVOR_LABEL[FLAVOR]

/**
 * Manifest for the bitcoin-cash-node package.
 *
 * Two flavors share this package ID:
 *   bchn  — Bitcoin Cash Node (C++ reference implementation)
 *   knuth — Knuth Node (C++ high-performance, IPC/C-API)
 *
 * Build with FLAVOR=knuth to produce the Knuth variant.
 */
export const manifest = setupManifest({
  id: 'bitcoin-cash-node',
  title: flavorLabel,
  license: 'MIT',
  packageRepo: 'https://github.com/BitcoinCash1/bitcoin-cash-node-startos',
  upstreamRepo:
    FLAVOR === 'knuth'
      ? 'https://github.com/k-nuth/kth'
      : 'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  marketingUrl:
    FLAVOR === 'knuth' ? 'https://kth.cash' : 'https://bitcoincashnode.org/',
  donationUrl:
    FLAVOR === 'knuth'
      ? null
      : 'bitcoincash:prnc2exht3zxlrqqcat690tc85cvfuypngh7szx6mk',
  docsUrls: [
    'https://github.com/BitcoinCash1/bitcoin-cash-node-startos/blob/master/docs/instructions.md',
    ...(FLAVOR === 'knuth'
      ? ['https://github.com/k-nuth/kth']
      : ['https://github.com/bitcoin-cash-node/bitcoin-cash-node']),
  ],
  description: { short, long },
  volumes: ['main'],
  images:
    FLAVOR === 'knuth'
      ? {
          // TODO: Replace with real Knuth Docker image when available
          'knuth-node': {
            source: { dockerBuild: {} },
            arch: ['x86_64', 'aarch64'],
            emulateMissingAs: 'x86_64',
          },
        }
      : {
          'bitcoin-cash-node': {
            source: { dockerTag: 'mainnet/bitcoin-cash-node:v29.0.0' },
            arch: ['x86_64', 'aarch64'],
            emulateMissingAs: 'x86_64',
          },
        },
  alerts: {
    install: `${flavorLabel} will begin syncing the full BCH blockchain after installation. Initial Block Download may take several hours depending on your hardware and network speed.`,
    update:
      FLAVOR === 'knuth'
        ? null
        : null,
    uninstall: `Uninstalling ${flavorLabel} will permanently delete all blockchain data, wallet data, and configuration. Ensure you have a backup before proceeding.`,
    restore: `Restoring ${flavorLabel} will overwrite your current configuration and wallet data. Blockchain data is not included in backups and must be re-synced.`,
    start: null,
    stop: null,
  },
  dependencies: {
    tor: {
      description: `Enables Tor onion routing for anonymous peer-to-peer connections. When Tor is installed and running, ${flavorLabel} automatically routes all connections through the Tor network for enhanced privacy.`,
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
