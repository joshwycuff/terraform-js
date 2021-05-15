import path from 'path';

import { Hash } from '@joshwycuff/types';
import { IActionContext, ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';

import { log } from './logging';

/* eslint-disable no-param-reassign,@typescript-eslint/ban-ts-comment */

type IModuleFunction = (context: IActionContext) => Promise<void>;
type IModule = Hash<IModuleFunction>;
type IModules = Hash<IModule>;

export default class Modules implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    spec.modules = spec.modules || {};
    for (const [name, relativeModulePath] of Object.entries(spec.modules)) {
      log.debug(`Importing ${name} module from ${relativeModulePath}`);
      // @ts-ignore
      spec.modules[name] = await Modules.compileModule(spec.dirpath, relativeModulePath as string);
      // @ts-ignore
      log.debug(`Found ${name} module functions: ${Object.keys(spec.modules[name])}`);
    }
  }

  static async isPluginAction(context: IActionContext): Promise<boolean> {
    const moduleFunctionString = Modules.getModuleFunctionString(context);
    if (typeof moduleFunctionString === 'string') {
      return Modules.isStringAModuleFunctionInSpec(context.spec, moduleFunctionString);
    }
    return false;
  }

  static async runPluginAction(context: IActionContext): Promise<void> {
    log.debug(`Running module function "${Modules.getModuleFunctionString(context)}"`);
    const func = Modules.getModuleFunction(context);
    await func(context);
  }

  private static async compileModule(
    specPath: string,
    relativeModulePath: string,
  ): Promise<IModule> {
    const modulePath = path.join(specPath, relativeModulePath);
    return import(modulePath);
  }

  private static getModuleFunction(context: IActionContext): IModuleFunction {
    const moduleFunctionString = Modules.getModuleFunctionString(context) as string;
    const [m, f] = moduleFunctionString.split('.');
    return (
      (
        context.spec.modules as unknown as IModules
      )[m] as unknown as IModule
    )[f] as unknown as IModuleFunction;
  }

  private static getModuleFunctionString(context: IActionContext): undefined | string {
    const { action } = context;
    if (typeof action === 'string') {
      return action;
    }
    if (typeof action === 'object' && 'cmd' in action && typeof action.cmd === 'string') {
      return action.cmd;
    }
    return '';
  }

  private static isStringAModuleFunctionInSpec(spec: ISpec, str: string): boolean {
    if (str.split('.').length === 2) {
      const [m, f] = str.split('.');
      return Modules.specContainsModuleFunction(spec, m, f);
    }
    return false;
  }

  static specContainsModuleFunction(
    spec: ISpec,
    moduleName: string,
    functionName: string,
  ): boolean {
    if (Object.keys(spec.modules as Hash).includes(moduleName)) {
      return Object.keys((spec.modules as Hash<Hash>)[moduleName] as Hash).includes(functionName);
    }
    return false;
  }
}
