import { IContext, ISubprojectContext } from '../interfaces/context';
import { ActionRunner } from './action';
import { TargetPath } from './target-path';
import { SpecRunner } from './spec';
import { log } from '../logging/logging';
import { ITarget } from '../interfaces/spec';
import { shouldRunAction } from '../utils/action';
import { runPluginFunctions } from '../plugins';
import { TerrascriptPluginApi } from '../interfaces/plugin';

export class TerrascriptRunner {
  static async run(context: IContext): Promise<void> {
    await TerrascriptRunner._beforeAll(context);
    try {
      await SpecRunner.run(context);
      await TerrascriptRunner._afterSuccess(context);
    } catch (error) {
      log.error(error);
      log.error(error.stack);
      await TerrascriptRunner._afterFailure(context);
    }
  }

  private static async _beforeAll(context: IContext) {
    await runPluginFunctions<ISubprojectContext>(context, TerrascriptPluginApi.beforeAll);
    if (shouldRunAction(context.spec.hooks.beforeAll)) {
      log.debug('Running beforeAll hook');
      await ActionRunner.run({
        ...context,
        target: TerrascriptRunner._getTerrascriptTarget(context),
        action: context.spec.hooks.beforeAll,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  private static async _afterSuccess(context: IContext) {
    await runPluginFunctions<ISubprojectContext>(context, TerrascriptPluginApi.afterSuccess);
    if (shouldRunAction(context.spec.hooks.afterSuccess)) {
      log.debug('Running afterSuccess hook');
      await ActionRunner.run({
        ...context,
        target: TerrascriptRunner._getTerrascriptTarget(context),
        action: context.spec.hooks.afterSuccess,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  private static async _afterFailure(context: IContext) {
    await runPluginFunctions<ISubprojectContext>(context, TerrascriptPluginApi.afterFailure);
    if (shouldRunAction(context.spec.hooks.afterFailure)) {
      log.debug('Running afterFailure hook');
      await ActionRunner.run({
        ...context,
        target: TerrascriptRunner._getTerrascriptTarget(context),
        action: context.spec.hooks.afterFailure,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  static _getTerrascriptTarget(context: IContext): ITarget {
    return {
      name: 'Terrascript',
      config: context.conf,
    };
  }
}
