import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { makeZmqBundle } from '../utils'

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

    // ZMQ
    zmqpubrawblock: iniString,
    zmqpubhashblock: iniString,
    zmqpubrawtx: iniString,
    zmqpubhashtx: iniString,

    // Indexing
    txindex: iniBoolean,

    // Peers
    maxconnections: iniNumber,

    // RPC tuning
    rpcservertimeout: iniNumber,
    rpcthreads: iniNumber,
    rpcworkqueue: iniNumber,

    // Pruning (0 = disabled, ≥550 = MB target)
    prune: iniNumber,

    // Mempool
    maxmempool: iniNumber,
    minrelaytxfee: iniNumber,
    mempoolexpiry: iniNumber,

    // Block policy
    excessiveblocksize: iniNumber,
    limitancestorcount: iniNumber,
    limitdescendantcount: iniNumber,

    // Double Spend Proof relay (default: 1 = enabled in BCHN v23+)
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

  // ── Network (virtual — stored in store.json, not bitcoin.conf) ───────────
  // NOTE: network is handled by a separate action writing to store.json.

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
  doublespendproof: Value.toggle({
    name: 'Double Spend Proof Relay',
    description:
      'Enable Double Spend Proof (DSP) relay. When BCHN detects a double-spend attempt, it broadcasts a cryptographic proof to the network. Merchants can use getdsproofscore <txid> to get a 0-1 confidence score for 0-conf payments. Enabled by default in BCHN v23+ — only disable if you have a specific reason.',
    default: true,
    warning:
      'Disabling DSP relay removes 0-confirmation payment protection for merchants and services relying on dsproofscore. Only disable if you understand the implications.',
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
    doublespendproof,
  } = input

  return {
    raw: input ?? {},
    zmqEnabled: !!(
      zmqpubhashblock &&
      zmqpubhashtx &&
      zmqpubrawblock &&
      zmqpubrawtx
    ),
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
    // default true if not set (matches BCHN default)
    doublespendproof: doublespendproof ?? true,
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
  // network is passed in so ZMQ ports can be adjusted for testnet4
  network: 'mainnet' | 'testnet3' | 'testnet4' | 'chipnet' | 'regtest' = 'mainnet',
): z.infer<typeof shape> {
  const {
    raw,
    zmqEnabled,
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
    doublespendproof,
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

    // ZMQ
    ...(zmqEnabled
      ? makeZmqBundle(network)
      : {
          zmqpubrawblock: undefined,
          zmqpubhashblock: undefined,
          zmqpubrawtx: undefined,
          zmqpubhashtx: undefined,
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

    // DSP relay — omit when true (BCHN default), write 0 only when explicitly disabled
    doublespendproof: doublespendproof === false ? false : undefined,
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

// Variant that writes with a specific network (for ZMQ port selection)
export function bitcoinConfFileForNetwork(
  network: 'mainnet' | 'testnet3' | 'testnet4' | 'chipnet' | 'regtest',
) {
  return FileHelper.ini(
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
        return stringifyPrimitives(formToFile(a, network)) as Record<
          string,
          unknown
        >
      },
    },
  )
}
