// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { merge } from 'lodash';
import fs from 'fs';
import { copySync } from 'fs-extra';
import path from 'path';
import glob from 'glob';
import {
    DOT_GIT,
    NODE_MODULES,
    ORIGINAL_WORKING_DIRECTORY,
    SUBPROJECT_HIERARCHICAL_DELIMITER,
} from '../constants'; // just making sure constants get evaluated first
import { compileScriptSpec } from './terrascript';
import { config, pushConfig, popConfig, updateConfig } from '../config/config';
import { runCommands, runScript } from './runner';
import { run as runCommand } from '../command/command';
import { ISpec } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { ExitCode, Hash } from '../interfaces/types';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';

/**
 * @param spec
 * @param groupOrWorkspaceName
 * @param groupPath
 */
function getWorkspaces(spec: ISpec, groupPath: string) {
    const groupName = groupPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER).slice(-1)[0];
    const { groups } = spec;
    const workspaces = Object.keys(spec.workspaces);
    if (groupName === 'all') {
        return workspaces;
    }
    if (groups && groupName in groups) {
        return groups[groupName];
    }
    if (workspaces.includes(groupName)) {
        return [groupName];
    }
    const msg = `Group or workspace not found: ${groupName}`;
    if (config.onWorkspaceNotFound === 'error') {
        throw new Error(msg);
    }
    log.log(config.onWorkspaceNotFound, msg);
    return [];
}

/**
 * @param spec
 * @param workspace
 */
function getWorkspaceDirectory(spec: ISpec, workspace: string) {
    const owd = ORIGINAL_WORKING_DIRECTORY;
    const tmp = config.tmpDirectory;
    const workspaceFullName = spec.workspaces[workspace].fullName;
    if (tmp !== '') {
        if (path.isAbsolute(tmp)) {
            return path.join(tmp, workspaceFullName);
        }
        return path.join(owd, tmp, workspaceFullName);
    }
    const id = config.infrastructureDirectory;
    if (path.isAbsolute(id)) {
        return id;
    }
    return path.join(owd, id);
}

/**
 * @param spec
 * @param workspaceName
 */
export async function initWorkspace(spec: ISpec, workspaceName: string) {
    const workspace = spec.workspaces[workspaceName];
    await fs.mkdirSync(workspace.workingDirectory, { recursive: true });
    await copySync(config.infrastructureDirectory, workspace.workingDirectory);
}

/**
 *
 */
