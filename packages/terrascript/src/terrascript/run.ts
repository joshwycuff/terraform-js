import { merge, cloneDeep } from 'lodash';
import path from 'path';
import { isMatch } from 'micromatch';
import { NODE_MODULES, SUBPROJECT_HIERARCHICAL_DELIMITER } from '../constants'; // just making sure constants get evaluated first
import { config, updateConfig } from '../config/config';
import { Runner } from './runner';
import { ISpec, ITarget } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { Hash } from '../interfaces/types';
import { log } from '../logging/logging';
import { searchUp } from '../utils/search-up';
import { withConfig } from '../utils/with-config';
import { SPEC } from '../spec/specs';
import { curryContext, withContexts } from '../utils/withs';
import { inDir } from '../utils/in-dir';
import { withSpec } from '../utils/with-spec';

/**
 * TODO
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
 * TODO
 */
export class Run {
    /**
     * TODO
     *
     * @param runSpec
     * @param specPath
     * @param scriptOrCommand
     * @param commandArgs
     */
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
            await Run.runTargets(spec, specPath, scriptOrCommand, commandArgs);
        });
    }

    /**
     * TODO
     *
     * @param name
     * @param specPath
     * @private
     */
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

    /**
     * TODO
     *
     * @param name
     * @param specPath
     * @private
     */
    private static shouldRunSubprojects(name: string, specPath: string): boolean {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts[0];
        const match = isMatch(name, pattern);
        if (parts.length > 1) {
            return match;
        }
        return true;
    }

    /**
     * TODO
     *
     * @param spec
     * @param specPath
     * @param scriptOrCommand
     * @param commandArgs
     * @private
     */
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

    /**
     * TODO
     *
     * @param specPath
     * @private
     */
    private static nextSpecPath(specPath: string): string {
        if (specPath.includes(SUBPROJECT_HIERARCHICAL_DELIMITER)) {
            return specPath
                .split(SUBPROJECT_HIERARCHICAL_DELIMITER)
                .slice(1)
                .join(SUBPROJECT_HIERARCHICAL_DELIMITER);
        }
        return specPath;
    }

    /**
     * TODO
     *
     * @param spec
     * @param specPath
     * @param scriptOrCommand
     * @param commandArgs
     */
    static async runTargets(
        spec: ISpec,
        specPath: string,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        const configWithNodeModulesBinInPath = await getConfigWithNodeModulesBinInPath();
        await withConfig(configWithNodeModulesBinInPath, async () => {
            const targetNames = Run.getTargets(spec, specPath);
            if (targetNames.length > 0) {
                const context = { conf: config, spec };
                // beforeEachSubproject hook
                if (spec.hooks.beforeEachSubproject) {
                    log.info('Running beforeEachSubproject hook');
                    await Runner.runCommands(context, spec.hooks.beforeEachSubproject);
                }
                for (const targetName of targetNames) {
                    const target = spec.targets[targetName];
                    await Run.runTarget(SPEC(), target, scriptOrCommand, commandArgs);
                }
                // afterEachSubproject hook
                if (spec.hooks.afterEachSubproject) {
                    log.info('Running afterEachSubproject hook');
                    await Runner.runCommands(context, spec.hooks.afterEachSubproject);
                }
            }
        });
    }

    /**
     * TODO
     *
     * @param spec
     * @param target
     * @param scriptOrCommand
     * @param commandArgs
     * @private
     */
    private static async runTarget(
        spec: ISpec,
        target: ITarget,
        scriptOrCommand: string,
        commandArgs?: Array<string>,
    ) {
        await withConfig(target.config || {}, async () => {
            const env: Hash = {};
            merge(env, cloneDeep(process.env), cloneDeep(config.env));
            const context = {
                spec,
                conf: config,
                target,
            };
            // beforeEachTarget hook
            if (spec.hooks.beforeEachTarget) {
                log.info('Running beforeEachTarget hook');
                await Runner.runCommands(context, spec.hooks.beforeEachTarget);
            }
            if (scriptOrCommand === '--conf') {
                console.log(config);
            } else if (Run.isScript(spec, scriptOrCommand)) {
                await Runner.runScript(context, scriptOrCommand);
            } else {
                const command = {
                    command: scriptOrCommand,
                    args: commandArgs,
                };
                await Runner.runCommand(context, command);
            }
            // afterEachTarget hook
            if (spec.hooks.afterEachTarget) {
                log.info('Running afterEachTarget hook');
                await Runner.runCommands(context, spec.hooks.afterEachTarget);
            }
        });
    }

    /**
     * TODO
     *
     * @param spec
     * @param specPath
     * @private
     */
    private static getTargets(spec: ISpec, specPath: string): string[] {
        const parts = specPath.split(SUBPROJECT_HIERARCHICAL_DELIMITER);
        const pattern = parts.slice(-1)[0];
        const specTargets = Object.keys(spec.targets);
        let targets;
        if (Object.keys(spec.groups).includes(pattern)) {
            targets = spec.groups[pattern].filter((name) => specTargets.includes(name));
        } else {
            targets = specTargets.filter((name) => isMatch(name, pattern));
        }
        if (targets.length === 0) {
            const msg = `No matching targets in ${spec.name}: ${pattern}`;
            if (config.onTargetNotFound === 'error') {
                throw new Error(msg);
            }
            log.log(config.onTargetNotFound, msg);
        }
        return targets;
    }

    /**
     * TODO
     *
     * @param spec
     * @param scriptOrCommand
     * @private
     */
    private static isScript(spec: ISpec, scriptOrCommand: string): boolean {
        return !!spec.scripts && scriptOrCommand in spec.scripts;
    }
}
