import { sdk } from '../sdk'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

const { InputSpec, Value } = sdk

export const deleteRpcUser = sdk.Action.withInput(
  'delete-rpc-user',
  async ({ effects: _effects }) => ({
    name: 'Delete RPC Users',
    description:
      'Remove one or more rpcauth entries. Selected users will no longer be able to authenticate via RPC after the next restart.',
    warning: 'Selected RPC users will lose access on next restart.',
    allowedStatuses: 'any' as const,
    group: 'Credentials',
    visibility: 'enabled' as const,
  }),
  // Dynamic spec — reads existing rpcauth usernames from bitcoin.conf
  async ({ effects: _effects }) => {
    const conf = await bitcoinConfFile.read().once()
    const existingAuth: string[] = (
      (conf?.raw?.rpcauth as unknown as (string | undefined)[] | undefined) ?? []
    ).filter((v): v is string => typeof v === 'string')

    // Parse out usernames from "username:salt$hmac" format
    const users: Record<string, string> = {}
    for (const entry of existingAuth) {
      const username = entry.split(':')[0]
      if (username) users[username] = username
    }

    return InputSpec.of({
      usernames: Value.multiselect({
        name: 'Existing RPC Users',
        description: 'Select one or more RPC users to remove.',
        warning: null,
        default: [],
        values: users,
      }),
    })
  },
  async ({ effects: _effects }) => ({ usernames: [] as string[] }),
  async ({ effects, input }) => {
    const { usernames } = input
    if (!usernames || (usernames as string[]).length === 0) {
      return {
        version: '1' as const,
        title: 'No Users Selected',
        message: 'No RPC users were selected. Nothing was changed.',
        result: null,
      }
    }

    const toDelete = new Set(usernames as string[])
    const conf = await bitcoinConfFile.read().once()
    const existingAuth: string[] = (
      (conf?.raw?.rpcauth as unknown as (string | undefined)[] | undefined) ?? []
    ).filter((v): v is string => typeof v === 'string')

    const filtered = existingAuth.filter(
      (entry) => !toDelete.has(entry.split(':')[0] ?? ''),
    )

    await bitcoinConfFile.merge(effects, {
      raw: { ...conf?.raw, rpcauth: filtered.length > 0 ? filtered : undefined },
    } as any)

    const deleted = [...toDelete].join(', ')
    return {
      version: '1' as const,
      title: 'RPC Users Deleted',
      message: `Removed: ${deleted}. Restart the node to apply.`,
      result: null,
    }
  },
)
