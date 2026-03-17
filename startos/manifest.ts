import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'bitcoin-cash-node',
  title: 'Bitcoin Cash Node',
  license: 'MIT',
  packageRepo: 'https://github.com/linkinparkrulz/bitcoin-cash-node-startos',
  upstreamRepo: 'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  marketingUrl: 'https://bitcoincashnode.org/',
  donationUrl: 'https://donate.bitcoincashnode.org/',
  docsUrls: [
    'https://github.com/linkinparkrulz/bitcoin-cash-node-startos/blob/master/docs/instructions.md',
  ],
  description: {
    short: 'Bitcoin Cash Node full implementation',
    long: 'Bitcoin Cash Node is a full node implementation of the Bitcoin Cash protocol that enables peer-to-peer digital cash transactions.',
  },
  volumes: ['main'],
  images: {
    'bitcoin-cash-node': {
      source: { dockerTag: 'mainnet/bitcoin-cash-node:latest' },
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
