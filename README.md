<p align="center">
  <img src="icon.png" alt="Bitcoin Cash Node Logo" width="21%">
</p>

# Bitcoin Cash Node StartOS Package

This package provides **Bitcoin Cash Node (BCHN) v29.0.0** as a StartOS service, enabling easy deployment and management of a Bitcoin Cash full node on your StartOS device.

> **v29.0.0** implements the May 15, 2026 network upgrade (P2S32, native loops, functions, bitwise operations). Nodes running v28.x will stop syncing after the upgrade activates — this version is required.

## About Bitcoin Cash Node

Bitcoin Cash Node is a professional grade full node implementation of the Bitcoin Cash protocol. It aims to create sound money that is usable by everyone in the world, enabling peer-to-peer digital cash transactions that scale many orders of magnitude beyond current limits.

## Features 

- **Full Node Implementation**: Complete Bitcoin Cash protocol implementation
- **Peer-to-Peer Network**: Connects to the Bitcoin Cash network
- **RPC Interface**: JSON-RPC API for integration, wallets, and miners
- **ZeroMQ Notifications**: Optional real-time block and transaction events for indexers
- **Transaction Index**: Optional `txindex` for full historical tx lookup (required by Fulcrum)
- **Double Spend Proofs**: DSP relay always active with ZMQ push streams for payment processors
- **Config UI**: Manage txindex, ZMQ, connections, and RPC tuning from the StartOS interface
- **Tor Support**: Automatic onion routing via StartOS

## Network Ports

This package runs **mainnet** by default. Network is selectable (mainnet / testnet3 / chipnet / regtest).

| Port | Protocol | Purpose |
|------|----------|---------|
| 8332 | HTTP | RPC interface (mainnet) |
| 8333 | TCP | P2P network connections (mainnet) |
| 28332 | TCP | ZeroMQ block notifications (when enabled) |
| 28333 | TCP | ZeroMQ transaction notifications (when enabled) |
| 28334 | TCP | ZeroMQ DSP hash notifications (always on) |
| 28335 | TCP | ZeroMQ DSP raw tx notifications (always on) |

> **Note:** BCHN also supports testnet3 (18332/18333), chipnet (48332/48333), and regtest (18443/18444). Testnet4 is excluded — its ports (28332/28333) conflict with ZMQ.

## Building from Source

1. Set up your [StartOS SDK environment](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk).
2. Clone this repository and `cd` into it.
3. Run `make`.
4. The resulting `.s9pk` can be side loaded into StartOS.

## Configuration

The Bitcoin Cash Node can be configured through the StartOS interface:

- **Node Settings** — Toggle transaction index (`txindex`), ZeroMQ notifications, and max peer connections
- **RPC Settings** — Tune RPC server timeout, threads, and work queue depth
- **Mempool & Relay** — Max mempool size, minimum relay fee, mempool expiry
- **Pruning** — Limit blockchain storage (incompatible with txindex)
- **Block Policy** — Excessive block size, ancestor/descendant limits
- **Network** — Select mainnet, testnet3, chipnet, or regtest
- **View RPC Credentials** — Display username, password, and port for external tools

## Support

- **Documentation**: [https://docs.bitcoincashnode.org/](https://docs.bitcoincashnode.org/)
- **Community**: [https://bitcoincashnode.org/](https://bitcoincashnode.org/)
- **Issues**: [https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues)
- **GitHub Mirror**: [https://github.com/bitcoin-cash-node/bitcoin-cash-node](https://github.com/bitcoin-cash-node/bitcoin-cash-node)

## License

This package is released under the MIT license. See [LICENSE](LICENSE) for more information.

For a complete list of build options, see [StartOS Packaging Guide](https://docs.start9.com/packaging-guide/building.html)
