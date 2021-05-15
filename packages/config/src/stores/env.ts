import { Hash, JSONObject, JSONPrimitive, JSONValue } from '@joshwycuff/types';

export class EnvConfig {
  /**
   * @param namespace
   * @param config
   * @param defaults
   */
  static updateConfigFromEnv(namespace: string, defaults: JSONObject, config: JSONObject) {
    EnvConfig.updateConfig(namespace, defaults, config);
  }

  /**
   * @param namespace
   * @param config
   * @param sub
   * @param defaults
   * @param keys
   */
  private static updateConfig(
    namespace: string,
    defaults: JSONValue,
    config: JSONObject,
    keys: string[] = [],
  ) {
    if (Array.isArray(defaults)) {
      EnvConfig.set(config, keys, EnvConfig.get(namespace, keys, defaults as Array<JSONPrimitive>));
    } else if (typeof defaults === 'object' && defaults !== null) {
      for (const key of Object.keys(defaults)) {
        EnvConfig.updateConfig(namespace, defaults[key], config, keys.concat([key]));
      }
    } else {
      EnvConfig.set(config, keys, EnvConfig.get(namespace, keys, defaults));
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
    const unnamespacedOptionName = EnvConfig.formatKeys(keys);
    const namespacedOptionName = `${namespace.toLowerCase()}__${unnamespacedOptionName}`;
    for (const envVarName of Object.keys(EnvConfig.getProcessEnv())) {
      if (envVarName.includes(namespacedOptionName)) {
        return EnvConfig.formatValueFromString(defaultValue, EnvConfig.getStringValue(envVarName));
      }
      if (envVarName.includes(unnamespacedOptionName)) {
        value = EnvConfig.formatValueFromString(defaultValue, EnvConfig.getStringValue(envVarName));
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
  private static set(config: JSONObject, keys: string[], value: JSONPrimitive | Array<JSONPrimitive> | undefined) {
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

  static formatValueFromString(defaultValue: JSONPrimitive | Array<JSONPrimitive>, value: string): JSONPrimitive | Array<JSONPrimitive> {
    if (typeof defaultValue === 'number') {
      return +value;
    }
    if (typeof defaultValue === 'boolean') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    if (Array.isArray(defaultValue)) {
      return value.split(',');
    }
    return value;
  }

  /**
   *
   */
  static getProcessEnv(): Hash<string> {
    return process.env as Hash<string>;
  }
}
