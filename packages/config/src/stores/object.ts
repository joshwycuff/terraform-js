import _ from 'lodash';

import { JSONObject } from '@joshwycuff/types';

/**
 * @param config
 * @param obj
 * @param customizer
 */
export function updateConfigFromObject(
  config: JSONObject,
  obj: JSONObject,
  customizer?: _.MergeWithCustomizer,
): void {
  _.mergeWith(config, obj, customizer);
}
