import { sdk } from './sdk'
import {
  rpcInterfaceId,
  rpcPort,
  peerInterfaceId,
  peerPort,
  zmqInterfaceId,
  zmqPort,
  zmqPortTx,
} from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const bitcoinConf = (await bitcoinConfFile.read().once()) as {
    zmqEnabled?: boolean
  } | null

  // RPC
  const rpcMulti = sdk.MultiHost.of(effects, 'rpc')
  const rpcMultiOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: 'RPC Interface',
    id: rpcInterfaceId,
    description: 'Listens for JSON-RPC commands',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const rpcReceipt = await rpcMultiOrigin.export([rpc])

  const receipts = [rpcReceipt]

  // PEER
  const peerMulti = sdk.MultiHost.of(effects, 'peer')
  const peerMultiOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    preferredExternalPort: peerPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: 'Peer Interface',
    id: peerInterfaceId,
    description:
      'Listens for incoming connections from peers on bitcoin cash network',
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })
  const peerReceipt = await peerMultiOrigin.export([peer])
  receipts.push(peerReceipt)

  // ZMQ (conditional)
  if (bitcoinConf?.zmqEnabled) {
    const zmqMulti = sdk.MultiHost.of(effects, 'zmq')
    const zmqOrigin = await zmqMulti.bindPort(zmqPort, {
      preferredExternalPort: zmqPort,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    const zmq = sdk.createInterface(effects, {
      name: 'ZeroMQ Interface',
      id: zmqInterfaceId,
      description:
        'ZeroMQ block and transaction notifications for real-time blockchain data',
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    })
    const zmqReceipt = await zmqOrigin.export([zmq])
    receipts.push(zmqReceipt)

    // Also bind the tx port (zmqPortTx = 28333)
    const zmqTxMulti = sdk.MultiHost.of(effects, 'zmq-tx')
    const zmqTxOrigin = await zmqTxMulti.bindPort(zmqPortTx, {
      preferredExternalPort: zmqPortTx,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    const zmqTxReceipt = await zmqTxOrigin.export([])
    receipts.push(zmqTxReceipt)
  }

  return receipts
})
