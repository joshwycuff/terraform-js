import { Hash } from './types';
import { IConfig } from './config';

type IGroups = Hash<Array<string>>;

interface IHooks {
    setup?: Array<string | Hash>;
    'pre-apply'?: Array<string | Hash>;
    teardown?: Array<string | Hash>;
}

type IModules = Hash<any>;

type IScripts = Hash<Array<any>>;

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
}
