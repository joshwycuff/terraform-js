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

type IGroups = Hash<Array<string>>;

interface IHooks {
    setup?: Array<ICommand>;
    'pre-apply'?: Array<ICommand>;
    'pre-destroy'?: Array<ICommand>;
    teardown?: Array<ICommand>;
}

type IModules = Hash<any>;

type IScripts = Hash<Array<ICommand>>;

interface IWorkspace extends Hash<any> {
    config?: IConfig;
}

type IWorkspaces = Hash<IWorkspace>;

interface ISpecInternals {
    filepath: string;
    dirpath: string;
    getFullName: () => string;
}

export interface ISpec extends ISpecInternals, Hash<any> {
    name: string;
    subprojects: Hash;
    config: IConfig;
    groups: IGroups;
    hooks: IHooks;
    modules: IModules;
    scripts: IScripts;
    workspaces: IWorkspaces;
    definitions: Hash<any>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface _ISpec extends ISpecInternals, Hash<any> {
    name?: string;
    subprojects?: Hash;
    config?: IConfig;
    groups?: IGroups;
    hooks?: IHooks;
    modules?: IModules;
    scripts?: IScripts;
    workspaces?: IWorkspaces;
    definitions?: Hash<any>;
}
