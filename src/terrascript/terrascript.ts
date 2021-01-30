import yaml from 'js-yaml';
import fs from 'fs';
import { cloneDeep } from 'lodash';
import path from 'path';
import { Hash } from '../interfaces/types';
import { log } from '../logging/logging';
import { ISpec } from '../interfaces/spec';
import { ORIGINAL_WORKING_DIRECTORY } from '../constants';
import { config } from '../config/config';

/**
 * @param spec
 * @param workspace
 */
function getWorkspaceFullName(spec: ISpec, workspace: string) {
    return `${spec.config?.workspacePrefix || ''}${workspace}${spec.config?.workspaceSuffix || ''}`;
}

/**
 * @param spec
 * @param workspace
 */
function getWorkspaceDirectory(spec: ISpec, workspace: string) {
    const owd = ORIGINAL_WORKING_DIRECTORY;
    const wd = config.workingDirectory;
    const fullWorkspaceName = getWorkspaceFullName(spec, workspace);
    if (path.isAbsolute(wd)) {
        return path.join(wd, fullWorkspaceName);
    }
    return path.join(owd, wd, fullWorkspaceName);
}

/**
 * @param filepath
 */
export async function getScriptSpec(filepath: string): Promise<ISpec> {
    return yaml.load(fs.readFileSync(filepath, 'utf-8')) as ISpec;
}

/**
 * @param spec
 * @param str
 */
async function compileString(spec: ISpec, str: string) {
    if (str.slice(0, 1) === '$') {
        return spec[str];
    }
    return str;
}

/**
 * @param spec
 * @param modulePath
 */
async function compileModule(modulePath: string) {
    const cwd = process.cwd();
    // eslint-disable-next-line global-require
    return require(path.join(cwd, modulePath));
}

/**
 * @param spec
 * @param subspec
 * @param section
 */
async function compile(spec: ISpec, subspec: any, section: string): Promise<any> {
    const clone = cloneDeep(subspec);
    if (typeof clone === 'string') {
        if (section === 'modules') {
            return compileModule(clone as string);
        }
        return compileString(spec, clone);
    }
    if (Array.isArray(clone)) {
        return Promise.all(clone.map((x) => compile(spec, x, section)));
    }
    if (typeof clone === 'object' && clone !== null) {
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(clone)) {
            // eslint-disable-next-line no-await-in-loop
            clone[key] = await compile(spec, clone[key], section);
        }
        return clone;
    }
    return clone;
}

/**
 * @param spec
 * @param uncompiledSpec
 */
export async function compileScriptSpec(uncompiledSpec: ISpec): Promise<ISpec> {
    log.silly(`uncompiled script spec ${JSON.stringify(uncompiledSpec, null, 2)}`);
    const spec = cloneDeep(uncompiledSpec);
    // eslint-disable-next-line no-restricted-syntax
    for (const section of Object.keys(spec)) {
        // eslint-disable-next-line no-await-in-loop
        spec[section] = await compile(spec, spec[section], section);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const workspace of Object.keys(spec.workspaces)) {
        if (spec.workspaces[workspace] === null) {
            spec.workspaces[workspace] = {};
        }
        spec.workspaces[workspace].fullName = getWorkspaceFullName(spec, workspace);
        spec.workspaces[workspace].workingDirectory = getWorkspaceDirectory(spec, workspace);
    }
    log.silly(`compiled script spec ${JSON.stringify(spec, null, 2)}`);
    return spec;
}
