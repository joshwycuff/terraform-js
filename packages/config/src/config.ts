import fs from 'fs';
import _ from 'lodash';

import { JSONObject } from '@joshwycuff/types';
import { MergeStack } from '@joshwycuff/merge-stack';
import { ArgvConfig } from './stores/argv';
import { EnvConfig } from './stores/env';
import { updateConfigFromFile } from './stores/file';
import { updateConfigFromObject } from './stores/object';

export class Config<T extends JSONObject = JSONObject> {
  private props: T;

  private namespace;

  private customizer;

  constructor(defaults: T, namespace = '', customizer?: _.MergeWithCustomizer) {
    this.props = _.cloneDeep(defaults);
    this.namespace = namespace;
    this.customizer = customizer;
  }

  peek() {
    return this.props;
  }

  argv() {
    ArgvConfig.updateConfigFromArgv(this.namespace, this.props);
    return this;
  }

  env() {
    EnvConfig.updateConfigFromEnv(this.namespace, this.props);
    return this;
  }

  object(obj: T) {
    updateConfigFromObject(this.props, obj, this.customizer);
    return this;
  }

  file(filepath: string) {
    updateConfigFromFile(this.props, filepath, this.customizer);
    return this;
  }

  async fileSync(filepath: string) {
    await updateConfigFromFile(this.props, filepath, this.customizer);
    return this;
  }

  async optionalFileSync(filepath: string) {
    if (await fs.existsSync(filepath)) {
      await this.file(filepath);
    }
    return this;
  }

  asStack(): MergeStack<T> {
    return new MergeStack<T>(this.props, this.customizer);
  }
}

/**
 * @param defaults
 * @param namespace
 * @param customizer
 */
export function config(
  defaults: JSONObject,
  namespace = '',
  customizer?: _.MergeWithCustomizer,
) {
  return new Config(defaults, namespace, customizer);
}

export const conf = config;
