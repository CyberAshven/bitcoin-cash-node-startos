import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { networkPorts, Network } from '../utils'

const { InputSpec, Value } = sdk

export const viewCredentials = sdk.Action.withInput(
  'view-credentials',
  async ({ effects }) => ({
    name: 'View RPC Credentials',
    description:
      'Select a credential by name to view its username, password, and RPC port.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Credentials',
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const store = await storeJson.read().once()
    const conf = await bitcoinConfFile.read().once()
    const existingAuth: string[] = (
      (conf?.raw?.rpcauth as unknown as (string | undefined)[] | undefined) ?? []
    ).filter((v): v is string => typeof v === 'string')

    const values: Record<string, string> = { Default: 'Default' }
    for (const entry of existingAuth) {
      const username = entry.split(':')[0]
      if (username) values[username] = username
    }

    return InputSpec.of({
      name: Value.select({
        name: 'Credential',
        description: 'Select a credential to view its details.',
        values,
        default: 'Default',
      }),
    })
  },

  async ({ effects }) => ({ name: 'Default' }),

  async ({ effects, input }) => {
    const store = await storeJson.read().once()
    const network: Network = store?.network ?? 'mainnet'
    const port = networkPorts[network].rpc

    if (input.name === 'Default') {
      const user = store?.rpcUser ?? 'bitcoincashd'
      const pass = store?.rpcPassword ?? ''
      return {
        version: '1' as const,
        title: 'RPC Credential: Default',
        message: [
          '**Name:** Default (active)',
          `**Username:** ${user}`,
          `**Password:** ${pass}`,
          `**Port:** ${port}`,
        ].join('\n'),
        result: {
          type: 'single' as const,
          value: `${user}:${pass}`,
          copyable: true,
          qr: false,
          masked: true,
        },
      }
    }

    // rpcauth user — password not recoverable (HMAC only)
    return {
      version: '1' as const,
      title: `RPC Credential: ${input.name}`,
      message: [
        `**Name:** ${input.name}`,
        `**Username:** ${input.name}`,
        '**Password:** *(set at generation — not recoverable)*',
        `**Port:** ${port}`,
      ].join('\n'),
      result: {
        type: 'single' as const,
        value: `Username: ${input.name} | Port: ${port}`,
        copyable: true,
        qr: false,
        masked: false,
      },
    }
  },
)
