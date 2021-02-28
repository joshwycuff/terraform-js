import { JSONPrimitive } from '@joshwycuff/types';

export class Utils {
  static formatValueFromString(defaultValue: JSONPrimitive, value: string): JSONPrimitive {
    if (typeof defaultValue === 'number') {
      return +value;
    }
    if (typeof defaultValue === 'boolean') {
      return value === 'true';
    }
    return value;
  }
}
