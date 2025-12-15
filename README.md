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
- **Wallet Support**: Full wallet functionality for BCH transactions
- **RPC Interface**: JSON-RPC API for integration and monitoring
- **Automatic Updates**: Easy version management through StartOS

## Building from source

1. Set up your [environment](https://docs.start9.com/packaging-guide/environment-setup.html).

2. Clone this repository and `cd` into it.

3. Run `make`.

4. The resulting `.s9pk` can be side loaded into StartOS.

## Configuration

The Bitcoin Cash Node can be configured through:
- StartOS web interface
- RPC API calls
- Configuration files (advanced users)

## Network Ports

- **8332**: RPC interface (when enabled)
- **8333**: P2P network connections (mainnet)
- **18332**: RPC interface (testnet)
- **18333**: P2P network connections (testnet)

## Support

- **Documentation**: [https://docs.bitcoincashnode.org/](https://docs.bitcoincashnode.org/)
- **Community**: [https://bitcoincashnode.org/](https://bitcoincashnode.org/)
- **Issues**: [https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues)

## License

This package is released under the MIT license. See [LICENSE](LICENSE) for more information.

For a complete list of build options, see [StartOS Packaging Guide](https://docs.start9.com/packaging-guide/building.html)
