import { IContext, ISubprojectContext, ITargetContext } from '../interfaces/context';
import { TargetPath } from './target-path';
import { log } from '../logging/logging';

import { ActionRunner } from './action';
import { withTargetPath, withSpecs, withTarget } from './context';
import { TargetRunner } from './target';
import { IConfig } from '../interfaces/config';
import { ITarget } from '../interfaces/spec';
import { shouldRunAction } from '../utils/action';
import { runPluginFunctions } from '../plugins';
import { TerrascriptPluginApi } from '../interfaces/plugin';

export class SpecRunner {
  static async run(context: IContext) {
    if (SpecRunner.shouldRun(context)) {
      await SpecRunner._beforeSubproject(context);
    }
    if (SpecRunner.shouldRunSubprojects(context)) {
      await withTargetPath<ISubprojectContext>(TargetPath.next(context.targetPath),
        async (cntxt) => {
          await SpecRunner.runSubprojects(cntxt);
        });
    }
    if (SpecRunner.shouldRun(context)) {
      await SpecRunner._runSubproject(context);
      await SpecRunner._afterSubproject(context);
    }
  }

  static shouldRunSubprojects(context: IContext): boolean {
    const { targetPath } = context;
    const { name, subprojects } = context.spec;
    if (Object.keys(subprojects).length === 0) {
      return false;
    }
    if (targetPath.length > 1) {
      return TargetPath.isMatch(targetPath, name);
    }
    return true;
  }

  static shouldRun(context: IContext): boolean {
    const { targetPath } = context;
    const { name } = context.spec;
    if (targetPath.length > 2) {
      return false;
    }
    if (targetPath.length === 2) {
      return TargetPath.isMatch(targetPath, name);
    }
    return true;
  }

  static async runSubprojects(context: IContext): Promise<void> {
    log.debug(`Running "${context.spec.name}" subprojects`);
    for (const subprojectName of Object.keys(context.spec.subprojects)) {
      const subprojectSpec = context.spec.subprojects[subprojectName];
      await withSpecs<ISubprojectContext>([subprojectSpec], async (subprojectContext) => {
        await SpecRunner.run(subprojectContext);
      });
    }
  }

  static async _beforeSubproject(context: ISubprojectContext) {
    await runPluginFunctions<ISubprojectContext>(context, TerrascriptPluginApi.beforeSubproject);
    if (shouldRunAction(context.spec.hooks.beforeSubproject)) {
      log.debug(`Running ${context.spec.name} beforeSubproject hook`);
      await ActionRunner.run({
        ...context,
        target: SpecRunner.getSubprojectTarget(context),
        action: context.spec.hooks.beforeSubproject,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  static async _runSubproject(context: ISubprojectContext) {
    await withTargetPath<ISubprojectContext>(TargetPath.next(context.targetPath), async (cntxt) => {
      await SpecRunner.runTargets(cntxt);
    });
  }

  static async _afterSubproject(context: ISubprojectContext) {
    await runPluginFunctions<ISubprojectContext>(context, TerrascriptPluginApi.afterSubproject);
    if (shouldRunAction(context.spec.hooks.afterSubproject)) {
      log.debug(`Running ${context.spec.name} afterSubproject hook`);
      await ActionRunner.run({
        ...context,
        target: SpecRunner.getSubprojectTarget(context),
        action: context.spec.hooks.afterSubproject,
        isHook: true,
        isSubAction: false,
      });
    }
  }

  static async runTargets(context: IContext): Promise<void> {
    log.debug(`Running "${context.spec.name}" targets`);
    if (TargetPath.isNullTarget(context.targetPath)) {
      await withTarget<ITargetContext>({ name: TargetPath.NULL_TARGET } as unknown as ITarget,
        async (targetContext) => {
          await TargetRunner.run(targetContext);
        });
    } else {
      for (const targetName of Object.keys(context.spec.targets)) {
        await withTarget<ITargetContext>(context.spec.targets[targetName],
          async (targetContext) => {
            await TargetRunner.run(targetContext);
          });
      }
    }
  }

  static getSubprojectTarget(context: ISubprojectContext): ITarget {
    return {
      name: context.spec.name,
      config: {} as IConfig,
    };
  }
}
