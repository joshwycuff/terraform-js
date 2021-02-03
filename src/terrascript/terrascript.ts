/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */
import yaml from 'js-yaml';
import fs from 'fs';
import { cloneDeep } from 'lodash';
import path from 'path';
import { log } from '../logging/logging';
import { _ISpec, ISpec } from '../interfaces/spec';
import { ORIGINAL_WORKING_DIRECTORY, TERRASCRIPT_YML } from '../constants';
import { config } from '../config/config';
import { Hash } from '../interfaces/types';
import { IConfig } from '../interfaces/config';

/**
 * @param spec
 * @param workspace
 */
function getWorkspaceFullName(spec: ISpec, workspace: string) {
    return `${spec.config?.workspacePrefix || ''}${workspace}${spec.config?.workspaceSuffix || ''}`;
}

/**
 * @param filepath
 */
async function getScriptSpec(filepath: string): Promise<_ISpec> {
    return yaml.load(fs.readFileSync(filepath, 'utf-8')) as ISpec;
}

/**
 * @param spec
 * @param str
 */
async function compileString(spec: ISpec, str: string) {
    if (str.slice(0, 1) === '$') {
        if (!!spec.definitions && str in spec.definitions) {
            return spec.definitions[str];
        }
        throw new Error(`${str} not found in definitions.`);
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
        for (const key of Object.keys(clone)) {
            clone[key] = await compile(spec, clone[key], section);
        }
        return clone;
    }
    return clone;
}

/**
 * @param spec
 */
async function checkSubprojects(spec: ISpec) {
    if (spec.subprojects) {
        for (const subprojectName of Object.keys(spec.subprojects)) {
            const subprojectPath = spec.subprojects[subprojectName];
            const yml = path.join(subprojectPath, TERRASCRIPT_YML);
            if (await fs.existsSync(yml)) {
                log.debug(`Subproject yaml found: ${yml}`);
            } else {
                throw new Error(`Subproject yaml not found: ${yml}`);
            }
        }
    }
}

/**
 * @param spec
 * @param uncompiledSpec
 * @param filepath
 */
export async function compileScriptSpec(filepath: string = TERRASCRIPT_YML): Promise<ISpec> {
    const fullFilepath = path.resolve(filepath);
    const uncompiledSpec = await getScriptSpec(fullFilepath);
    log.info(`Compiling terrascript spec: ${fullFilepath}`);
    if (uncompiledSpec.name === undefined) {
        uncompiledSpec.name = path.basename(path.dirname(fullFilepath));
    }
    if (uncompiledSpec.subprojects === undefined) {
        uncompiledSpec.subprojects = {};
    }
    if (uncompiledSpec.config === undefined) {
        uncompiledSpec.config = {};
    }
    if (uncompiledSpec.groups === undefined) {
        uncompiledSpec.groups = {};
    }
    if (uncompiledSpec.hooks === undefined) {
        uncompiledSpec.hooks = {};
    }
    if (uncompiledSpec.modules === undefined) {
        uncompiledSpec.modules = {};
    }
    if (uncompiledSpec.scripts === undefined) {
        uncompiledSpec.scripts = {};
    }
    if (uncompiledSpec.workspaces === undefined) {
        uncompiledSpec.workspaces = {};
    }
    if (uncompiledSpec.definitions === undefined) {
        uncompiledSpec.definitions = [];
    }
    log.info(`Terrascript spec name: ${uncompiledSpec.name}`);
    log.silly(`uncompiled script spec ${JSON.stringify(uncompiledSpec, null, 2)}`);
    const spec = cloneDeep(uncompiledSpec) as ISpec;
    for (const section of Object.keys(spec)) {
        spec[section] = await compile(spec, spec[section], section);
    }
    for (const workspace of Object.keys(spec.workspaces)) {
        if (spec.workspaces[workspace] === null) {
            spec.workspaces[workspace] = {};
        }
        spec.workspaces[workspace].fullName = getWorkspaceFullName(spec, workspace);
        spec.workspaces[workspace].useTmpDir = config.tmpDirectory !== '';
    }
    await checkSubprojects(spec);
    log.silly(`compiled script spec ${JSON.stringify(spec, null, 2)}`);
    return spec;
}
