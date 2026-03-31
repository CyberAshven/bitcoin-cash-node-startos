# Instructions for Bitcoin Cash Node on StartOS

This package provides Bitcoin Cash Node (BCHN) v29.0.0 as a StartOS service, enabling easy deployment and management of a Bitcoin Cash full node.

## Installation

1. **Download the Package**: Obtain the `bitcoin-cash-node.s9pk` file from the [releases page](https://github.com/CyberAshven/bitcoin-cash-node-startos/releases) or build it yourself from source.

2. **Install on StartOS**:
   - Navigate to your StartOS web interface
   - Go to **Services** → **Install Service**
   - Upload the `bitcoin-cash-node.s9pk` file
   - Follow the installation prompts

## Initial Configuration

After installation, your Bitcoin Cash Node will:

1. **Start Syncing**: Automatically begin downloading and validating the Bitcoin Cash blockchain
2. **Expose RPC**: JSON-RPC interface available on port 8332 (mainnet)
3. **Connect to Network**: Establish P2P connections on port 8333
4. **DSP Streams Active**: Double Spend Proof ZMQ streams are always on (ports 28334/28335)

Initial blockchain sync takes time depending on your hardware and connection speed.

## Configuration Options

All settings are managed through the StartOS service interface under **Config**.

### Network
Select the Bitcoin Cash network to run:
- **Mainnet** (default) — live Bitcoin Cash network
- **Testnet3** — public test network
- **Chipnet** — CHIP testing network
- **Regtest** — local regression testing

> Changing network switches the active blockchain data directory and port set.

### Node Settings
- **Transaction Index** (`txindex`) — Build a full transaction index. Required by Fulcrum and other indexers. Incompatible with pruning.
- **ZeroMQ Notifications** — Enable real-time block and transaction push events (ports 28332/28333). Required by Fulcrum, block explorers, and similar tools.
- **Maximum Connections** — Maximum number of peer connections (default: 125)

### RPC Settings
- **RPC Server Timeout** — Seconds before an RPC call times out (default: 30)
- **RPC Threads** — Number of threads for handling RPC calls (default: 4)
- **RPC Work Queue** — Depth of the RPC request queue (default: 64)

### Mempool & Relay
- **Max Mempool Size** — Maximum memory usage for the mempool in MB (default: 300)
- **Minimum Relay Fee** — Minimum fee rate (BCH/kB) for relaying transactions (default: 0.00001)
- **Mempool Expiry** — Hours before unconfirmed transactions are evicted (default: 336)

### Pruning
- **Prune Target** — Limit blockchain storage in MB (minimum 550 MB when enabled). Disables transaction index when active.

### Block Policy
- **Excessive Block Size** — Maximum accepted block size in bytes (default: 32 MB)
- **Ancestor Limit** — Maximum in-mempool ancestors per transaction (default: 25)
- **Descendant Limit** — Maximum in-mempool descendants per transaction (default: 25)

### View RPC Credentials
Displays the auto-generated RPC username, password, and port for use with external tools and wallets.

## Network Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 8332 | HTTP | RPC interface (mainnet) |
| 8333 | TCP | P2P network (mainnet) |
| 18332 | HTTP | RPC interface (testnet3) |
| 18333 | TCP | P2P network (testnet3) |
| 48332 | HTTP | RPC interface (chipnet) |
| 48333 | TCP | P2P network (chipnet) |
| 18443 | HTTP | RPC interface (regtest) |
| 18444 | TCP | P2P network (regtest) |
| 28332 | TCP | ZeroMQ block notifications (when enabled) |
| 28333 | TCP | ZeroMQ transaction notifications (when enabled) |
| 28334 | TCP | ZeroMQ DSP hash notifications (always on) |
| 28335 | TCP | ZeroMQ DSP raw tx notifications (always on) |

## Usage

### RPC API

Interact with your node using the RPC credentials from **View RPC Credentials**:

```bash
# Get blockchain info
curl --user <rpcuser>:<rpcpassword> \
  --data-binary '{"jsonrpc":"1.0","id":"1","method":"getblockchaininfo","params":[]}' \
  -H 'content-type: application/json' \
  http://<node-ip>:8332/
```

Compatible with `bitcoin-cli`, Fulcrum, and any standard Bitcoin Cash wallet or tool.

### Tor / Onion Routing

If StartOS is configured with Tor, the node automatically connects via onion routing — no extra setup needed.

## May 2026 Network Upgrade

BCHN v29.0.0 implements the **May 15, 2026 network upgrade**, which adds four consensus-level improvements:

- **P2S32** — Pay-to-Script-Hash with 32-byte hashes
- **Native Loops** — Looping opcodes in scripts
- **Functions** — Script-defined callable functions
- **Bitwise Operations** — New bitwise opcodes

Nodes running v28.x will stop following the main chain after the upgrade activates. **This version (v29.0.0) is required for continued operation.**

## Security Considerations

1. **RPC Credentials**: Auto-generated on install. View them under **View RPC Credentials** — never share them publicly.
2. **Firewall**: Only expose ports you need. RPC (8332) should not be publicly accessible.
3. **Pruning**: If disk space is limited, enable pruning — note it disables `txindex`.
4. **Updates**: Keep the package updated to stay compatible with network upgrades.

## Troubleshooting

**Node not syncing / stuck at 0%**
- Check your StartOS internet connection
- Ensure port 8333 (P2P) is reachable
- If running v28.x after May 15 2026 — upgrade to v29.0.0 immediately
- Check service logs in StartOS for errors

**RPC not working**
- Confirm the correct port for your selected network (see ports table above)
- Retrieve credentials from **View RPC Credentials**
- Ensure the RPC interface is not firewalled

**High disk usage**
- Enable **Pruning** in Node Settings (minimum 550 MB target)
- Note: pruning disables the transaction index

**ZeroMQ not receiving events**
- Ensure **ZeroMQ Notifications** is enabled in Node Settings
- DSP streams (28334/28335) are always active regardless of this toggle

## Support

- **BCHN Documentation**: [https://docs.bitcoincashnode.org/](https://docs.bitcoincashnode.org/)
- **StartOS Documentation**: [https://docs.start9.com/](https://docs.start9.com/)
- **Community**: [https://bitcoincashnode.org/](https://bitcoincashnode.org/)
- **Issue Reporting**: [https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node/-/issues)

## Building from Source

See the main [README](../README.md) for instructions on building this package from source code.
