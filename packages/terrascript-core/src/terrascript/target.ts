import { IActionContext, ITargetContext } from '../interfaces/context';
import { ActionRunner } from './action';
import { TargetPath } from './target-path';
import { IAction } from '../interfaces/spec';
import { log } from '../logging/logging';
import { shouldRunAction } from '../utils/action';
import { runPluginFunctions } from '../plugins';
import { TerrascriptPluginApi } from '../interfaces/plugin';
import { withContexts } from './context';

export class TargetRunner {
  static async run(context: ITargetContext) {
    if (await TargetRunner.shouldRun(context)) {
      await TargetRunner._beforeTarget(context);
      await TargetRunner._runTarget(context);
      await TargetRunner._afterTarget(context);
    }
  }

  static async shouldRun(context: ITargetContext): Promise<boolean> {
    return TargetPath.isMatch(context.targetPath, context.target.name);
  }

  private static async _beforeTarget(context: ITargetContext) {
    await runPluginFunctions(context, TerrascriptPluginApi.beforeTarget);
    if (shouldRunAction(context.spec.hooks.beforeTarget)) {
      log.debug(`Running "${context.spec.name}" "${context.target.name}" beforeTarget hook`);
      await ActionRunner.run({
        ...context,
        action: context.spec.hooks.beforeTarget,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  private static async _runTarget(context: ITargetContext) {
    log.debug(`Running "${context.spec.name}" target "${context.target.name}"`);
    const action = await TargetRunner._getAction(context);
    await withContexts<IActionContext>([{
      action,
      isHook: false,
      isSubAction: false,
    } as IActionContext], async (actionContext) => {
      await ActionRunner.run(actionContext);
    });
  }

  private static async _afterTarget(context: ITargetContext) {
    await runPluginFunctions(context, TerrascriptPluginApi.afterTarget);
    if (shouldRunAction(context.spec.hooks.afterTarget)) {
      log.debug(`Running "${context.spec.name}" "${context.target.name}" afterTarget hook`);
      await ActionRunner.run({
        ...context,
        action: context.spec.hooks.afterTarget,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  private static async _getAction(context: ITargetContext): Promise<IAction> {
    return {
      cmd: context.cmd,
      args: context.args,
    };
  }
}
