import { Hash, JSONObject } from '@joshwycuff/types';
import { IConfig } from './config';

// eslint-disable-next-line @typescript-eslint/naming-convention
type _IAction = string | JSONObject;
// eslint-disable-next-line @typescript-eslint/naming-convention
export type _IActions = _IAction[];
export type IAction = _IAction | _IActions;

export interface IActionCommand {
  cmd: string,
  args?: string[],
  env?: Hash<string>,
  detached?: JSONObject,
}

export type IActions = Hash<IAction>;

export interface IHooks extends JSONObject {
  beforeAll: _IAction[];
  beforeSubproject: _IAction[];
  beforeTarget: _IAction[];
  beforeAction: _IAction[];
  afterAction: _IAction[];
  afterTarget: _IAction[];
  afterSubproject: _IAction[];
  afterSuccess: _IAction[];
  afterFailure: _IAction[];
}

type IPluginName = string;

type IPlugins = IPluginName[];

interface ITargetInternals extends JSONObject {
  name: string;
}

export interface ITarget extends ITargetInternals {
  config: IConfig;
}

type ITargets = Hash<ITarget>;

interface ISpecInternals {
  parent: ISpec | null;
  filepath: string;
  dirpath: string;
}

export interface ISpec extends ISpecInternals, JSONObject {
  name: string;
  subprojects: Hash<ISpec>;
  plugins: IPlugins;
  config: IConfig;
  hooks: IHooks;
  targets: ITargets;
  actions: IActions;
}
