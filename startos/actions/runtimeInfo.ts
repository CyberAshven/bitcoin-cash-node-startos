import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { networkPorts, Network, GetBlockchainInfo, GetNetworkInfo } from '../utils'
import { mainMounts } from '../mounts'

export const runtimeInfo = sdk.Action.withoutInput(
  'runtime-info',
  async ({ effects: _effects }) => ({
    name: 'Node Info',
    description: 'Display current node runtime information: version, network, connections, sync status.',
    warning: null,
    allowedStatuses: 'only-running' as const,
    group: null,
    visibility: 'enabled' as const,
  }),
  async ({ effects }) => {
    const store = await storeJson.read().once()
    const network: Network = store?.network ?? 'mainnet'
    const rpcUser = store?.rpcUser ?? 'bitcoin-cash-node'
    const rpcPassword = store?.rpcPassword ?? ''
    const { rpc: rpcPort } = networkPorts[network]

    return sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bitcoin-cash-node' },
      mainMounts,
      'runtime-info',
      async (sub) => {
        const cliBase = [
          'bitcoin-cli',
          `-rpcconnect=127.0.0.1`,
          `-rpcport=${rpcPort}`,
          `-rpcuser=${rpcUser}`,
          `-rpcpassword=${rpcPassword}`,
        ]

        const [netRes, chainRes] = await Promise.all([
          sub.exec([...cliBase, 'getnetworkinfo']).catch(() => null),
          sub.exec([...cliBase, 'getblockchaininfo']).catch(() => null),
        ])

        const net: GetNetworkInfo | null = netRes?.exitCode === 0
          ? JSON.parse(netRes.stdout.toString())
          : null
        const chain: GetBlockchainInfo | null = chainRes?.exitCode === 0
          ? JSON.parse(chainRes.stdout.toString())
          : null

        const lines: string[] = []
        if (net) {
          lines.push(`Version: ${net.subversion}`)
          lines.push(`Network Active: ${net.networkactive ? 'Yes' : 'No'}`)
          lines.push(`Connections: ${net.connections} (in: ${net.connections_in}, out: ${net.connections_out})`)
        }
        if (chain) {
          lines.push(`Chain: ${chain.pruned ? 'pruned' : 'archival'} ${network}`)
          lines.push(`Blocks: ${chain.blocks} / ${chain.headers}`)
          lines.push(`Sync: ${chain.initialblockdownload ? `${(chain.verificationprogress * 100).toFixed(2)}%` : 'Complete'}`)
        }

        return {
          version: '1' as const,
          title: 'Node Runtime Info',
          message: null,
          result: {
            type: 'single' as const,
            value: lines.join('\n'),
            copyable: false,
            qr: false,
            masked: false,
          },
        }
      },
    )
  },
)
