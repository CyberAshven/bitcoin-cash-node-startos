import { sdk } from '../sdk'
import { otherConfig } from './config/other'
import { rpcConfig } from './config/rpc'
import { networkConfig } from './config/network'
import { pruningConfig } from './config/pruning'
import { mempoolConfig } from './config/mempool'
import { blockPolicyConfig } from './config/blockpolicy'
import { peersConfig } from './config/peers'
import { viewCredentials } from './credentials'
import { generateRpcUser } from './generateRpcUser'
import { deleteRpcUser } from './deleteRpcUser'
import { runtimeInfo } from './runtimeInfo'
import { reindexBlockchain } from './reindexBlockchain'
import { reindexChainstate } from './reindexChainstate'
import { deletePeers } from './deletePeers'
import { deleteTxIndex } from './deleteTxIndex'

export const actions = sdk.Actions.of()
  // ── Info ────────────────────────────────────────────────────────────────────
  .addAction(runtimeInfo)
  // ── Configuration ───────────────────────────────────────────────────────────
  .addAction(networkConfig)
  .addAction(otherConfig)
  .addAction(peersConfig)
  .addAction(rpcConfig)
  .addAction(mempoolConfig)
  .addAction(pruningConfig)
  .addAction(blockPolicyConfig)
  // ── Credentials ─────────────────────────────────────────────────────────────
  .addAction(viewCredentials)
  .addAction(generateRpcUser)
  .addAction(deleteRpcUser)
  // ── Maintenance ─────────────────────────────────────────────────────────────
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(deletePeers)
  .addAction(deleteTxIndex)
