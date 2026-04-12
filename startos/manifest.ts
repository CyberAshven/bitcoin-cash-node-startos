import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'bitcoin-cash-node',
  title: 'Bitcoin Cash Node',
  license: 'MIT',
  packageRepo: 'https://github.com/CyberAshven/bitcoin-cash-node-startos',
  upstreamRepo: 'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  marketingUrl: 'https://bitcoincashnode.org/',
  donationUrl: 'bitcoincash:prnc2exht3zxlrqqcat690tc85cvfuypngh7szx6mk',
  docsUrls: [
    'https://github.com/CyberAshven/bitcoin-cash-node-startos/blob/master/docs/instructions.md',
    'https://github.com/bitcoin-cash-node/bitcoin-cash-node',
  ],
  description: {
    short: 'Bitcoin Cash Node full implementation',
    long: 'Bitcoin Cash Node (BCHN) v29.0.0 — a full node implementation of the Bitcoin Cash protocol with support for the May 2026 network upgrade (P2S32, native loops, functions, bitwise operations). Enables peer-to-peer digital cash transactions on mainnet, testnet3, chipnet, or regtest.',
  },
  volumes: ['main'],
  images: {
    'bitcoin-cash-node': {
      source: { dockerTag: 'mainnet/bitcoin-cash-node:v29.0.0' },
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall:
      'Uninstalling Bitcoin Cash Node will permanently delete all blockchain data, wallet data, and configuration. Ensure you have a backup before proceeding.',
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {
    tor: {
      description:
        'Enables Tor onion routing for anonymous peer-to-peer connections. When Tor is installed and running, Bitcoin Cash Node automatically routes all connections through the Tor network for enhanced privacy.',
      optional: true,
      s9pk: null,
    },
  },
})
