import { FileHelper, T, z } from '@start9labs/start-sdk'
import { totalmem } from 'os'
import { sdk } from '../sdk'
import { zmqBundle, dspZmqBundle } from '../utils'

// INI coercion helpers: INI parsing returns strings, with duplicate keys producing arrays.
const iniString = z
  .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
  .optional()
  .catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

const iniNumber = z
  .union([
    z.array(z.string()).transform((a) => Number(a.at(-1))),
    z.string().transform(Number),
    z.number(),
  ])
  .optional()
  .catch(undefined)

const iniBoolean = z
  .union([
    z.string().transform((s) => !!Number(s)),
    z.number().transform((n) => !!n),
    z.boolean(),
  ])
  .optional()
  .catch(undefined)

export const shape = z
  .object({
    server: z.literal(true).catch(true),
    listen: z.literal(true).catch(true),
    rpcbind: z.string().catch('0.0.0.0'),
    rpcallowip: z.string().catch('0.0.0.0/0'),
    rpcuser: iniString,
    rpcpassword: iniString,
    rpcauth: iniStringArray,
    zmqpubrawblock: iniString,
    zmqpubhashblock: iniString,
    zmqpubrawtx: iniString,
    zmqpubhashtx: iniString,
    zmqpubhashds: iniString,
    zmqpubrawds: iniString,
    txindex: iniBoolean,
    maxconnections: iniNumber,
    rpcservertimeout: iniNumber,
    rpcthreads: iniNumber,
    rpcworkqueue: iniNumber,
    prune: iniNumber,
    maxmempool: iniNumber,
    minrelaytxfee: iniNumber,
    mempoolexpiry: iniNumber,
    persistmempool: iniBoolean,
    excessiveblocksize: iniNumber,
    limitancestorcount: iniNumber,
    limitdescendantcount: iniNumber,
    doublespendproof: iniBoolean,
    dbcache: iniNumber,
    dbbatchsize: iniNumber,
    peerbloomfilters: iniBoolean,
    onlynet: iniStringArray,
    externalip: iniStringArray,
    addnode: iniStringArray,
    maxuploadtarget: iniNumber,
    blocknotify: iniString,
    wallet: iniStringArray,
  })
  .loose()

