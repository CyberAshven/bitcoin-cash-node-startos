// Here we define any constants or functions that are shared by multiple components
// throughout the package codebase. This file will be unnecessary for many packages.

export const uiPort = 80

// Bitcoin Cash Node specific constants
export const rpcPort = 8332
export const rpcInterfaceId = 'rpc'
export const peerPort = 8333
export const peerInterfaceId = 'peer'
export const rootDir = '/data'
export const ipcSocketPath = '/data/bitcoin-cash-node.sock'
