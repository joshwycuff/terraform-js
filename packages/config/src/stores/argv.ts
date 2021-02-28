import { JSONObject, JSONPrimitive, JSONValue } from '@joshwycuff/types';
import { Utils } from '../utils';

export class ArgvConfig {
  /**
   * @param namespace
   * @param config
   */
  static updateConfigFromArgv(namespace: string, config: JSONObject) {
    ArgvConfig.updateConfig(namespace, config, config);
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
        ArgvConfig.updateConfig(namespace, config, sub[key], keys.concat([key]));
      }
    } else {
      ArgvConfig.set(config, keys, ArgvConfig.get(namespace, keys, sub));
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
    const unnamespacedOptionName = `--${ArgvConfig.formatKeys(keys)}`;
    const namespacedOptionName = `--${namespace.toLowerCase()}--${unnamespacedOptionName}`;
    for (const arg of ArgvConfig.getProcessArgv()) {
      if (arg.includes(namespacedOptionName)) {
        return Utils.formatValueFromString(defaultValue, ArgvConfig.extractValue(arg));
      }
      if (arg.includes(unnamespacedOptionName)) {
        value = Utils.formatValueFromString(defaultValue, ArgvConfig.extractValue(arg));
      }
    }
    return value;
  }

  /**
   * @param keys
   */
  private static formatKeys(keys: string[]): string {
    return keys.map((k) => ArgvConfig.formatKey(k))
      .join('--');
  }

  /**
   * @param key
   */
  private static formatKey(key: string): string {
    const regexp = /([A-Z]|[a-z])[\da-z]*/g;
    const words = [...key.matchAll(regexp)].map((m) => m[0]);
    return words.join('-')
      .toLowerCase();
  }

  /**
   * @param arg
   */
  private static extractValue(arg: string): string {
    return arg.slice(arg.indexOf('=') + 1);
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

  /**
   *
   */
  static getProcessArgv(): string[] {
    return process.argv;
  }
}
