export const rootDir = '/data'

// ── Interface IDs ─────────────────────────────────────────────────────────────
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const zmqInterfaceId = 'zmq'
export const zmqDspInterfaceId = 'zmq-dsp'

// ── Network types ─────────────────────────────────────────────────────────────
// testnet4 excluded: its P2P/RPC ports (28332/28333) conflict with ZMQ ports
export const NETWORKS = ['mainnet', 'testnet3', 'chipnet', 'regtest'] as const
export type Network = (typeof NETWORKS)[number]

// RPC and P2P ports per network (BCHN defaults)
export const networkPorts: Record<Network, { rpc: number; peer: number }> = {
  mainnet:  { rpc: 8332,  peer: 8333  },
  testnet3: { rpc: 18332, peer: 18333 },
  chipnet:  { rpc: 48332, peer: 48333 },
  regtest:  { rpc: 18443, peer: 18444 },
}

// CLI flag to activate a non-mainnet network
export const networkFlag: Record<Network, string | null> = {
  mainnet:  null,
  testnet3: '-testnet',
  chipnet:  '-chipnet',
  regtest:  '-regtest',
}

// Backwards-compat aliases
export const rpcPort = networkPorts.mainnet.rpc
export const peerPort = networkPorts.mainnet.peer

// ── ZMQ — block / transaction notifications ───────────────────────────────────
// No port conflicts possible now that testnet4 is excluded
export const zmqPort   = 28332   // block hash & raw block
export const zmqPortTx = 28333   // tx hash & raw tx

export const zmqBundle = {
  zmqpubrawblock:  `tcp://0.0.0.0:${zmqPort}`,
  zmqpubhashblock: `tcp://0.0.0.0:${zmqPort}`,
  zmqpubrawtx:     `tcp://0.0.0.0:${zmqPortTx}`,
  zmqpubhashtx:    `tcp://0.0.0.0:${zmqPortTx}`,
}

// ── ZMQ — Double Spend Proof notifications ─────────────────────────────────────
export const zmqPortDspHash = 28334   // zmqpubhashds  — hash of conflicting tx
export const zmqPortDspRaw  = 28335   // zmqpubrawds   — raw conflicting tx bytes

export const dspZmqBundle = {
  zmqpubhashds: `tcp://0.0.0.0:${zmqPortDspHash}`,
  zmqpubrawds:  `tcp://0.0.0.0:${zmqPortDspRaw}`,
}

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
