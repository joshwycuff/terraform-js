import { conf, MergeStack } from '@joshwycuff/config';
import { JSONObject } from '@joshwycuff/types';

export interface IConfig extends JSONObject {
  logLevel: string;
  silly: boolean;
  debug: boolean;
  verbose: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
}

const defaults: IConfig = {
  logLevel: 'warn',
  silly: false,
  debug: false,
  verbose: false,
  info: false,
  warn: false,
  error: false,
};

export const config: MergeStack<IConfig> = conf<IConfig>(defaults, 'command')
  .env()
  .argv()
  .asStack();
