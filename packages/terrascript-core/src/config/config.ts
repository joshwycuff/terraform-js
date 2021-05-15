import { conf, MergeStack } from '@joshwycuff/config';
import { IConfig } from '../interfaces/config';
import { TERRASCRIPT_RC_JS } from '../constants';

export const defaults: IConfig = {
  env: {},
  logLevel: 'warn',
  silly: false,
  debug: false,
  verbose: false,
  info: false,
  warn: false,
  error: false,
  onSubprojectNotFound: 'warn',
  onTargetNotFound: 'warn',
};

// eslint-disable-next-line import/no-mutable-exports
export let config: MergeStack<IConfig>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let configResolve = (value: unknown) => { };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let configReject = (value: unknown) => { };
export const configReady = new Promise((resolve, reject) => {
  configResolve = resolve;
  configReject = reject;
});
(async () => {
  try {
    config = (await conf(defaults, 'terrascript')
      .optionalFileSync(TERRASCRIPT_RC_JS))
      .env()
      .argv()
      .asStack();
    if (configResolve) configResolve(null);
  } catch (error) {
    if (configReject) configReject(error);
  }
})();
