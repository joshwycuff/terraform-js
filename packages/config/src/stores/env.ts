import { Hash, JSONObject, JSONPrimitive, JSONValue } from '@joshwycuff/types';
import { Utils } from '../utils';

export class EnvConfig {
  /**
   * @param namespace
   * @param config
   */
  static updateConfigFromEnv(namespace: string, config: JSONObject) {
    EnvConfig.updateConfig(namespace, config, config);
  }

  /**
   * @param namespace
   * @param config
   * @param sub
   * @param keys
   */
  private static updateConfig(
    namespace: string,
    config: JSONObject,
    sub: JSONValue,
    keys: string[] = [],
  ) {
    if (Array.isArray(sub)) {
      throw new TypeError('Arrays not yet supported');
    }
    if (typeof sub === 'object' && sub !== null) {
      for (const key of Object.keys(sub)) {
        EnvConfig.updateConfig(namespace, config, sub[key], keys.concat([key]));
      }
    } else {
      EnvConfig.set(config, keys, EnvConfig.get(namespace, keys, sub));
    }
  }

  /**
   * @param namespace
   * @param keys
   * @param defaultValue
   */
  private static get(
    namespace: string,
    keys: string[],
    defaultValue: JSONPrimitive,
  ): JSONPrimitive | undefined {
    let value;
    const unnamespacedOptionName = EnvConfig.formatKeys(keys);
    const namespacedOptionName = `${namespace.toLowerCase()}__${unnamespacedOptionName}`;
    for (const envVarName of Object.keys(EnvConfig.getProcessEnv())) {
      if (envVarName.includes(namespacedOptionName)) {
        return Utils.formatValueFromString(defaultValue, EnvConfig.getStringValue(envVarName));
      }
      if (envVarName.includes(unnamespacedOptionName)) {
        value = Utils.formatValueFromString(defaultValue, EnvConfig.getStringValue(envVarName));
      }
    }
    return value;
  }

  /**
   * @param keys
   */
  private static formatKeys(keys: string[]): string {
    return keys.map((k) => EnvConfig.formatKey(k))
      .join('__');
  }

  /**
   * @param key
   */
  private static formatKey(key: string): string {
    const regexp = /([A-Z]|[a-z])[\da-z]*/g;
    const words = [...key.matchAll(regexp)].map((m) => m[0]);
    return words.join('_')
      .toUpperCase();
  }

  /**
   * @param config
   * @param keys
   * @param value
   */
  private static set(config: JSONObject, keys: string[], value: JSONPrimitive | undefined) {
    if (value !== undefined) {
      let sub = config;
      for (const key of keys.slice(0, -1)) {
        sub = sub[key] as JSONObject;
      }
      sub[keys.slice(-1)[0]] = value;
    }
  }

  private static getStringValue(envVarName: string): string {
    return EnvConfig.getProcessEnv()[envVarName];
  }

  /**
   *
   */
  static getProcessEnv(): Hash<string> {
    return process.env as Hash<string>;
  }
}
