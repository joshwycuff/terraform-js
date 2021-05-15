import { JSONObject } from '@joshwycuff/types';
import { IConfig } from './config';
import { IAction, ISpec, ITarget } from './spec';

export type IRootContext = JSONObject;

export interface IContext extends IRootContext {
  targetPath: string[];
  conf: IConfig;
  spec: ISpec;
  cmd: string;
  args: string[];
}

export type ISubprojectContext = IContext;

export interface ITargetContext extends ISubprojectContext {
  target: ITarget;
}

export interface IActionContext extends ITargetContext {
  action: IAction;
  isHook: boolean;
  isSubAction: boolean
}

export type IPluginContext = IActionContext;
