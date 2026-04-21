import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { peerInterfaceId } from '../utils'

// Format a HostnameInfo as "host:port" (or "[v6]:port"), stripping any scheme
// since -externalip takes a bare address.
const toHostPort = (h: { hostname: string; port: number | null }): string => {
  const host = h.hostname.includes(':') ? `[${h.hostname}]` : h.hostname
  return h.port != null ? `${host}:${h.port}` : host
}

export const watchHosts = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().const(effects)
  const advertiseClearnetInbound = !!store?.advertiseClearnetInbound

  // Read bitcoin.conf so we can honor onlynet restrictions when publishing
  // externalip. If onlynet excludes a clearnet family, don't advertise it.
  const bitcoinConf = await bitcoinConfFile.read().const(effects)
  const onlynetList: string[] = ([
    (bitcoinConf?.onlynet as string[] | string | undefined) ?? [],
  ] as string[][]).flat().filter(Boolean)
  const onlynetActive = onlynetList.length > 0
  const allowIpv4 = !onlynetActive || onlynetList.includes('ipv4')
  const allowIpv6 = !onlynetActive || onlynetList.includes('ipv6')

  const publicInfo = await sdk.serviceInterface
    .getOwn(effects, peerInterfaceId, (i) =>
      i?.addressInfo?.public.filter({
        exclude: { kind: 'domain' },
      }),
    )
    .const()

  if (!publicInfo) return

  const externalip: string[] = []

  const onions = publicInfo
    .filter({
      predicate: ({ metadata }) =>
        metadata.kind === 'plugin' && metadata.packageId === 'tor',
    })
    .format('hostname-info')
    .map(toHostPort)

  externalip.push(...onions)

  if (advertiseClearnetInbound) {
    if (allowIpv4) {
      const ipv4s = publicInfo
        .filter({ kind: 'ipv4' })
        .format('hostname-info')
        .map(toHostPort)
      externalip.push(...ipv4s)
    }
    if (allowIpv6) {
      const ipv6s = publicInfo
        .filter({ kind: 'ipv6' })
        .format('hostname-info')
        .map(toHostPort)
      externalip.push(...ipv6s)
    }
  }

  await bitcoinConfFile.merge(
    effects,
    {
      raw: {
        externalip: externalip.length > 0 ? externalip : undefined,
      },
    },
    { allowWriteAfterConst: true },
  )
})
