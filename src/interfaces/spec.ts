import { Hash } from './types';
import { IConfig } from './config';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface _IFunction {
    cwd?: string;
    function: string;
    condition?: ICommand;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface _ICommand {
    cwd?: string;
    command: string;
    args?: string | string[];
    condition?: ICommand;
}

export type ICommand = string | _ICommand | _IFunction;

type ITargetGroups = Hash<Array<string>>;

interface IHooks {
    setup?: Array<ICommand>;
    'pre-apply'?: Array<ICommand>;
    'pre-destroy'?: Array<ICommand>;
    teardown?: Array<ICommand>;
}

type IModules = Hash<any>;

type IScripts = Hash<Array<ICommand>>;

export interface ITarget extends Hash<any> {
    config?: IConfig;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface _ITarget extends Hash<any> {
    config: IConfig;
}

type ITargets = Hash<ITarget>;

// eslint-disable-next-line @typescript-eslint/naming-convention
type _ITargets = Hash<_ITarget>;

interface ISpecInternals {
    filepath: string;
    dirpath: string;
}

export interface ISpec extends ISpecInternals, Hash<any> {
    name: string;
    subprojects: Hash;
    config: IConfig;
    groups: ITargetGroups;
    hooks: IHooks;
    modules: IModules;
    scripts: IScripts;
    targets: ITargets;
    definitions: Hash<any>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface _ISpec extends ISpecInternals, Hash<any> {
    name?: string;
    subprojects?: Hash;
    config?: IConfig;
    groups?: ITargetGroups;
    hooks?: IHooks;
    modules?: IModules;
    scripts?: IScripts;
    targets?: _ITargets;
    definitions?: Hash<any>;
}
