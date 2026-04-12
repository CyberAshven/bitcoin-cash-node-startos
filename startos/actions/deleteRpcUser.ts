import { sdk } from '../sdk'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

const { InputSpec, Value } = sdk

const spec = InputSpec.of({
  username: Value.text({
    name: 'Username',
    description: 'Username of the rpcauth entry to remove.',
    required: true,
    default: null,
    masked: false,
    placeholder: 'myservice',
  }),
})

export const deleteRpcUser = sdk.Action.withInput(
  'delete-rpc-user',
  async ({ effects: _effects }) => ({
    name: 'Delete RPC User',
    description:
      'Remove an rpcauth entry for a specific username. The user will no longer be able to authenticate via RPC.',
    warning: 'This will immediately revoke RPC access for the specified user on next restart.',
    allowedStatuses: 'any' as const,
    group: 'Credentials',
    visibility: 'enabled' as const,
  }),
  spec,
  async ({ effects: _effects }) => ({ username: undefined as string | undefined }),
  async ({ effects, input }) => {
    const { username } = input
    const conf = await bitcoinConfFile.read().once()
    const existingAuth: string[] = (
      (conf?.raw?.rpcauth as unknown as (string | undefined)[] | undefined) ?? []
    ).filter((v): v is string => typeof v === 'string')

    const filtered = existingAuth.filter((entry) => !entry.startsWith(`${username}:`))

    if (filtered.length === existingAuth.length) {
      return {
        version: '1' as const,
        title: 'User Not Found',
        message: `No rpcauth entry found for username "${username}". Nothing was changed.`,
        result: null,
      }
    }

    await bitcoinConfFile.merge(effects, {
      raw: { ...conf?.raw, rpcauth: filtered.length > 0 ? filtered : undefined },
    } as any)

    return {
      version: '1' as const,
      title: `RPC User Deleted: ${username}`,
      message: `The rpcauth entry for "${username}" has been removed. Restart the node to apply.`,
      result: null,
    }
  },
)
