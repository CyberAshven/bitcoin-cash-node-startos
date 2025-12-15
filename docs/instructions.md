# Instructions for Bitcoin Cash Node on StartOS

This package provides Bitcoin Cash Node (BCHN) as a StartOS service, enabling easy deployment and management of a Bitcoin Cash full node.

## Installation

1. **Download the Package**: Obtain the `bitcoin-cash-node.s9pk` file from the [releases page](https://github.com/linkinparkrulz/bitcoin-cash-node-startos/releases) or build it yourself from source.

2. **Install on StartOS**: 
   - Navigate to your StartOS web interface
   - Go to "Services" → "Install Service"
   - Upload the `bitcoin-cash-node.s9pk` file
   - Follow the installation prompts

## Initial Configuration

After installation, your Bitcoin Cash Node will:

1. **Start Syncing**: Automatically begin downloading and validating the Bitcoin Cash blockchain
2. **Expose RPC**: RPC interface available on port 8332 (if enabled)
3. **Connect to Network**: Establish P2P connections on port 8333

## Configuration Options

### Basic Settings
- **Network**: Choose between Mainnet and Testnet
- **RPC Access**: Enable/disable JSON-RPC interface
- **Data Directory**: Location for blockchain and wallet data

### Advanced Settings
- **Pruning**: Reduce disk usage by pruning old blocks
- **RPC Credentials**: Set username/password for RPC access
- **Connection Limits**: Configure maximum peer connections

## Usage

### Web Interface
Access your Bitcoin Cash Node through the StartOS web interface to:
- Monitor sync status
- View node information
- Manage wallet operations
- Configure settings

### RPC API
If RPC is enabled, you can interact with your node using tools like:
- `bitcoin-cli` (within the container)
- External wallet software
- Custom scripts

Example RPC call:
```bash
curl --user user:pass --data-binary '{"jsonrpc":"1.0","id":"1","method":"getblockchaininfo","params":[]}' -H 'content-type: application/json' http://localhost:8332/
```

## Network Ports

- **8332**: JSON-RPC interface (mainnet)
- **8333**: P2P network connections (mainnet)
- **18332**: JSON-RPC interface (testnet)
- **18333**: P2P network connections (testnet)

## Security Considerations

1. **RPC Security**: Always use strong RPC credentials if exposing RPC interface
2. **Firewall**: Ensure only necessary ports are accessible
3. **Backups**: Regularly backup your wallet files
4. **Updates**: Keep your node updated for security patches

## Troubleshooting

### Common Issues

**Node Not Syncing**:
- Check internet connectivity
- Verify port 8333 is accessible
- Review StartOS logs for errors

**RPC Not Working**:
- Ensure RPC is enabled in configuration
- Verify correct port (8332 for mainnet)
- Check firewall settings

**High Memory Usage**:
- Consider enabling pruning in configuration
- Monitor system resources in StartOS

## Support

For additional help and documentation:
- **BCHN Documentation**: [https://docs.bitcoincashnode.org/](https://docs.bitcoincashnode.org/)
- **StartOS Documentation**: [https://docs.start9.com/](https://docs.start9.com/)
- **Community Support**: [https://bitcoincashnode.org/](https://bitcoincashnode.org/)
- **Issue Reporting**: [https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues)

## Building from Source

See the main [README](../README.md) for instructions on building this package from source code.
