import { sdk } from './sdk'
import {
  rpcInterfaceId,
  peerInterfaceId,
  zmqInterfaceId,
  zmqDspInterfaceId,
  networkPorts,
  zmqPort,
  zmqPortTx,
  zmqPortDspHash,
  zmqPortDspRaw,
  Network,
} from './utils'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'
import { storeJson } from './fileModels/store.json'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const bitcoinConf = (await bitcoinConfFile.read().once()) as {
    zmqEnabled?: boolean
    zmqDspEnabled?: boolean
  } | null

  const store = await storeJson.read().once()
  const network: Network = store?.network ?? 'mainnet'
  const { rpc: rpcPort, peer: peerPort } = networkPorts[network]

  const receipts = []

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
  receipts.push(await rpcMultiOrigin.export([rpc]))

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
  receipts.push(await peerMultiOrigin.export([peer]))

  // ── ZMQ — block / tx (conditional) ───────────────────────────────────────
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
    receipts.push(await zmqOrigin.export([zmq]))

    const zmqTxMulti = sdk.MultiHost.of(effects, 'zmq-tx')
    const zmqTxOrigin = await zmqTxMulti.bindPort(zmqPortTx, {
      preferredExternalPort: zmqPortTx,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    receipts.push(await zmqTxOrigin.export([]))
  }

  // ── ZMQ — DSP (conditional) ───────────────────────────────────────────────
  if (bitcoinConf?.zmqDspEnabled) {
    const zmqDspHashMulti = sdk.MultiHost.of(effects, 'zmq-dsp-hash')
    const zmqDspHashOrigin = await zmqDspHashMulti.bindPort(zmqPortDspHash, {
      preferredExternalPort: zmqPortDspHash,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    const zmqDsp = sdk.createInterface(effects, {
      name: 'DSP ZMQ Interface',
      id: zmqDspInterfaceId,
      description:
        'ZeroMQ Double Spend Proof notifications. Port 28334 = TX hash, port 28335 = raw TX bytes.',
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    })
    receipts.push(await zmqDspHashOrigin.export([zmqDsp]))

    const zmqDspRawMulti = sdk.MultiHost.of(effects, 'zmq-dsp-raw')
    const zmqDspRawOrigin = await zmqDspRawMulti.bindPort(zmqPortDspRaw, {
      preferredExternalPort: zmqPortDspRaw,
      addSsl: null,
      secure: { ssl: false },
      protocol: null,
    })
    receipts.push(await zmqDspRawOrigin.export([]))
  }

  return receipts
})
