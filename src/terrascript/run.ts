// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { merge } from 'lodash';
import fs from 'fs';
import { copySync } from 'fs-extra';
import { NULL } from '../constants'; // just making sure constants get evaluated first
import { compileScriptSpec, getScriptSpec } from './terrascript';
import { config, stackConfig, unstackConfig, updateConfig } from '../config/config';
import { runScript } from './runner';
import { run as runCommand } from '../command/command';
import { ISpec } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { Hash } from '../interfaces/types';
import { Terraform } from '../terraform/terraform';

/**
 * @param spec
 * @param groupOrWorkspaceName
 */
function getWorkspaces(spec: ISpec, groupOrWorkspaceName: string) {
    const { groups } = spec;
    const workspaces = Object.keys(spec.workspaces);
    if (groupOrWorkspaceName === 'all') {
        return workspaces;
    }
    if (groups && groupOrWorkspaceName in groups) {
        return groups[groupOrWorkspaceName];
    }
    return [groupOrWorkspaceName];
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
 * @param groupOrWorkspace
 * @param scriptOrCommand
 * @param commandArgs
 */
export async function run(
    groupOrWorkspace: string,
    scriptOrCommand: string,
    commandArgs?: Array<string>,
) {
    const spec = await compileScriptSpec(await getScriptSpec('./terrascript.yml'));
    stackConfig(spec.config || {});
    if (config.commitId) {
        updateConfig({ env: { [config.commitId]: await getCommitId() } });
    }
    for (const workspace of getWorkspaces(spec, groupOrWorkspace)) {
        await initWorkspace(spec, workspace);
        stackConfig(spec.workspaces[workspace]?.config || {});
        updateConfig({ env: { TF_WORKSPACE: spec.workspaces[workspace].fullName } });
        if (scriptOrCommand === '--config') {
            console.log(config);
        } else if (Array.isArray(commandArgs) && commandArgs.length > 0) {
            const command = scriptOrCommand === '-' ? 'terraform' : scriptOrCommand;
            if (scriptOrCommand === '-') {
                console.log(config);
                const tf = new Terraform({
                    cwd: spec.workspaces[workspace].workingDirectory,
                    env: merge(process.env, config.env) as Hash,
                });
                await tf.run(commandArgs);
            } else {
                await runCommand(command, commandArgs, {
                    cwd: spec.workspaces[workspace].workingDirectory,
                    env: merge(process.env, config.env) as Hash,
                });
            }
        } else {
            await runScript(spec, scriptOrCommand, workspace);
        }
        unstackConfig();
    }
}
