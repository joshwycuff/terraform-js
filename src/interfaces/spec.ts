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

interface IWorkspaces extends Hash<any> {
    config: IConfig;
}

export interface ISpec extends Hash<any> {
    config?: IConfig;
    groups?: IGroups;
    hooks?: IHooks;
    modules?: IModules;
    scripts: IScripts;
    workspaces: IWorkspaces;
    definitions?: Hash<any>;
}
