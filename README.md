<p align="center">
  <img src="icon.png" alt="Bitcoin Cash Node Logo" width="21%">
</p>

# Bitcoin Cash Node — StartOS Package

Run a sovereign Bitcoin Cash full node on your [StartOS](https://start9.com) device. No cloud. No trust. Your node, your rules.

## Features

- **Full Node** — Complete BCH protocol implementation (BCHN v28.0.2)
- **RPC Interface** — JSON-RPC API on port 8332 for wallets, miners, and dev tools
- **P2P Network** — Connects to the Bitcoin Cash network on port 8333
- **ZeroMQ** — Optional real-time block/tx notifications (ports 28332/28333) for Fulcrum and indexers
- **Transaction Index** — Optional `txindex` for full historical tx lookup (required by Fulcrum)
- **Config UI** — Manage txindex, ZMQ, connections, and RPC tuning directly from the StartOS interface
- **Tor Support** — Automatic onion routing via StartOS
- **Sync Progress** — Live blockchain sync health check in the StartOS dashboard

## Interfaces

| Interface | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| RPC | 8332 | HTTP | JSON-RPC for wallets, miners, dev tools |
| Peer | 8333 | TCP | P2P Bitcoin Cash network |
| ZMQ Blocks | 28332 | TCP | Block notifications (when enabled) |
| ZMQ Transactions | 28333 | TCP | Tx notifications (when enabled) |

## Use Cases

- **Developers** — Full RPC + txindex + ZMQ for building BCH applications
- **Miners** — `getblocktemplate` / `submitblock` via RPC for solo or pool mining
- **Wallets** — Connect Electron Cash or any RPC-compatible wallet directly to your own node
- **Fulcrum / Indexers** — Enable `txindex` for Fulcrum BCH Electrum server
- **Service Providers** — Full historical tx lookup and ZMQ mempool monitoring

## Building from Source

1. Set up your [StartOS SDK environment](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk).
2. Clone this repo and `cd` into it.
3. Run `make` — builds for x86_64 and aarch64.
4. Sideload the resulting `.s9pk` into StartOS via **System → Sideload**.

## Sideloading a Release

Download the latest `bitcoin-cash-node.s9pk` from the [Releases](https://github.com/CyberAshven/bitcoin-cash-node-startos/releases) page and sideload it via StartOS.

## Links

- **Upstream**: [gitlab.com/bitcoin-cash-node/bitcoin-cash-node](https://gitlab.com/bitcoin-cash-node/bitcoin-cash-node)
- **BCHN Docs**: [docs.bitcoincashnode.org](https://docs.bitcoincashnode.org/)
- **StartOS**: [start9.com](https://start9.com)

## License

MIT — see [LICENSE](LICENSE).
