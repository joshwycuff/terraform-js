// eslint-disable-next-line @typescript-eslint/naming-convention
import { Hash, JSONObject } from '@joshwycuff/types';
import { LogLevel } from './types';

export interface IConfig extends JSONObject {
  env: Hash<string>;
  logLevel: string;
  silly: boolean;
  debug: boolean;
  verbose: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
  onSubprojectNotFound: LogLevel;
  onTargetNotFound: LogLevel;
}
