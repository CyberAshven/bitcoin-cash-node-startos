import { sdk } from './sdk'
import {
  rpcInterfaceId, peerInterfaceId, zmqInterfaceId,
  networkPorts, zmqPort, zmqPortTx, zmqPortDspHash, zmqPortDspRaw,
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

  const receipts = []

  // ── RPC ──────────────────────────────────────────────────────────────────
  const rpcMulti = sdk.MultiHost.of(effects, 'rpc')
  const rpcOrigin = await rpcMulti.bindPort(rpcPort, {
    protocol: 'http',
    preferredExternalPort: rpcPort,
  })
  const rpc = sdk.createInterface(effects, {
    name: 'RPC Interface',
    id: rpcInterfaceId,
    description: 'JSON-RPC for wallets, miners, and dev tools',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await rpcOrigin.export([rpc]))

  // ── P2P ──────────────────────────────────────────────────────────────────
  const peerMulti = sdk.MultiHost.of(effects, 'peer')
  const peerOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    preferredExternalPort: peerPort,
    addSsl: null,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: 'Peer Interface',
    id: peerInterfaceId,
    description: 'P2P Bitcoin Cash network connections',
    type: 'p2p',
    masked: false,
    schemeOverride: { ssl: null, noSsl: null },
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await peerOrigin.export([peer]))

  // ── ZMQ block/tx (conditional) ───────────────────────────────────────────
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
      description: 'Block and transaction notifications',
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

  // ── ZMQ DSP (ALWAYS ON) ──────────────────────────────────────────────────
  const dspHashMulti = sdk.MultiHost.of(effects, 'zmq-dsp-hash')
  const dspHashOrigin = await dspHashMulti.bindPort(zmqPortDspHash, {
    preferredExternalPort: zmqPortDspHash,
    addSsl: null,
    secure: { ssl: false },
    protocol: null,
  })
  receipts.push(await dspHashOrigin.export([]))

  const dspRawMulti = sdk.MultiHost.of(effects, 'zmq-dsp-raw')
  const dspRawOrigin = await dspRawMulti.bindPort(zmqPortDspRaw, {
    preferredExternalPort: zmqPortDspRaw,
    addSsl: null,
    secure: { ssl: false },
    protocol: null,
  })
  receipts.push(await dspRawOrigin.export([]))

  return receipts
})
