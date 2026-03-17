<p align="center">
  <img src="icon.png" alt="Bitcoin Cash Node Logo" width="21%">
</p>

# Bitcoin Cash Node StartOS Package

This package provides Bitcoin Cash Node (BCHN) as a StartOS service, enabling easy deployment and management of a Bitcoin Cash full node on your StartOS device.

## About Bitcoin Cash Node

Bitcoin Cash Node is a professional grade full node implementation of the Bitcoin Cash protocol. It aims to create sound money that is usable by everyone in the world, enabling peer-to-peer digital cash transactions that scale many orders of magnitude beyond current limits.

## Features

- **Full Node Implementation**: Complete Bitcoin Cash protocol implementation
- **Peer-to-Peer Network**: Connects to the Bitcoin Cash network
- **RPC Interface**: JSON-RPC API for integration, wallets, and miners
- **ZeroMQ Notifications**: Optional real-time block and transaction events for indexers
- **Transaction Index**: Optional `txindex` for full historical tx lookup (required by Fulcrum)
- **Config UI**: Manage txindex, ZMQ, connections, and RPC tuning from the StartOS interface
- **Tor Support**: Automatic onion routing via StartOS
- **Automatic Updates**: Easy version management through StartOS

## Network Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 8332 | HTTP | RPC interface |
| 8333 | TCP | P2P network connections (mainnet) |
| 28332 | TCP | ZeroMQ block notifications (optional) |
| 28333 | TCP | ZeroMQ transaction notifications (optional) |

## Building from Source

1. Set up your [StartOS SDK environment](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk).

2. Clone this repository and `cd` into it.

3. Run `make`.

4. The resulting `.s9pk` can be side loaded into StartOS.

## Configuration

The Bitcoin Cash Node can be configured through the StartOS interface:

- **Node Settings** — Toggle transaction index (`txindex`), ZeroMQ notifications, and max peer connections
- **RPC Settings** — Tune RPC server timeout, threads, and work queue depth

## Support

- **Documentation**: [https://docs.bitcoincashnode.org/](https://docs.bitcoincashnode.org/)
- **Community**: [https://bitcoincashnode.org/](https://bitcoincashnode.org/)
- **Issues**: [https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues)

## License

This package is released under the MIT license. See [LICENSE](LICENSE) for more information.

For a complete list of build options, see [StartOS Packaging Guide](https://docs.start9.com/packaging-guide/building.html)
