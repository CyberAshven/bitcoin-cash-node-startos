import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { zmqBundle, dspZmqBundle } from '../utils'

const iniString = z
  .union([z.array(z.string()).transform((a) => a.at(-1)!), z.string()])
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
    excessiveblocksize: iniNumber,
    limitancestorcount: iniNumber,
    limitdescendantcount: iniNumber,
    doublespendproof: iniBoolean,
    blockfilterindex: iniBoolean,
    coinstatsindex: iniBoolean,
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

const { InputSpec, Value } = sdk

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  zmqEnabled: Value.toggle({
    name: 'ZeroMQ Enabled',
    description:
      'Enable ZeroMQ notifications for block and transaction events. Required by Fulcrum, block explorers, and similar tools.',
    default: false,
  }),
  txindex: Value.toggle({
    name: 'Transaction Index',
    description:
      'Build a full transaction index. Required for Fulcrum and other indexers. Cannot be enabled with pruning.',
    default: false,
  }),
  blockfilterindex: Value.toggle({
    name: 'Block Filter Index',
    description:
      'Build a compact block filter index (BIP 157/158). Required by some light clients and wallets for efficient SPV. Increases disk usage slightly.',
    default: false,
  }),
  coinstatsindex: Value.toggle({
    name: 'Coin Stats Index',
    description:
      'Build a coin stats index to enable the gettxoutsetinfo RPC with hash_type=muhash. Useful for chain analysis and auditing.',
    default: false,
  }),
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

  prune: Value.number({
    name: 'Prune Target',
    description:
      'Limit blockchain storage (MB). 0 = disabled. Min 550 MB when enabled. Incompatible with txindex.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '0 (disabled)',
    warning: 'Enabling pruning disables the transaction index.',
  }),

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
})

function fileToForm(
  input: z.infer<typeof shape>,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const {
    zmqpubhashblock, zmqpubhashtx, zmqpubrawblock, zmqpubrawtx,
    txindex, maxconnections,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    blockfilterindex, coinstatsindex,
  } = input

  return {
    raw: input ?? {},
    zmqEnabled: !!(zmqpubhashblock && zmqpubhashtx && zmqpubrawblock && zmqpubrawtx),
    txindex, maxconnections,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    blockfilterindex, coinstatsindex,
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw, zmqEnabled, txindex, maxconnections,
    rpcservertimeout, rpcthreads, rpcworkqueue,
    prune, maxmempool, minrelaytxfee, mempoolexpiry,
    excessiveblocksize, limitancestorcount, limitdescendantcount,
    blockfilterindex, coinstatsindex,
  } = input

  const effectiveTxindex = prune && prune > 0 ? false : (txindex ?? false)

  return {
    ...raw,
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    rpcuser: raw?.rpcuser,
    rpcpassword: raw?.rpcpassword,
    txindex: effectiveTxindex,
    // ZMQ block/tx — conditional
    ...(zmqEnabled
      ? zmqBundle
      : { zmqpubrawblock: undefined, zmqpubhashblock: undefined,
          zmqpubrawtx: undefined, zmqpubhashtx: undefined }),
    // ZMQ DSP — ALWAYS ON
    ...dspZmqBundle,
    maxconnections: maxconnections ?? undefined,
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
    blockfilterindex: blockfilterindex ?? undefined,
    coinstatsindex: coinstatsindex ?? undefined,
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
