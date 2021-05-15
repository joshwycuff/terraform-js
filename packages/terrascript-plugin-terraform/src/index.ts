import {
  IAction,
  IActionContext,
  ISpec,
  TerrascriptPlugin,
  ActionRunner,
} from '@joshwycuff/terrascript-core';
import { Terraform, IConfigOptions } from '@joshwycuff/terraform';

import { config, IConfig } from './config';
import { log } from './logging';

/* eslint-disable no-param-reassign */

interface ITerraformPluginConfig {
  shorthandTerraformCommand?: string,
  shorthandTerraformSubcommands?: boolean,
  workspace?: string,
}

export default class TerraformPlugin implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    spec.terraform = spec.terraform || {};
    const tfConfig = spec.terraform as ITerraformPluginConfig;
    if (tfConfig.workspace) {
      spec.config.env.TF_WORKSPACE = tfConfig.workspace;
    }
  }

  private static async beforeAction(context: IActionContext): Promise<void> {
    await config.push(context.spec.terraform as IConfig);
    if (TerraformPlugin.isTerraformAction(context.action)) {
      await TerraformPlugin.terraformHook(context);
      await TerraformPlugin.terraformSubcommandHook(context);
    }
    await config.pop();
  }

  private static async afterAction(context: IActionContext): Promise<void> {
    await config.push(context.spec.terraform as IConfig);
    if (TerraformPlugin.isTerraformAction(context.action)) {
      await TerraformPlugin.terraformHook(context, true);
      await TerraformPlugin.terraformSubcommandHook(context, true);
    }
    await config.pop();
  }

  private static async terraformHook(
    context: IActionContext, after = false,
  ): Promise<void> {
    const hookName = TerraformPlugin.getTerraformHookName(after);
    const hook = context.spec.hooks[hookName];
    if (hook) {
      log.debug(`Running Terraform hook: ${hookName}`);
      await ActionRunner.run({
        ...context,
        isHook: true,
        isSubAction: true,
        action: hook as IAction,
      });
    }
  }

  private static async terraformSubcommandHook(
    context: IActionContext, after = false,
  ): Promise<void> {
    const hookName = TerraformPlugin.getTerraformSubcommandHookName(context.action, after);
    const hook = context.spec.hooks[hookName];
    if (hook) {
      log.debug(`Running Terraform hook: ${hookName}`);
      await ActionRunner.run({
        ...context,
        isHook: true,
        isSubAction: true,
        action: hook as IAction,
      });
    }
  }

  static async isPluginAction(context: IActionContext): Promise<boolean> {
    await config.push(context.spec.terraform as IConfig);
    const result = TerraformPlugin.isTerraformAction(context.action);
    await config.pop();
    return result;
  }

  static async runPluginAction(context: IActionContext): Promise<void> {
    await config.push(context.spec.terraform as IConfig);
    const actionArgsWithTf = TerraformPlugin.formatActionArgs(context.action);
    const actionArgs = ['terraform', config.peek().shorthandTerraformCommand].includes(actionArgsWithTf[0])
      ? actionArgsWithTf.slice(1) : actionArgsWithTf;
    const [subcommand, ...args] = actionArgs;
    const conf = {
      cwd: context.spec.dirpath,
      env: context.spec.config.env,
      ...context.spec.terraform as IConfigOptions,
    };
    const tf = new Terraform(conf);
    await tf.subcommand(subcommand, args);
    await config.pop();
  }

  private static isTerraformAction(action: IAction): boolean {
    if (Array.isArray(action)) {
      return false;
    }
    const actionArgs = TerraformPlugin.formatActionArgs(action);
    return actionArgs[0] === 'terraform'
      || actionArgs[0] === config.peek().shorthandTerraformCommand
      || (
        config.peek().shorthandTerraformSubcommands
        && Terraform.isSubcommand(actionArgs[0])
      );
  }

  private static formatActionArgs(action: IAction): string[] {
    if (typeof action === 'string') {
      return action.split(' ');
    }
    if (Array.isArray(action)) {
      throw new TypeError('Arrays not accepted');
    }
    if (typeof action.args === 'string') {
      return [action.cmd as string].concat(action.args.split(' '));
    }
    return [action.cmd as string].concat(action.args as string[]);
  }

  private static getTerraformHookName(after = false): string {
    const first = after ? 'after' : 'before';
    const second = 'Terraform';
    return `${first}${second}`;
  }

  private static getTerraformSubcommandHookName(action: IAction, after = false): string {
    const first = after ? 'after' : 'before';
    const second = 'Terraform';
    const _third = TerraformPlugin.getTerraformSubcommand(action);
    const third = `${_third[0].toUpperCase()}${_third.slice(1)}`;
    return `${first}${second}${third}`;
  }

  private static getTerraformSubcommand(action: IAction): string {
    const args = TerraformPlugin.formatActionArgs(action);
    if (args[0] === 'terraform' || args[0] === config.peek().shorthandTerraformCommand) {
      return args[1];
    }
    return args[0];
  }
}
