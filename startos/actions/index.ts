import { sdk } from '../sdk'
import { otherConfig } from './config/other'
import { rpcConfig } from './config/rpc'

export const actions = sdk.Actions.of()
  .addAction(otherConfig)
  .addAction(rpcConfig)
