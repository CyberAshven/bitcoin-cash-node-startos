import { FileHelper, T, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { rpcPort, zmqBundle } from '../utils'

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
    rpcbind: z.string().catch(`0.0.0.0:${rpcPort}`),
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
      'Enable ZeroMQ notifications for block and transaction events. Required by some applications that need real-time blockchain data.',
    default: false,
  }),
  txindex: Value.toggle({
    name: 'Transaction Index',
    description:
      'Build a complete transaction index. Required for Fulcrum (BCH Electrum server) and other indexers.',
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
  }
}

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): z.infer<typeof shape> {
  const {
    raw,
    zmqEnabled,
    txindex,
    maxconnections,
    rpcservertimeout,
    rpcthreads,
    rpcworkqueue,
  } = input

  return {
    ...raw,

    // Enforced
    server: true,
    listen: true,
    rpcbind: `0.0.0.0:${rpcPort}`,
    rpcallowip: '0.0.0.0/0',
    // rpcuser/rpcpassword come from raw (written by seedFiles via merge)
    rpcuser: raw?.rpcuser,
    rpcpassword: raw?.rpcpassword,

    // Indexing
    txindex: txindex ?? false,

    // ZMQ
    ...(zmqEnabled
      ? zmqBundle
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
