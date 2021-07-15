import { merge, cloneDeep } from 'lodash';
import { Hash, JSONObject } from '@joshwycuff/types';
import { Command } from '@joshwycuff/command';
import { log } from '../logging/logging';
import { IActionContext, ITargetContext } from '../interfaces/context';
import { getPluginForAction, runPluginFunctions } from '../plugins';
import { _IActions, IAction, IActionCommand } from '../interfaces/spec';
import { shouldRunAction } from '../utils/action';
import { TerrascriptPluginApi } from '../interfaces/plugin';

export const detachedActions: Promise<any>[] = [];

/**
 * TODO
 */
export class ActionRunner {
  /**
   * TODO
   *
   * @param context
   * @param action
   * @param isHook
   * @param subaction
   */
  static async run(
    context: IActionContext,
  ) {
    // beforeAction hook
    if (!context.isHook && !context.isSubAction) {
      await ActionRunner._beforeAction(context);
    }
    if (Array.isArray(context.action)) {
      log.debug(`Running actions: ${JSON.stringify(context.action)}`);
      await ActionRunner._runActions(context);
    } else {
      log.debug(`Running action: ${JSON.stringify(context.action)}`);
      await ActionRunner._runAction(context);
    }
    // afterAction hook
    if (!context.isHook && !context.isSubAction) {
      await ActionRunner._afterAction(context);
    }
  }

  private static async _beforeAction(context: IActionContext) {
    await runPluginFunctions(context, TerrascriptPluginApi.beforeAction);
    if (shouldRunAction(context.spec.hooks.beforeAction)) {
      log.debug(`Running "${context.spec.name}" "${context.target.name}" beforeAction hook`);
      await ActionRunner.run({
        ...context,
        action: context.spec.hooks.beforeAction,
        isHook: true,
      });
    }
  }

  private static async _runActions(
    context: IActionContext,
  ) {
    const actions = context.action as _IActions;
    for (const action of actions) {
      await ActionRunner.run({
        ...context,
        action,
        isSubAction: true,
      });
    }
  }

  private static async _runAction(
    context: IActionContext,
  ) {
    const actionPlugin = await getPluginForAction(context);
    if (actionPlugin !== null) {
      await actionPlugin?.runPluginAction?.(context);
    } else if (typeof context.action === 'string') {
      if (context.action in context.spec.actions) {
        await ActionRunner.run({
          ...context,
          action: context.spec.actions[context.action],
        });
      } else {
        await ActionRunner._runCommand(context);
      }
    } else if ((context.action as JSONObject).cmd as string in context.spec.actions) {
      await ActionRunner.run({
        ...context,
        action: context.spec.actions[(context.action as JSONObject).cmd as string],
      });
    } else {
      await ActionRunner._runCommand(context);
    }
  }

  // eslint-disable-next-line consistent-return,require-jsdoc
  private static async _runCommand(
    context: IActionContext,
    detached = false,
  ): Promise<any> {
    const env: Hash = {};
    merge(
      env,
      cloneDeep(process.env),
      cloneDeep(context.conf.env),
      cloneDeep(context.spec.config.env),
    );
    let command: Command;
    if (typeof context.action === 'string') {
      command = Command.fromString(context.action, { env });
    } else {
      const action = context.action as unknown as IActionCommand;
      if ('detached' in action) {
        return ActionRunner._runCommand({
          ...context,
          action: action.detached as IAction,
        }, true);
      }
      if (!('cmd' in action)) {
        throw new TypeError('Action missing required cmd field');
      }
      const { cmd, args } = action;
      command = new Command(cmd, args || [], { env });
    }
    if (detached) {
      detachedActions.push(command.detach());
    } else {
      return command.run();
    }
  }

  private static async _afterAction(context: IActionContext) {
    await runPluginFunctions(context, TerrascriptPluginApi.afterAction);
    if (shouldRunAction(context.spec.hooks.afterAction)) {
      log.debug(`Running "${context.spec.name}" "${context.target.name}" afterAction hook`);
      await ActionRunner.run({
        ...context,
        action: context.spec.hooks.afterAction,
        isHook: true,
      });
    }
  }

  private static async _getAction(context: ITargetContext): Promise<IAction> {
    if (context.cmd in context.spec.actions) {
      return context.spec.actions[context.cmd];
    }
    return {
      cmd: context.cmd,
      args: context.args,
    };
  }
}
