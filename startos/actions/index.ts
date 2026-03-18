import { sdk } from '../sdk'
import { otherConfig } from './config/other'
import { rpcConfig } from './config/rpc'
import { networkConfig } from './config/network'
import { pruningConfig } from './config/pruning'
import { mempoolConfig } from './config/mempool'
import { blockPolicyConfig } from './config/blockpolicy'
import { viewCredentials } from './credentials'

export const actions = sdk.Actions.of()
  .addAction(networkConfig)
  .addAction(otherConfig)
  .addAction(rpcConfig)
  .addAction(mempoolConfig)
  .addAction(pruningConfig)
  .addAction(blockPolicyConfig)
  .addAction(viewCredentials)
