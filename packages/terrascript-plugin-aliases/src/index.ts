import _ from 'lodash';

import { JSONArray, JSONObject, JSONValue } from '@joshwycuff/types';
import { ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';

import { log } from './logging';

export default class Aliases implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    if (!('aliases' in spec)) {
      // eslint-disable-next-line no-param-reassign
      spec.aliases = {};
    }
    Aliases._compile(spec, spec);
  }

  private static _compile(spec: ISpec, x: JSONValue) {
    if (Array.isArray(x)) {
      Aliases._compileArray(spec, x);
    } else if (_.isPlainObject(x)) {
      Aliases._compileObject(spec, x as JSONObject);
    }
  }

  private static _compileArray(spec: ISpec, arr: JSONArray) {
    arr.forEach((element: JSONValue, index: number) => {
      if (typeof element === 'string') {
        if (Aliases._isAlias(spec, element)) {
          // eslint-disable-next-line no-param-reassign
          arr[index] = Aliases._getAlias(spec, element);
        }
      } else {
        Aliases._compile(spec, element);
      }
    });
  }

  private static _compileObject(spec: ISpec, obj: JSONObject) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string') {
        if (Aliases._isAlias(spec, value)) {
          // eslint-disable-next-line no-param-reassign
          obj[key] = Aliases._getAlias(spec, value);
        }
      } else {
        Aliases._compile(spec, value);
      }
    }
  }

  private static _isAlias(spec: ISpec, str: string): boolean {
    return str[0] === '@' && str.slice(1) in (spec.aliases as JSONObject);
  }

  private static _getAlias(spec: ISpec, str: string): JSONValue {
    log.silly(`Getting "${spec.name}" alias "${str}"`);
    const val = (spec.aliases as JSONObject)![str.slice(1)];
    log.silly(`"${spec.name}" alias "${str}": ${JSON.stringify(val, null, 2)}`);
    return val;
  }
}