function stringifyPrimitives(a: unknown): unknown {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) return a.map(stringifyPrimitives)
    return Object.fromEntries(
      Object.entries(a as Record<string, unknown>).map(([k, v]) => [
        k,
        stringifyPrimitives(v),
      ]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

const { InputSpec, Value, List } = sdk

const ONLYNET_VALUES = { ipv4: 'IPv4', ipv6: 'IPv6', onion: 'Tor (.onion)' } as const
type OnlynetKey = keyof typeof ONLYNET_VALUES
const ALL_ONLYNETS = Object.keys(ONLYNET_VALUES) as OnlynetKey[]

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Node Settings ──────────────────────────────────────────────────────────
  zmqEnabled: Value.toggle({
    name: 'ZeroMQ Enabled',
    description:
      'Enable ZeroMQ notifications for block and transaction events. Required by Fulcrum, block explorers, and similar tools.',
    default: true,
  }),
  txindex: Value.toggle({
    name: 'Transaction Index',
    description:
      'Build a full transaction index. Required for Fulcrum and other indexers. Cannot be enabled with pruning.',
    default: true,
  }),
  persistmempool: Value.toggle({
    name: 'Persist Mempool',
    description:
      'Save the mempool to disk on shutdown and reload it on startup. Reduces re-propagation work after restarts.',
    default: true,
  }),

  // ── Performance ────────────────────────────────────────────────────────────
  dbcache: Value.number({
    name: 'Database Cache',
    description:
      'Size of the in-memory UTXO database cache. Larger values speed up IBD and general operation. Defaults to 25% of system RAM (max 5120 MB).',
    required: false,
    default: null,
    min: 4,
    max: 16384,
    integer: true,
    units: 'MB',
    placeholder: String(Math.min(Math.floor((totalmem() * 0.25) / (1024 * 1024)), 5120)),
  }),
  dbbatchsize: Value.number({
    name: 'Database Batch Size',
    description:
      'Maximum database write batch size in bytes. Increasing this can improve IBD performance at the cost of peak memory usage.',
    required: false,
    default: null,
    min: 1024,
    max: null,
    integer: true,
    units: 'bytes',
    placeholder: '16777216',
  }),

  // ── Peer Connections ───────────────────────────────────────────────────────
  maxconnections: Value.number({
    name: 'Maximum Connections',
    description: 'Maximum number of peer connections.',
    default: 125,
    required: false,
    min: 8,
    max: 1000,
    integer: true,
    placeholder: '125',
  }),
  peerbloomfilters: Value.toggle({
    name: 'Serve Bloom Filters',
    description:
      'Serve BIP37 bloom filters to peers. Required by some older SPV wallets. Disabled by default for bandwidth reasons.',
    default: false,
  }),
  onlynet: Value.multiselect({
    name: 'Allowed Networks',
    description:
      'Restrict peer connections to specific network types. Uncheck a network to exclude it. All checked = allow all (default).',
    default: ALL_ONLYNETS,
    values: ONLYNET_VALUES,
  }),
  addnode: Value.list(
    List.text(
      {
        name: 'Add Peers',
        description:
          'Manually add specific peers by address (ip:port or hostname:port). The node will always maintain connections to these peers.',
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        masked: false,
        placeholder: '192.168.1.10:8333',
      },
    ),
  ),
  maxuploadtarget: Value.number({
    name: 'Max Upload Target',
    description: 'Limit total outbound bandwidth per 24 hours. 0 = unlimited.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'MB/day',
    placeholder: '0 (unlimited)',
  }),

  // ── RPC ───────────────────────────────────────────────────────────────────
  rpcservertimeout: Value.number({
    name: 'RPC Server Timeout',
    description: 'Seconds before an RPC call times out.',
    required: false,
    default: null,
    min: 5,
    max: 300,
    integer: true,
    units: 'seconds',
    placeholder: '30',
  }),
  rpcthreads: Value.number({
    name: 'RPC Threads',
    description: 'Number of threads for RPC calls.',
    required: false,
    default: 4,
    min: 1,
    max: 64,
    integer: true,
    units: 'threads',
    placeholder: '4',
  }),
  rpcworkqueue: Value.number({
    name: 'RPC Work Queue',
    description: 'Depth of the RPC work queue.',
    required: false,
    default: 64,
    min: 8,
    max: 256,
    integer: true,
    units: 'requests',
    placeholder: '64',
  }),

  // ── Pruning ───────────────────────────────────────────────────────────────
  prune: Value.number({
    name: 'Prune Target',
    description:
      'Limit blockchain storage (MB). 0 = disabled. Min 550 MB when enabled. Incompatible with txindex.',
    required: false,
    default: 0,
    min: 0,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '0 (disabled)',
    warning: 'Enabling pruning disables the transaction index.',
  }),

  // ── Mempool & Relay ───────────────────────────────────────────────────────
  maxmempool: Value.number({
    name: 'Max Mempool Size',
    description: 'Maximum mempool memory usage in MB.',
    required: false,
    default: null,
    min: 5,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '300',
  }),
  minrelaytxfee: Value.number({
    name: 'Minimum Relay Fee',
    description: 'Minimum fee rate (BCH/kB) for relaying transactions.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: false,
    units: 'BCH/kB',
    placeholder: '0.00001',
    step: 0.000001,
  }),
  mempoolexpiry: Value.number({
    name: 'Mempool Expiry',
    description: 'Hours before unconfirmed transactions are evicted.',
    required: false,
    default: null,
    min: 1,
    max: 720,
    integer: true,
    units: 'hours',
    placeholder: '336',
  }),

  // ── Block Policy ──────────────────────────────────────────────────────────
  excessiveblocksize: Value.number({
    name: 'Excessive Block Size',
    description: 'Max accepted block size in bytes. BCHN default: 32000000 (32 MB).',
    required: false,
    default: null,
    min: 1000000,
    max: null,
    integer: true,
    units: 'bytes',
    placeholder: '32000000',
  }),
  limitancestorcount: Value.number({
    name: 'Ancestor Limit',
    description: 'Max in-mempool ancestors per transaction.',
    required: false,
    default: null,
    min: 1,
    max: 1000,
    integer: true,
    units: 'transactions',
    placeholder: '25',
  }),
  limitdescendantcount: Value.number({
    name: 'Descendant Limit',
    description: 'Max in-mempool descendants per transaction.',
    required: false,
    default: null,
    min: 1,
    max: 1000,
    integer: true,
    units: 'transactions',
    placeholder: '25',
  }),

  // ── Advanced ──────────────────────────────────────────────────────────────
  blocknotify: Value.text({
    name: 'Block Notify Script',
    description:
      'Execute this shell command when a new block is received. Use %s as a placeholder for the block hash.',
    required: false,
    default: null,
    masked: false,
    placeholder: '/path/to/script.sh %s',
  }),
  wallet: Value.list(
    List.text(
      {
        name: 'Wallet Files',
        description:
          'Specify wallet file names to load on startup. Leave empty to use the default wallet.',
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        masked: false,
        placeholder: 'wallet.dat',
      },
    ),
  ),
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    zmqpubhashblock, zmqpubhashtx, zmqpubrawblock, zmqpubrawtx,
    txindex, persistmempool,
    maxconnections, peerbloomfilters, onlynet, addnode, maxuploadtarget,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    dbcache, dbbatchsize, blocknotify, wallet,
  } = input

  // When no onlynet is written in conf, all networks are allowed — show all checked
  const onlynetFromConf = onlynet?.filter((v): v is string => !!v) ?? []
  const onlynetForm = onlynetFromConf.length === 0 ? ALL_ONLYNETS : onlynetFromConf as OnlynetKey[]

  return {
    raw: input ?? {},
    zmqEnabled: !!(zmqpubhashblock && zmqpubhashtx && zmqpubrawblock && zmqpubrawtx),
    txindex, persistmempool,
    maxconnections, peerbloomfilters,
    onlynet: onlynetForm,
    addnode: addnode?.filter((v): v is string => !!v) ?? [],
    maxuploadtarget,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    dbcache, dbbatchsize,
    blocknotify: blocknotify ?? undefined,
    wallet: wallet?.filter((v): v is string => !!v) ?? [],
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw, zmqEnabled, txindex, persistmempool,
    maxconnections, peerbloomfilters, onlynet, addnode, maxuploadtarget,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    dbcache, dbbatchsize, blocknotify, wallet,
  } = input

  const effectiveTxindex = prune && prune > 0 ? false : (txindex ?? false)
  // If all networks selected (or none specified), don't write onlynet (means allow all)
  const onlynetList = (onlynet as string[] | undefined)?.filter(Boolean) ?? []
  const allSelected = ALL_ONLYNETS.every((n) => onlynetList.includes(n))
  const writeOnlynet = onlynetList.length > 0 && !allSelected ? onlynetList : undefined

  return {
    ...raw,
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    rpcuser: raw?.rpcuser,
    rpcpassword: raw?.rpcpassword,
    rpcauth: raw?.rpcauth?.filter((v): v is string => typeof v === 'string'),
    externalip: raw?.externalip?.filter((v): v is string => typeof v === 'string'),
    txindex: effectiveTxindex,
    persistmempool: persistmempool ?? true,
    // ZMQ block/tx — conditional
    ...(zmqEnabled
      ? zmqBundle
      : { zmqpubrawblock: undefined, zmqpubhashblock: undefined,
          zmqpubrawtx: undefined, zmqpubhashtx: undefined }),
    // ZMQ DSP — ALWAYS ON
    ...dspZmqBundle,
    maxconnections: maxconnections ?? undefined,
    peerbloomfilters: peerbloomfilters ?? undefined,
    onlynet: writeOnlynet,
    addnode: addnode && (addnode as string[]).length > 0 ? (addnode as string[]).filter(Boolean) : undefined,
    maxuploadtarget: maxuploadtarget ?? undefined,
    rpcservertimeout: rpcservertimeout ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
    rpcworkqueue: rpcworkqueue ?? undefined,
    prune: prune && prune > 0 ? prune : undefined,
    maxmempool: maxmempool ?? undefined,
    minrelaytxfee: minrelaytxfee ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,
    excessiveblocksize: excessiveblocksize ?? undefined,
    limitancestorcount: limitancestorcount ?? undefined,
    limitdescendantcount: limitdescendantcount ?? undefined,
    dbcache: dbcache ?? undefined,
    dbbatchsize: dbbatchsize ?? undefined,
    blocknotify: blocknotify ?? undefined,
    wallet: wallet && (wallet as string[]).length > 0 ? (wallet as string[]).filter(Boolean) : undefined,
    // DSP relay — always forced on
    doublespendproof: true,
  }
}

export const bitcoinConfFile = FileHelper.ini(
  { base: sdk.volumes.main, subpath: '/bitcoin.conf' },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => fileToForm(shape.parse(a)),
    onWrite: (a) => stringifyPrimitives(formToFile(a)) as Record<string, unknown>,
  },
)
