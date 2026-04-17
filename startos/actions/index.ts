import { sdk } from '../sdk'
import { autoconfig } from './config/autoconfig'
import { otherConfig } from './config/other'
import { networkConfig } from './config/network'
import { mempoolConfig } from './config/mempool'
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
  // ── Hidden (cross-package) ──────────────────────────────────────────────────
  .addAction(autoconfig)
  // ── Info ────────────────────────────────────────────────────────────────────
  .addAction(runtimeInfo)
  // ── Configuration ───────────────────────────────────────────────────────────
  .addAction(networkConfig)
  .addAction(otherConfig)
  .addAction(peersConfig)
  .addAction(mempoolConfig)
  // ── Credentials ─────────────────────────────────────────────────────────────
  .addAction(viewCredentials)
  .addAction(generateRpcUser)
  .addAction(deleteRpcUser)
  // ── Maintenance ─────────────────────────────────────────────────────────────
  .addAction(reindexBlockchain)
  .addAction(reindexChainstate)
  .addAction(deletePeers)
  .addAction(deleteTxIndex)
