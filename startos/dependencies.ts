import { sdk } from './sdk'
import { bitcoinConfFile } from './fileModels/bitcoin.conf'

export const setDependencies = sdk.setupDependencies(
  async ({ effects }) => {
    const conf = await bitcoinConfFile.read().const(effects)
    const onlynetList: string[] = ((conf?.onlynet as unknown as string[]) ?? []).filter(Boolean)
    const rawConf = conf?.raw as Record<string, unknown> | undefined
    const rawExternalip = rawConf?.externalip
    const externalips: string[] = ([rawExternalip ?? []] as string[][])
      .flat()
      .filter((v): v is string => typeof v === 'string' && !!v)

    if (
      externalips.some((ip) => ip.includes('.onion')) ||
      onlynetList.includes('onion')
    ) {
      return {
        tor: {
          kind: 'running' as const,
          versionRange: '>=0.4.9.5:0',
          healthChecks: [] as string[],
        },
      }
    }

    return {}
  },
)
