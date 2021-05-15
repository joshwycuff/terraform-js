import { ISpec } from './spec';
import {
  IActionContext,
  IContext,
  ISubprojectContext,
  ITargetContext,
} from './context';

export enum TerrascriptPluginApi {
  compile = 'compile',
  beforeAll = 'beforeAll',
  beforeSubproject = 'beforeSubproject',
  beforeTarget = 'beforeTarget',
  beforeAction = 'beforeAction',
  isPluginAction = 'isPluginAction',
  runPluginAction = 'runPluginAction',
  afterAction = 'afterAction',
  afterTarget = 'afterTarget',
  afterSubproject = 'afterSubproject',
  afterSuccess = 'afterSuccess',
  afterFailure = 'afterFailure',
}

export interface TerrascriptPlugin {
  compile?(spec: ISpec): Promise<void>;
  beforeAll?(context: IContext): Promise<void>;
  beforeSubproject?(context: ISubprojectContext): Promise<void>;
  beforeTarget?(context: ITargetContext): Promise<void>;
  beforeAction?(context: IActionContext): Promise<void>;
  isPluginAction?(context: IActionContext): Promise<boolean>;
  runPluginAction?(context: IActionContext): Promise<void>;
  afterAction?(context: IActionContext): Promise<void>;
  afterTarget?(context: ITargetContext): Promise<void>;
  afterSubproject?(context: ISubprojectContext): Promise<void>;
  afterSuccess?(context: IContext): Promise<void>;
  afterFailure?(context: IContext): Promise<void>;
}
