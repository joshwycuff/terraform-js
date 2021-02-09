import { merge } from 'lodash';
import path from 'path';
import { isMatch } from 'micromatch';
import { NODE_MODULES, SUBPROJECT_HIERARCHICAL_DELIMITER } from '../constants'; // just making sure constants get evaluated first
import { config, updateConfig } from '../config/config';
import { runCommand, runCommands, runScript } from './runner';
import { ISpec } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { Hash } from '../interfaces/types';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { searchUp } from '../utils/search-up';
import { withConfig } from '../utils/with-config';
import { SPEC } from '../spec/specs';
import { curryContext, withContexts } from '../utils/withs';
import { inDir } from '../utils/in-dir';
import { withSpec } from '../utils/with-spec';

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

export class Run {
    static async runSpec(
        runSpec: ISpec,
        specPath: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        const infraDir = path.join(runSpec.dirpath, runSpec.config.infrastructureDirectory || '.');
        const contextInfraDir = curryContext(inDir, infraDir);
        const contextSpec = curryContext(withSpec, runSpec);
        const contextConfig = curryContext(withConfig, () => SPEC().config);
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
        specPath: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        const configWithNodeModulesBinInPath = await getConfigWithNodeModulesBinInPath();
        await withConfig(configWithNodeModulesBinInPath, async () => {
            for (const workspaceName of Run.getWorkspaces(spec, specPath)) {
                const workspace = spec.workspaces[workspaceName];
                await withConfig(workspace.config || {}, async () => {
                    const fullName = Run.getWorkspaceFullName(spec, workspaceName);
                    updateConfig({ env: { TF_WORKSPACE: fullName } });
                    if (scriptOrCommand === '--config') {
                        console.log(config);
                    } else if (Run.isScript(spec, scriptOrCommand)) {
                        await runScript(spec, scriptOrCommand, workspaceName);
                    } else {
                        const tf = new Terraform({
                            env: merge(process.env, config.env) as Hash,
                        });
                        const context = {
                            tf,
                            spec: SPEC(),
                            config,
                            workspace: workspaceName,
                        };
                        const command = {
                            command: scriptOrCommand,
                            args: commandArgs,
                        };
                        await runCommand(tf, context, command);
                    }
                });
            }
        });
    }

    private static getWorkspaces(spec: ISpec, specPath: string): string[] {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts.slice(-1)[0];
        const specWorkspaces = Object.keys(spec.workspaces);
        let workspaces;
        if (Object.keys(spec.groups).includes(pattern)) {
            workspaces = spec.groups[pattern].filter((name) => specWorkspaces.includes(name));
        } else {
            workspaces = specWorkspaces.filter((name) => isMatch(name, pattern));
        }
        if (workspaces.length === 0) {
            const msg = `No matching workspaces in ${spec.name}: ${pattern}`;
            if (config.onWorkspaceNotFound === 'error') {
                throw new Error(msg);
            }
            log.log(config.onWorkspaceNotFound, msg);
        }
        return workspaces;
    }

    private static isScript(spec: ISpec, scriptOrCommand: string): boolean {
        return !!spec.scripts && scriptOrCommand in spec.scripts;
    }

    private static getWorkspaceFullName(spec: ISpec, workspaceName: string): string {
        const prefix = spec.config?.workspacePrefix || '';
        const suffix = spec.config?.workspaceSuffix || '';
        return `${prefix}${workspaceName}${suffix}`;
    }
}
