import { VersionGraph } from '@start9labs/start-sdk'
import { FLAVOR } from '../flavor'
import { v_29_0_0_0 } from './v29.0.0.0'
import { v_28_0_2_1 } from './v28.0.2.1'
import { v_28_0_2_0 } from './v28.0.2.0'
import { knuth_v_0_1_0_0 } from './knuth_v0.1.0.0'

/**
 * Flavor-aware version graph.
 *
 * BCHN build (default):  current = #bchn:29.0.0:0
 * Knuth build:           current = #knuth:0.1.0:0
 *
 * Both flavors include each other in `other` so cross-flavor
 * migration (flavor swap) works seamlessly.
 */
export const versionGraph = VersionGraph.of(
  FLAVOR === 'knuth'
    ? {
        current: knuth_v_0_1_0_0,
        other: [v_29_0_0_0, v_28_0_2_1, v_28_0_2_0],
      }
    : {
        current: v_29_0_0_0,
        other: [v_28_0_2_1, v_28_0_2_0, knuth_v_0_1_0_0],
      },
)
