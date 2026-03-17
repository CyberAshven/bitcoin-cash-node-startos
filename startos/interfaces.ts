import { sdk } from './sdk'
import {
  rpcInterfaceId,
  peerInterfaceId,
  zmqInterfaceId,
  networkPorts,
  getZmqPorts,
  Network,
} from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { storeJson } from './fileModels/store.json'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const bitcoinConf = (await bitcoinConfFile.read().once()) as {
    zmqEnabled?: boolean
  } | null

  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const { rpc: rpcPort, peer: peerPort } = networkPorts[network]
  const zmqPorts = getZmqPorts(network)

  // ── RPC ──────────────────────────────────────────────────────────────────
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

  // ── P2P ──────────────────────────────────────────────────────────────────
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
      'Listens for incoming connections from peers on the Bitcoin Cash network',
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })
  const peerReceipt = await peerMultiOrigin.export([peer])
  receipts.push(peerReceipt)

  // ── ZMQ (conditional) ────────────────────────────────────────────────────
  if (bitcoinConf?.zmqEnabled) {
    const zmqMulti = sdk.MultiHost.of(effects, 'zmq')
    const zmqOrigin = await zmqMulti.bindPort(zmqPorts.block, {
      preferredExternalPort: zmqPorts.block,
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

    // ZMQ tx port (block + 1)
    const zmqTxMulti = sdk.MultiHost.of(effects, 'zmq-tx')
    const zmqTxOrigin = await zmqTxMulti.bindPort(zmqPorts.tx, {
      preferredExternalPort: zmqPorts.tx,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    const zmqTxReceipt = await zmqTxOrigin.export([])
    receipts.push(zmqTxReceipt)
  }

  return receipts
})
