import { conf, MergeStack } from '@joshwycuff/config';
import { Hash, JSONObject } from '@joshwycuff/types';

export const NAMESPACE = 'terraform';

export interface IConfig extends JSONObject {
  logLevel: string;
  silly: boolean;
  debug: boolean;
  verbose: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;

  cwd: string;
  env: Hash<string>;

  terraformCommand: string;
  tfVars: Hash<string>;
  tfVarsFiles: string[];
  autoApprove: boolean;
  autoApproveApply: boolean;
  autoApproveDestroy: boolean;
  backendConfig: Hash<string>;
  backendConfigFile: null | string;
}

export interface IConfigOptions {
  logLevel?: string;
  silly?: boolean;
  debug?: boolean;
  verbose?: boolean;
  info?: boolean;
  warn?: boolean;
  error?: boolean;

  cwd?: string;
  env?: Hash<string>;

  terraformCommand?: string;
  tfVars?: Hash<string>;
  tfVarsFiles?: string[];
  autoApprove?: boolean;
  autoApproveApply?: boolean;
  autoApproveDestroy?: boolean;
  backendConfig?: Hash<string>;
  backendConfigFile?: string;
}

const defaults: IConfig = {
  logLevel: 'warn',
  silly: false,
  debug: false,
  verbose: false,
  info: false,
  warn: false,
  error: false,

  cwd: '.',
  env: process.env as Hash<string>,

  terraformCommand: 'terraform',
  tfVars: {},
  tfVarsFiles: [],
  autoApprove: false,
  autoApproveApply: false,
  autoApproveDestroy: false,
  backendConfig: {},
  backendConfigFile: null,
};

export const config: MergeStack<IConfig> = conf<IConfig>(defaults, NAMESPACE)
  .env()
  .argv()
  .asStack();
