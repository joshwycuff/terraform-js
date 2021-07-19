import { conf, MergeStack } from '@joshwycuff/config';
import { JSONObject } from '@joshwycuff/types';

export const NAMESPACE = 'iamlive';

export interface IConfig extends JSONObject {
  logLevel: string;
  silly: boolean;
  debug: boolean;
  verbose: boolean;
  info: boolean;
  warn: boolean;
  error: boolean;
  accountId: string;
  background: boolean;
  bindAddr: string;
  caBundle: string;
  caKey: string;
  detached: boolean;
  enabled: boolean;
  failsOnly: boolean;
  forceWildcardResource: boolean;
  host: string;
  mode: string;
  outputFile: string;
  profile: string;
  setIni: boolean;
  sortAlphabetical: boolean;
  stdio: string;
  autoStart: boolean;
  autoStop: boolean;
}

const defaults = {
  logLevel: 'warn',
  silly: false,
  debug: false,
  verbose: false,
  info: false,
  warn: false,
  error: false,
  detached: true,
  enabled: true,
  mode: 'csm',
  stdio: 'ignore',
  outputFile: 'iamlive-policy.json',
  autoStart: false,
  autoStop: true,
} as IConfig;

export const config: MergeStack<IConfig> = conf<IConfig>(defaults, NAMESPACE)
  .env()
  .argv()
  .asStack();

/**
 * @param configs
 * @param func
 */
export async function withConfigs(
  configs: IConfig[],
  func: (c: IConfig) => Promise<void>,
): Promise<void> {
  for (const c of configs) {
    config.push(c);
  }
  await func(config.peek() as IConfig);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const c of configs) {
    config.pop();
  }
}
