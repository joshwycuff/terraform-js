import fs from 'fs';
import _ from 'lodash';

import { JSONObject } from '@joshwycuff/types';
import { MergeStack } from '@joshwycuff/merge-stack';
import { ArgvConfig } from './stores/argv';
import { EnvConfig } from './stores/env';
import { updateConfigFromFile } from './stores/file';
import { updateConfigFromObject } from './stores/object';

export class Config<T extends JSONObject = JSONObject> {
  private defaults: T;

  private config: T;

  private namespace;

  private customizer;

  constructor(defaults: T, namespace = '', customizer?: _.MergeWithCustomizer) {
    this.defaults = _.cloneDeep(defaults);
    this.config = _.cloneDeep(defaults);
    this.namespace = namespace;
    this.customizer = customizer;
  }

  peek() {
    return this.config;
  }

  argv() {
    ArgvConfig.updateConfigFromArgv(this.namespace, this.defaults, this.config);
    return this;
  }

  env() {
    EnvConfig.updateConfigFromEnv(this.namespace, this.defaults, this.config);
    return this;
  }

  object(obj: T) {
    updateConfigFromObject(this.namespace, this.config, obj, this.customizer);
    return this;
  }

  file(filepath: string) {
    updateConfigFromFile(this.namespace, this.config, filepath, this.customizer);
    return this;
  }

  async fileSync(filepath: string) {
    await updateConfigFromFile(this.namespace, this.config, filepath, this.customizer);
    return this;
  }

  async optionalFileSync(filepath: string) {
    if (await fs.existsSync(filepath)) {
      await this.file(filepath);
    }
    return this;
  }

  asStack(): MergeStack<T> {
    return new MergeStack<T>(this.config, this.customizer);
  }
}

/**
 * @param defaults
 * @param namespace
 * @param customizer
 */
export function config<T extends JSONObject = JSONObject>(
  defaults: T,
  namespace = '',
  customizer?: _.MergeWithCustomizer,
) {
  return new Config<T>(defaults, namespace, customizer);
}

/**
 * @param defaults
 * @param namespace
 * @param customizer
 */
export function conf<T extends JSONObject = JSONObject>(
  defaults: T,
  namespace = '',
  customizer?: _.MergeWithCustomizer,
) {
  return new Config<T>(defaults, namespace, customizer);
}
