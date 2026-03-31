import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'bitcoin-cash-node',
  title: 'Bitcoin Cash Node',
  license: 'MIT',
  packageRepo: 'https://github.com/linkinparkrulz/bitcoin-cash-node-startos',
  upstreamRepo: 'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  marketingUrl: 'https://bitcoincashnode.org/',
  donationUrl: 'bitcoincash:prnc2exht3zxlrqqcat690tc85cvfuypngh7szx6mk',
  docsUrls: [
    'https://github.com/linkinparkrulz/bitcoin-cash-node-startos/blob/master/docs/instructions.md',
    'https://github.com/bitcoin-cash-node/bitcoin-cash-node',
    'https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node',
  ],
  description: {
    short: 'Bitcoin Cash Node full implementation (pre-release)',
    long: 'Bitcoin Cash Node (BCHN) — pre-release testing build. Tracks the latest available Docker image. Based on v29.0.0 with May 2026 network upgrade support. For testing only; use the stable release for production.',
  },
  volumes: ['main'],
  images: {
    'bitcoin-cash-node': {
      source: { dockerTag: 'mainnet/bitcoin-cash-node:latest' }, // pre-release: tracks future BCHN builds
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
