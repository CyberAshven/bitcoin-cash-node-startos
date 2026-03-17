export const rpcPort = 8332
export const rpcInterfaceId = 'rpc'
export const peerPort = 8333
export const peerInterfaceId = 'peer'
export const rootDir = '/data'

export const zmqInterfaceId = 'zmq'
export const zmqPort = 28332
export const zmqPortTx = 28333

export const zmqBundle = {
  zmqpubrawblock: `tcp://0.0.0.0:${zmqPort}`,
  zmqpubhashblock: `tcp://0.0.0.0:${zmqPort}`,
  zmqpubrawtx: `tcp://0.0.0.0:${zmqPortTx}`,
  zmqpubhashtx: `tcp://0.0.0.0:${zmqPortTx}`,
}

export type GetBlockchainInfo = {
  blocks: number
  headers: number
  verificationprogress: number
  initialblockdownload: boolean
  pruned: boolean
}
