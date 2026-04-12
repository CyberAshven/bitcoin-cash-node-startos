export const rootDir = '/data'

// ── Interface IDs ─────────────────────────────────────────────────────────────
export const rpcInterfaceId = 'rpc'
export const peerInterfaceId = 'peer'
export const zmqInterfaceId = 'zmq'

// ── Network types ─────────────────────────────────────────────────────────────
export const NETWORKS = ['mainnet', 'testnet3', 'chipnet', 'regtest'] as const
export type Network = (typeof NETWORKS)[number]

export const networkPorts: Record<Network, { rpc: number; peer: number }> = {
  mainnet:  { rpc: 8332,  peer: 8333  },
  testnet3: { rpc: 18332, peer: 18333 },
  chipnet:  { rpc: 48332, peer: 48333 },
  regtest:  { rpc: 18443, peer: 18444 },
}

export const networkFlag: Record<Network, string | null> = {
  mainnet:  null,
  testnet3: '-testnet',
  chipnet:  '-chipnet',
  regtest:  '-regtest',
}

export const rpcPort = networkPorts.mainnet.rpc
export const peerPort = networkPorts.mainnet.peer

// ── ZMQ — block / tx notifications (28332 / 28333) ───────────────────────────
export const zmqPort   = 28332
export const zmqPortTx = 28333

export const zmqBundle: Record<string, string> = {
  zmqpubrawblock:  `tcp://0.0.0.0:${zmqPort}`,
  zmqpubhashblock: `tcp://0.0.0.0:${zmqPort}`,
  zmqpubrawtx:     `tcp://0.0.0.0:${zmqPortTx}`,
  zmqpubhashtx:    `tcp://0.0.0.0:${zmqPortTx}`,
}

// ── ZMQ — DSP notifications (28334 / 28335) — always on ──────────────────────
export const zmqPortDspHash = 28334
export const zmqPortDspRaw  = 28335

export const dspZmqBundle: Record<string, string> = {
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

export type GetNetworkInfo = {
  version: number
  subversion: string
  connections: number
  connections_in: number
  connections_out: number
  networkactive: boolean
  localaddresses: Array<{ address: string; port: number; score: number }>
}

export type GetMempoolInfo = {
  size: number
  bytes: number
  usage: number
  maxmempool: number
  mempoolminfee: number
}
