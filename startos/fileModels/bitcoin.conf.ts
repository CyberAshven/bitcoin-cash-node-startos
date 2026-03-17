import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { zmqBundle, dspZmqBundle } from '../utils'

// INI coercion helpers
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
    // Enforced fields
    server: z.literal(true).catch(true),
    listen: z.literal(true).catch(true),
    rpcbind: z.string().catch('0.0.0.0'),
    rpcallowip: z.string().catch('0.0.0.0/0'),
    rpcuser: iniString,
    rpcpassword: iniString,

    // ZMQ — block / transaction (ports 28332 / 28333)
    zmqpubrawblock: iniString,
    zmqpubhashblock: iniString,
    zmqpubrawtx: iniString,
    zmqpubhashtx: iniString,

    // ZMQ — Double Spend Proof (ports 28334 / 28335)
    zmqpubhashds: iniString,
    zmqpubrawds: iniString,

    // Indexing
    txindex: iniBoolean,

    // Peers
    maxconnections: iniNumber,

    // RPC tuning
    rpcservertimeout: iniNumber,
    rpcthreads: iniNumber,
    rpcworkqueue: iniNumber,

    // Pruning (0 = disabled, ≥550 MB target)
    prune: iniNumber,

    // Mempool
    maxmempool: iniNumber,
    minrelaytxfee: iniNumber,
    mempoolexpiry: iniNumber,

    // Block policy
    excessiveblocksize: iniNumber,
    limitancestorcount: iniNumber,
    limitdescendantcount: iniNumber,

    // DSP relay — always forced on; read-only field for config round-trip
    doublespendproof: iniBoolean,
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

  // ── Node ────────────────────────────────────────────────────────────────
  zmqEnabled: Value.toggle({
    name: 'ZeroMQ Enabled',
    description:
      'Enable ZeroMQ notifications for block and transaction events. Required by some applications that need real-time blockchain data (e.g. Fulcrum, block explorers).',
    default: false,
  }),
  txindex: Value.toggle({
    name: 'Transaction Index',
    description:
      'Build a full transaction index. Required for Fulcrum (BCH Electrum server) and other indexers. Cannot be enabled when pruning is active.',
    default: false,
  }),
  maxconnections: Value.number({
    name: 'Maximum Connections',
    description: 'Maximum number of peer connections to maintain.',
    default: 125,
    required: false,
    min: 8,
    max: 1000,
    integer: true,
    placeholder: '125',
  }),

  // ── DSP ZMQ ──────────────────────────────────────────────────────────────
  zmqDspEnabled: Value.toggle({
    name: 'DSP ZMQ Notifications',
    description:
      'Stream Double Spend Proof events over ZMQ. When BCHN detects a double-spend attempt it publishes on two channels: zmqpubhashds (port 28334) sends the TX hash, zmqpubrawds (port 28335) sends the raw conflicting TX bytes. Useful for payment processors, exchanges, and POS systems monitoring 0-conf payments.',
    default: false,
  }),

  // ── RPC tuning ───────────────────────────────────────────────────────────
  rpcservertimeout: Value.number({
    name: 'RPC Server Timeout',
    description: 'Seconds after which an uncompleted RPC call will time out.',
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
    description: 'Number of threads for handling RPC calls.',
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
    description:
      'Depth of the work queue for RPC calls before new ones are rejected.',
    required: false,
    default: 64,
    min: 8,
    max: 256,
    integer: true,
    units: 'requests',
    placeholder: '64',
  }),

  // ── Pruning ──────────────────────────────────────────────────────────────
  prune: Value.number({
    name: 'Prune Target',
    description:
      'Limit blockchain storage to this size in MB. Set to 0 to disable pruning. Minimum value when enabled is 550 MB. Enabling pruning will automatically disable the transaction index.',
    required: false,
    default: null,
    min: 0,
    max: null,
    integer: true,
    units: 'MB',
    placeholder: '0 (disabled)',
    warning:
      'Pruning is incompatible with txindex. Enabling pruning will disable the transaction index and remove full historical data.',
  }),

  // ── Mempool & Relay ───────────────────────────────────────────────────────
  maxmempool: Value.number({
    name: 'Max Mempool Size',
    description: 'Maximum memory usage for the mempool in megabytes.',
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
    description:
      'Minimum fee rate (in BCH/kB) for transactions to be relayed. Transactions below this fee will be rejected from the mempool.',
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
    description:
      'Time in hours before an unconfirmed transaction is evicted from the mempool.',
    required: false,
    default: null,
    min: 1,
    max: 720,
    integer: true,
    units: 'hours',
    placeholder: '336',
  }),

  // ── Block Policy ─────────────────────────────────────────────────────────
  excessiveblocksize: Value.number({
    name: 'Excessive Block Size',
    description:
      'Maximum block size in bytes that this node will accept. Blocks larger than this are rejected. BCHN default is 32 MB (32000000 bytes). Relevant for miners and service providers.',
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
    description:
      'Maximum number of in-mempool ancestors a transaction may have before being rejected.',
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
    description:
      'Maximum number of in-mempool descendants a transaction may have before being rejected.',
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
    zmqpubhashblock,
    zmqpubhashtx,
    zmqpubrawblock,
    zmqpubrawtx,
    zmqpubhashds,
    zmqpubrawds,
    txindex,
    maxconnections,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
    prune,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    excessiveblocksize,
    limitancestorcount,
    limitdescendantcount,
  } = input

  return {
    raw: input ?? {},
    zmqEnabled: !!(
      zmqpubhashblock &&
      zmqpubhashtx &&
      zmqpubrawblock &&
      zmqpubrawtx
    ),
    zmqDspEnabled: !!(zmqpubhashds && zmqpubrawds),
    txindex,
    maxconnections,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
    prune,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    excessiveblocksize,
    limitancestorcount,
    limitdescendantcount,
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw,
    zmqEnabled,
    zmqDspEnabled,
    txindex,
    maxconnections,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
    prune,
    maxmempool,
    minrelaytxfee,
    mempoolexpiry,
    excessiveblocksize,
    limitancestorcount,
    limitdescendantcount,
  } = input

  // pruning is incompatible with txindex — auto-disable txindex when prune > 0
  const effectiveTxindex = prune && prune > 0 ? false : (txindex ?? false)

  return {
    ...raw,

    // Enforced
    server: true,
    listen: true,
    rpcbind: '0.0.0.0',
    rpcallowip: '0.0.0.0/0',
    rpcuser: raw?.rpcuser,
    rpcpassword: raw?.rpcpassword,

    // Indexing
    txindex: effectiveTxindex,

    // ZMQ — block / tx
    ...(zmqEnabled
      ? zmqBundle
      : {
          zmqpubrawblock: undefined,
          zmqpubhashblock: undefined,
          zmqpubrawtx: undefined,
          zmqpubhashtx: undefined,
        }),

    // ZMQ — DSP
    ...(zmqDspEnabled
      ? dspZmqBundle
      : {
          zmqpubhashds: undefined,
          zmqpubrawds: undefined,
        }),

    // Peers
    maxconnections: maxconnections ?? undefined,

    // RPC tuning
    rpcservertimeout: rpcservertimeout ?? undefined,
    rpcthreads: rpcthreads ?? undefined,
    rpcworkqueue: rpcworkqueue ?? undefined,

    // Pruning
    prune: prune && prune > 0 ? prune : undefined,

    // Mempool
    maxmempool: maxmempool ?? undefined,
    minrelaytxfee: minrelaytxfee ?? undefined,
    mempoolexpiry: mempoolexpiry ?? undefined,

    // Block policy
    excessiveblocksize: excessiveblocksize ?? undefined,
    limitancestorcount: limitancestorcount ?? undefined,
    limitdescendantcount: limitdescendantcount ?? undefined,

    // DSP relay — always forced on (BCHN default, never expose toggle)
    doublespendproof: true,
  }
}

export const bitcoinConfFile = FileHelper.ini(
  {
    base: sdk.volumes.main,
    subpath: '/bitcoin.conf',
  },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => {
      const base = shape.parse(a)
      return fileToForm(base)
    },
    onWrite: (a) => {
      return stringifyPrimitives(formToFile(a)) as Record<string, unknown>
    },
  },
)
