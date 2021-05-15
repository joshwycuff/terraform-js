import _ from 'lodash';

import { JSONObject } from '@joshwycuff/types';

/**
 * @param namespace
 * @param config
 * @param obj
 * @param customizer
 */
export function updateConfigFromObject(
  namespace: string,
  config: JSONObject,
  obj: JSONObject,
  customizer?: _.MergeWithCustomizer,
): void {
  const clone = _.cloneDeep(obj);
  const objNamespace = clone[namespace];
  delete clone[namespace];
  _.mergeWith(config, clone, customizer);
  if (namespace in obj) {
    _.mergeWith(config, objNamespace, customizer);
  }
}
