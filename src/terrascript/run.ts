// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { merge } from 'lodash';
import fs from 'fs';
import { copySync } from 'fs-extra';
import path from 'path';
import { isMatch } from 'micromatch';
import {
    NODE_MODULES,
    ORIGINAL_WORKING_DIRECTORY,
    SUBPROJECT_HIERARCHICAL_DELIMITER,
} from '../constants'; // just making sure constants get evaluated first
import { config, updateConfig } from '../config/config';
import { runCommands, runScript } from './runner';
import { run as runCommand } from '../command/command';
import { ISpec } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { Hash } from '../interfaces/types';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';
import { searchUp } from '../utils/search-up';
import { withConfig } from '../utils/with-config';
import { SPEC } from '../spec/specs';
import { curryWith, withContexts } from '../utils/withs';
import { inDir } from '../utils/in-dir';
import { withSpec } from '../utils/with-spec';

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
async function getConfigWithNodeModulesBinInPath() {
    const processEnvPath = process?.env?.PATH?.split(':') || [];
    const nodeModulesPath = await searchUp(NODE_MODULES);
    if (nodeModulesPath) {
        const nodeModulesBinPath = path.join(nodeModulesPath, '.bin');
        const pathWithBins = [nodeModulesBinPath].concat(processEnvPath).join(':');
        const nodeConfig = { env: { PATH: pathWithBins } };
        return nodeConfig;
    }
    return {};
}

/**
 * @param spec
 * @param scriptOrCommand
 */
function isScript(spec: ISpec, scriptOrCommand: string): boolean {
    return !!spec.scripts && scriptOrCommand in spec.scripts;
}

export class Run {
    static async runSpec(
        runSpec: ISpec,
        specPath: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        const infraDir = path.join(runSpec.dirpath, runSpec.config.infrastructureDirectory || '.');
        const contextInfraDir = curryWith(inDir, infraDir);
        const contextSpec = curryWith(withSpec, runSpec);
        const contextConfig = curryWith(withConfig, () => SPEC().config);
        const contexts = [contextInfraDir, contextSpec, contextConfig];
        await withContexts(contexts, async () => {
            const spec = SPEC();
            if (Run.shouldRunSubprojects(spec.name, specPath)) {
                await Run.runSubprojects(spec, specPath, scriptOrCommand, commandArgs);
            }
            if (!Run.shouldRunThisSpec(spec.name, specPath)) {
                return;
            }
            if (config.gitCommitIdEnvVar) {
                updateConfig({ env: { [config.gitCommitIdEnvVar]: await getCommitId() } });
            }
            // setup hook
            if (spec.hooks && spec.hooks.setup) {
                log.info('Running setup hook');
                await runCommands(undefined, { config, spec }, spec.hooks.setup);
            }
            await Run.runWorkspaces(spec, specPath, scriptOrCommand, commandArgs);
            // teardown hook
            if (spec.hooks && spec.hooks.teardown) {
                log.info('Running teardown hook');
                await runCommands(undefined, { config, spec }, spec.hooks.teardown);
            }
        });
    }

    private static shouldRunThisSpec(name: string, specPath: string): boolean {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts[0];
        const match = isMatch(name, pattern);
        if (parts.length > 2) {
            return false;
        }
        if (parts.length === 2) {
            return match;
        }
        return true;
    }

    private static shouldRunSubprojects(name: string, specPath: string): boolean {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts[0];
        const match = isMatch(name, pattern);
        if (parts.length > 1) {
            return match;
        }
        return true;
    }

    private static async runSubprojects(
        spec: ISpec,
        specPath: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        for (const subprojectName of Object.keys(spec.subprojects)) {
            const subprojectSpec = (spec.subprojects[subprojectName] as unknown) as ISpec;
            const nextSpecPath = Run.nextSpecPath(specPath);
            await Run.runSpec(subprojectSpec, nextSpecPath, scriptOrCommand, commandArgs);
        }
    }

    private static nextSpecPath(specPath: string): string {
        if (specPath.includes(SUBPROJECT_HIERARCHICAL_DELIMITER)) {
            return specPath
                .split(SUBPROJECT_HIERARCHICAL_DELIMITER)
                .slice(1)
                .join(SUBPROJECT_HIERARCHICAL_DELIMITER);
        }
        return specPath;
    }

    static async runWorkspaces(
        spec: ISpec,
        groupOrWorkspace: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        const configWithNodeModulesBinInPath = await getConfigWithNodeModulesBinInPath();
        await withConfig(configWithNodeModulesBinInPath, async () => {
            for (const workspaceName of Object.keys(spec.workspaces)) {
                if (Run.shouldRunThisWorkspace(workspaceName, groupOrWorkspace)) {
                    const workspace = spec.workspaces[workspaceName];
                    await withConfig(workspace.config || {}, async () => {
                        const fullName = Run.getWorkspaceFullName(spec, workspaceName);
                        updateConfig({ env: { TF_WORKSPACE: fullName } });
                        if (scriptOrCommand === '--config') {
                            console.log(config);
                        } else if (isScript(spec, scriptOrCommand)) {
                            await runScript(spec, scriptOrCommand, workspaceName);
                        } else if (Terraform.isSubcommand(scriptOrCommand)) {
                            const tf = new Terraform({
                                env: merge(process.env, config.env) as Hash,
                            });
                            await tf.subcommand(scriptOrCommand, commandArgs);
                        } else {
                            await runCommand(scriptOrCommand, commandArgs || [], {
                                env: merge(process.env, config.env) as Hash,
                            });
                        }
                    });
                }
            }
        });
    }

    private static shouldRunThisWorkspace(name: string, specPath: string): boolean {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts.slice(-1)[0];
        const match = isMatch(name, pattern);
        return match;
    }

    private static getWorkspaceFullName(spec: ISpec, workspaceName: string): string {
        const prefix = spec.config?.workspacePrefix || '';
        const suffix = spec.config?.workspaceSuffix || '';
        return `${prefix}${workspaceName}${suffix}`;
    }
}
