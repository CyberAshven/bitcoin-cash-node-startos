import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'bitcoin-cash-node',
  title: 'Bitcoin Cash Node',
  license: 'MIT',
  packageRepo: 'https://github.com/BitcoinCash1/bitcoin-cash-node-startos',
  upstreamRepo: 'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  marketingUrl: 'https://bitcoincashnode.org/',
  donationUrl: 'bitcoincash:prnc2exht3zxlrqqcat690tc85cvfuypngh7szx6mk',
  docsUrls: [
    'https://github.com/BitcoinCash1/bitcoin-cash-node-startos/blob/master/docs/instructions.md',
    'https://github.com/bitcoin-cash-node/bitcoin-cash-node',
  ],
  description: { short, long },
  volumes: ['main'],
  images: {
    'bitcoin-cash-node': {
      source: { dockerTag: 'mainnet/bitcoin-cash-node:v29.0.0' },
      arch: ['x86_64', 'aarch64'],
      emulateMissingAs: 'x86_64',
    },
    knuth: {
      source: { dockerBuild: { dockerfile: 'Dockerfile.knuth' } },
      arch: ['x86_64'],
      emulateMissingAs: 'x86_64',
    },
  },
  alerts: {
    install:
      'Bitcoin Cash Node will begin syncing the full BCH blockchain after installation. Initial Block Download may take several hours depending on your hardware and network speed.',
    update: null,
    uninstall:
      'Uninstalling Bitcoin Cash Node will permanently delete all blockchain data, wallet data, and configuration. Ensure you have a backup before proceeding.',
    restore:
      'Restoring Bitcoin Cash Node will overwrite your current configuration and wallet data. Blockchain data is not included in backups and must be re-synced.',
    start: null,
    stop: null,
  },
  dependencies: {
    tor: {
      description:
        'Enables Tor onion routing for anonymous peer-to-peer connections. When Tor is installed and running, Bitcoin Cash Node automatically routes all connections through the Tor network for enhanced privacy.',
      optional: true,
      metadata: {
        title: 'Tor',
        icon: 'https://raw.githubusercontent.com/Start9Labs/tor-startos/65faea17febc739d910e8c26ff4e61f6333487a8/icon.svg',
      },
    },
  },
})
