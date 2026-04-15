import { VersionGraph } from '@start9labs/start-sdk'
import { v_29_0_0_0 } from './v29.0.0.0'
import { v_28_0_2_1 } from './v28.0.2.1'
import { v_28_0_2_0 } from './v28.0.2.0'

export const versionGraph = VersionGraph.of({
  current: v_29_0_0_0,
  other: [v_28_0_2_1, v_28_0_2_0],
})
