import { ChildProcess, spawn, StdioOptions } from 'child_process';

import { JSONObject } from '@joshwycuff/types';
import { IActionContext, IContext, ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';

import { IConfig, withConfigs } from './config';
import { log } from './logging';

let is_running = false;
let iamliveSubprocess: ChildProcess;
let previousAwsCsmEnabled: string;
let previousAwsCaBundle: string;
let previousHttpProxy: string;
let previousHttpsProxy: string;

export default class Iamlive implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    // eslint-disable-next-line no-param-reassign
    spec.iamlive = spec.iamlive || {} as IConfig;
  }

  static async beforeAll(context: IContext): Promise<void> {
    await withConfigs(
      [context.spec.iamlive as IConfig],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (conf) => {
        if (conf.enabled && conf.autoStart) {
          Iamlive.start(conf);
          Iamlive.modifyContext(context, conf);
        }
      },
    );
  }

  static async afterSuccess(context: IContext): Promise<void> {
    await Iamlive.afterAll(context);
  }

  static async afterFailure(context: IContext): Promise<void> {
    await Iamlive.afterAll(context);
  }

  static async afterAll(context: IContext): Promise<void> {
    await withConfigs(
      [context.spec.iamlive as IConfig],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (conf) => {
        if (conf.enabled && conf.autoStop) {
          Iamlive.stop();
          Iamlive.revertContext(context);
        }
      },
    );
  }

  static async isPluginAction(context: IActionContext): Promise<boolean> {
    const a = context.action;
    return !!a && (typeof (a) === 'object') && (a.constructor === Object) && ('iamlive' in a);
  }

  static async runPluginAction(context: IActionContext): Promise<void> {
    const command = (context.action as JSONObject).iamlive;
    if (command === 'start') {
      await withConfigs(
        [context.spec.iamlive as IConfig, context.action as IConfig],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (conf) => {
          if (conf.enabled) {
            Iamlive.start(conf);
            Iamlive.modifyContext(context, conf);
          }
        },
      );
    } else if (command === 'stop') {
      if (is_running) {
        Iamlive.stop();
        Iamlive.revertContext(context);
      }
    } else {
      throw new Error(`Unknown iamlive action ${command}`);
    }
  }

  private static async start(conf: IConfig): Promise<void> {
    if (is_running) {
      log.warn('iamlive is already running');
    } else {
      log.info('starting iamlive');
      log.silly(JSON.stringify(conf, null, 2));
      const args = Iamlive.getArgs(conf);
      log.debug(`Spawing: iamlive ${args.join(' ')}`);
      iamliveSubprocess = spawn('iamlive', args, {
        stdio: conf.stdio as StdioOptions,
        detached: conf.detached,
      });
    }
    is_running = true;
  }

  private static getArgs(conf: IConfig): string[] {
    const args = [];
    if (conf.accountId) {
      args.push('--account-id');
      args.push(conf.accountId);
    }
    if (conf.background) {
      args.push('--background');
    }
    if (conf.bindAddr) {
      args.push('--bind-addr');
      args.push(conf.bindAddr);
    }
    if (conf.caBundle) {
      args.push('--ca-bundle');
      args.push(conf.caBundle);
    }
    if (conf.caKey) {
      args.push('--ca-key');
      args.push(conf.caKey);
    }
    if (conf.failsOnly) {
      args.push('--fails-only');
    }
    if (conf.forceWildcardResource) {
      args.push('--force-wildcard-resource');
    }
    if (conf.host) {
      args.push('--host');
      args.push(conf.host);
    }
    if (conf.mode) {
      args.push('--mode');
      args.push(conf.mode);
    }
    if (conf.outputFile) {
      args.push('--output-file');
      args.push(conf.outputFile);
    }
    if (conf.profile) {
      args.push('--profile');
      args.push(conf.profile);
    }
    if (conf.setIni) {
      args.push('--set-ini');
    }
    if (conf.sortAlphabetical) {
      args.push('--sort-alphabetical');
    }
    return args;
  }

  private static modifyContext(context: IContext, conf: IConfig) {
    previousAwsCsmEnabled = context.conf.env.AWS_CSM_ENABLED;
    previousAwsCaBundle = context.conf.env.AWS_CA_BUNDLE;
    previousHttpProxy = context.conf.env.HTTP_PROXY;
    previousHttpsProxy = context.conf.env.HTTPS_PROXY;
    if (conf.mode === 'csm') {
      context.conf.env.AWS_CSM_ENABLED = 'true';
    } else if (conf.mode === 'proxy') {
      context.conf.env.AWS_CA_BUNDLE = '~/.iamlive/ca.pem';
      context.conf.env.HTTP_PROXY = 'http://127.0.0.1:10080';
      context.conf.env.HTTPS_PROXY = 'http://127.0.0.1:10080';
    }
  }

  private static async stop(): Promise<void> {
    if (is_running) {
      log.debug('stopping iamlive');
      iamliveSubprocess.kill();
    }
    is_running = false;
  }

  private static revertContext(context: IContext) {
    context.conf.env.AWS_CSM_ENABLED = previousAwsCsmEnabled;
    context.conf.env.AWS_CA_BUNDLE = previousAwsCaBundle;
    context.conf.env.HTTP_PROXY = previousHttpProxy;
    context.conf.env.HTTPS_PROXY = previousHttpsProxy;
  }
}
