import { sdk } from '../../sdk'
import { bitcoinConfFile, fullConfigSpec } from '../../fileModels/bitcoin.conf'
import { storeJson } from '../../fileModels/store.json'

export const peersConfig = sdk.Action.withInput(
  'peers-config',
  async ({ effects: _effects }) => ({
    name: 'RPC & Peers Settings',
    description: 'Configure RPC server tuning, peer connections, network restrictions, and bandwidth limits.',
    warning: null,
    allowedStatuses: 'any' as const,
    group: 'Configuration',
    visibility: 'enabled' as const,
  }),
  fullConfigSpec
    .filter({
      rpcservertimeout: true,
      rpcthreads: true,
      rpcworkqueue: true,
      maxconnections: true,
      maxuploadtarget: true,
      onlynet: true,
      onionOnly: true,
      addnode: true,
    })
    .add(({ Value }) => ({
      advertiseClearnetInbound: Value.toggle({
        name: 'Advertise Clearnet Inbound',
        description:
          'Publish your public IPv4 and IPv6 clearnet endpoints for inbound peers. Respects the Allowed Networks setting — a network excluded by onlynet (or by Onion-Only Mode) is never advertised. Disabled by default for privacy.',
        default: false,
      }),
    })),
  async ({ effects }) => {
    const [conf, store] = await Promise.all([
      bitcoinConfFile.read().once(),
      storeJson.read().once(),
    ])
    return {
      ...(conf ?? {}),
      advertiseClearnetInbound: store?.advertiseClearnetInbound ?? false,
    }
  },
  async ({ effects, input }) => {
    const { advertiseClearnetInbound, ...confInput } = input as typeof input & {
      advertiseClearnetInbound?: boolean
    }

    await Promise.all([
      bitcoinConfFile.merge(effects, confInput),
      storeJson.merge(effects, {
        advertiseClearnetInbound: !!advertiseClearnetInbound,
      }),
    ])
  },
)
