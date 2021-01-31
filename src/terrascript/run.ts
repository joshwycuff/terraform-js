// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { merge } from 'lodash';
import fs from 'fs';
import { copySync } from 'fs-extra';
import path from 'path';
import { NULL, ORIGINAL_WORKING_DIRECTORY } from '../constants'; // just making sure constants get evaluated first
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
        stackConfig(spec.workspaces[workspace]?.config || {});
        updateConfig({ env: { TF_WORKSPACE: spec.workspaces[workspace].fullName } });
        spec.workspaces[workspace].workingDirectory = getWorkspaceDirectory(spec, workspace);
        if (spec.workspaces[workspace].useTmpDir) {
            await initWorkspace(spec, workspace);
        }
        if (scriptOrCommand === '--config') {
            console.log(config);
        } else if (Array.isArray(commandArgs) && commandArgs.length > 0) {
            const command = scriptOrCommand === '-' ? 'terraform' : scriptOrCommand;
            if (scriptOrCommand === '-') {
                const tf = new Terraform({
                    cwd: spec.workspaces[workspace].workingDirectory,
                    env: merge(process.env, config.env) as Hash,
                });
                await tf.subcommand(commandArgs[0], commandArgs.slice(1));
            } else {
                await runCommand(command, commandArgs, {
                    cwd: spec.workspaces[workspace].workingDirectory,
                    env: merge(process.env, config.env) as Hash,
                });
            }
        } else if (!spec.scripts || !Object.keys(spec.scripts).includes(scriptOrCommand)) {
            await runCommand(scriptOrCommand, [], {
                cwd: spec.workspaces[workspace].workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
        } else {
            await runScript(spec, scriptOrCommand, workspace);
        }
        unstackConfig();
    }
}
