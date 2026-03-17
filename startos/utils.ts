export const rootDir = '/data'

// ── RPC / Peer interface IDs ──────────────────────────────────────────────────
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const zmqInterfaceId = 'zmq'

// ── Network types ─────────────────────────────────────────────────────────────
export const NETWORKS = ['mainnet', 'testnet3', 'testnet4', 'chipnet', 'regtest'] as const
export type Network = (typeof NETWORKS)[number]

// RPC and P2P ports per network (BCHN defaults)
export const networkPorts: Record<Network, { rpc: number; peer: number }> = {
  mainnet:  { rpc: 8332,  peer: 8333  },
  testnet3: { rpc: 18332, peer: 18333 },
  testnet4: { rpc: 28332, peer: 28333 },
  chipnet:  { rpc: 48332, peer: 48333 },
  regtest:  { rpc: 18443, peer: 18444 },
}

// CLI flag to activate a non-mainnet network
export const networkFlag: Record<Network, string | null> = {
  mainnet:  null,
  testnet3: '-testnet',
  testnet4: '-testnet4',
  chipnet:  '-chipnet',
  regtest:  '-regtest',
}

// Mainnet defaults (backwards compat)
export const rpcPort = networkPorts.mainnet.rpc
export const peerPort = networkPorts.mainnet.peer

// ── ZMQ ports ─────────────────────────────────────────────────────────────────
// Default ZMQ ports (mainnet / testnet3 / chipnet / regtest)
export const zmqPort   = 28332
export const zmqPortTx = 28333

// Testnet4 shares 28332/28333 with its own RPC/P2P — use alternate ZMQ ports
export const zmqPortAlt   = 38332
export const zmqPortTxAlt = 38333

// Returns the ZMQ block/tx ports to use, accounting for testnet4 conflict
export function getZmqPorts(network: Network): { block: number; tx: number } {
  if (network === 'testnet4') return { block: zmqPortAlt, tx: zmqPortTxAlt }
  return { block: zmqPort, tx: zmqPortTx }
}

export function makeZmqBundle(network: Network): Record<string, string> {
  const { block, tx } = getZmqPorts(network)
  return {
    zmqpubrawblock:  `tcp://0.0.0.0:${block}`,
    zmqpubhashblock: `tcp://0.0.0.0:${block}`,
    zmqpubrawtx:     `tcp://0.0.0.0:${tx}`,
    zmqpubhashtx:    `tcp://0.0.0.0:${tx}`,
  }
}

// Backwards compat alias (mainnet)
export const zmqBundle = makeZmqBundle('mainnet')

// ── RPC response types ────────────────────────────────────────────────────────
export type GetBlockchainInfo = {
  blocks: number
  headers: number
  verificationprogress: number
  initialblockdownload: boolean
  pruned: boolean
}

export type GetPeerInfo = Array<{
  id: number
  addr: string
  subver: string
  inbound: boolean
  synced_blocks: number
}>

export type GetMempoolInfo = {
  size: number
  bytes: number
  usage: number
  maxmempool: number
  mempoolminfee: number
}