async function addNodeModulesBinsToPath() {
    let processEnvPath = process?.env?.PATH?.split(':') || [];
    let dir = process.cwd();
    while (dir !== '/') {
        const filesAndFolders = await fs.readdirSync(dir);
        if (filesAndFolders.includes(NODE_MODULES)) {
            break;
        }
        if (filesAndFolders.includes(DOT_GIT)) {
            break;
        }
        dir = path.dirname(dir);
    }
    return new Promise((resolve, reject) => {
        try {
            glob(path.join(dir, NODE_MODULES, '.bin'), {}, (error, files) => {
                if (error) {
                    reject(error);
                }
                processEnvPath = files.map((f) => path.resolve(f)).concat(processEnvPath);
                const pathWithBins = processEnvPath.join(':');
                pushConfig({ env: { PATH: pathWithBins } });
                resolve(null);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * @param spec
 * @param scriptOrCommand
 */
function isScript(spec: ISpec, scriptOrCommand: string): boolean {
    return !!spec.scripts && scriptOrCommand in spec.scripts;
}

/**
 * @param spec
 * @param groupOrWorkspace
 */
function getSubprojects(spec: ISpec, groupOrWorkspace: string): string[] {
    const parts = groupOrWorkspace.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
    if (parts[0] === '') {
        return [];
    }
    if (spec.subprojects) {
        if (parts.length === 1) {
            // all subprojects
            return Object.keys(spec.subprojects);
        }
        const regex = new RegExp(parts[0]);
        const subprojects = Object.keys(spec.subprojects);
        const matchingSubprojects = subprojects.filter((name) => regex.test(name));
        if (matchingSubprojects.length > 0) {
            return matchingSubprojects;
        }
    }
    if (parts.length > 1) {
        const msg = `No matching subprojects found in spec: ${parts[0]}`;
        if (config.onSubprojectNotFound === 'error') {
            throw new Error(msg);
        }
        log.log(config.onSubprojectNotFound, msg);
    }
    // no subprojects
    return [];
}

/**
 * @param spec
 * @param groupOrWorkspace
 * @param scriptOrCommand
 * @param commandArgs
 */
async function runSubprojects(
    spec: ISpec,
    groupOrWorkspace: string,
    scriptOrCommand: string,
    commandArgs?: Array<string>,
) {
    if (!spec.subprojects) {
        throw new Error('No subprojects in spec.');
    }
    const delim = SUBPROJECT_HIERARCHICAL_DELIMITER;
    const subprojects = getSubprojects(spec, groupOrWorkspace);
    log.debug(`Running subprojects: ${JSON.stringify(subprojects)}`);
    for (const subproject of subprojects) {
        const parts = groupOrWorkspace.split(delim);
        const newGroupOrWorkspace = parts.length > 1 ? parts.slice(1).join(delim) : parts[0];
        const command = 'terrascript';
        const args = [newGroupOrWorkspace, scriptOrCommand].concat(commandArgs || []);
        await runCommand(command, args, {
            cwd: spec.subprojects && spec.subprojects[subproject],
            env: process.env as Hash,
        });
    }
}

/**
 * @param spec
 */
function hasSubprojects(spec: ISpec): boolean {
    return !!spec.subprojects && Object.keys(spec.subprojects).length > 0;
}

/**
 * @param spec
 * @param groupOrWorkspace
 */
function isRunSubprojects(spec: ISpec, groupOrWorkspace: string): boolean {
    const parts = groupOrWorkspace.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
    if (parts.length > 1) {
        return parts[0] !== '';
    }
    return hasSubprojects(spec);
}

/**
 * @param groupOrWorkspace
 */
function isRunSubprojectsOnly(groupOrWorkspace: string): boolean {
    const parts = groupOrWorkspace.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
    return parts.length > 1 && parts[0] !== '';
}

/**
 * @param groupOrWorkspace
 * @param scriptOrCommand
 * @param commandArgs
 */
export async function run(
    groupOrWorkspace: string,
    scriptOrCommand: string,
    commandArgs?: Array<string>,
) {
    await addNodeModulesBinsToPath();
    const spec = await compileScriptSpec();
    pushConfig(spec.config || {});
    if (isRunSubprojects(spec, groupOrWorkspace)) {
        await runSubprojects(spec, groupOrWorkspace, scriptOrCommand, commandArgs);
    }
    if (isRunSubprojectsOnly(groupOrWorkspace)) {
        return;
    }
    if (config.gitCommitIdEnvVar) {
        updateConfig({ env: { [config.gitCommitIdEnvVar]: await getCommitId() } });
    }
    const context: IContext = {
        config,
        spec,
    };
    // setup hook
    if (context.spec.hooks && context.spec.hooks.setup) {
        log.info('Running setup hook');
        await runCommands(undefined, context, context.spec.hooks.setup);
    }
    for (const workspace of getWorkspaces(spec, groupOrWorkspace)) {
        pushConfig(spec.workspaces[workspace]?.config || {});
        updateConfig({ env: { TF_WORKSPACE: spec.workspaces[workspace].fullName } });
        spec.workspaces[workspace].workingDirectory = getWorkspaceDirectory(spec, workspace);
        if (spec.workspaces[workspace].useTmpDir) {
            await initWorkspace(spec, workspace);
        }
        if (scriptOrCommand === '--config') {
            console.log(config);
        } else if (isScript(spec, scriptOrCommand)) {
            await runScript(spec, scriptOrCommand, workspace);
        } else if (Terraform.isSubcommand(scriptOrCommand)) {
            const tf = new Terraform({
                cwd: spec.workspaces[workspace].workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
            await tf.subcommand(scriptOrCommand, commandArgs);
        } else {
            await runCommand(scriptOrCommand, commandArgs || [], {
                cwd: spec.workspaces[workspace].workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
        }
        popConfig();
    }
    // teardown hook
    if (context.spec.hooks && context.spec.hooks.teardown) {
        log.info('Running teardown hook');
        await runCommands(undefined, context, context.spec.hooks.teardown);
    }
}
