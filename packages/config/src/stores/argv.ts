import { JSONObject, JSONPrimitive, JSONValue } from '@joshwycuff/types';

export class ArgvConfig {
  /**
   * @param namespace
   * @param defaults
   * @param config
   */
  static updateConfigFromArgv(namespace: string, defaults: JSONObject, config: JSONObject) {
    ArgvConfig.updateConfig(namespace, defaults, config);
  }

  /**
   * @param namespace
   * @param defaults
   * @param config
   * @param sub
   * @param keys
   */
  private static updateConfig(
    namespace: string,
    defaults: JSONValue,
    config: JSONObject,
    keys: string[] = [],
  ) {
    if (Array.isArray(defaults)) {
      ArgvConfig.set(config, keys, ArgvConfig.get(namespace, keys, defaults as JSONPrimitive[]));
    } else if (typeof defaults === 'object' && defaults !== null) {
      for (const key of Object.keys(defaults)) {
        ArgvConfig.updateConfig(namespace, defaults[key], config, keys.concat([key]));
      }
    } else {
      ArgvConfig.set(config, keys, ArgvConfig.get(namespace, keys, defaults));
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
    defaultValue: JSONPrimitive | Array<JSONPrimitive>,
  ): JSONPrimitive | Array<JSONPrimitive> | undefined {
    let value;
    const unnamespacedOptionName = `--${ArgvConfig.formatKeys(keys)}`;
    const namespacedOptionName = `--${namespace.toLowerCase()}${unnamespacedOptionName}`;
    for (const arg of ArgvConfig.getProcessArgv()) {
      if (arg === namespacedOptionName) {
        return ArgvConfig.formatValueFromString(defaultValue, ArgvConfig.extractValue(arg));
      }
      if (arg === unnamespacedOptionName) {
        value = ArgvConfig.formatValueFromString(defaultValue, ArgvConfig.extractValue(arg));
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
    return arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : '';
  }

  /**
   * @param config
   * @param keys
   * @param value
   */
  private static set(
    config: JSONObject,
    keys: string[],
    value: JSONPrimitive | Array<JSONPrimitive> | undefined,
  ) {
    if (value !== undefined) {
      let sub = config;
      for (const key of keys.slice(0, -1)) {
        sub = sub[key] as JSONObject;
      }
      sub[keys.slice(-1)[0]] = value;
    }
  }

  static formatValueFromString(defaultValue: JSONPrimitive | Array<JSONPrimitive>, value: string): JSONPrimitive | Array<JSONPrimitive> {
    if (typeof defaultValue === 'number') {
      return +value;
    }
    if (typeof defaultValue === 'boolean') {
      return value === '' ? !defaultValue : ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    if (Array.isArray(defaultValue)) {
      return value.split(',');
    }
    return value;
  }

  /**
   *
   */
  static getProcessArgv(): string[] {
    return process.argv;
  }
}
