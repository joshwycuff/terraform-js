// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { merge } from 'lodash';
import { NULL } from '../constants'; // just making sure constants get evaluated first
import { compileScriptSpec, getScriptSpec } from './terrascript';
import { config, stackConfig, unstackConfig, updateConfig } from '../config/config';
import { runScript } from './runner';
import { run as runCommand } from '../command/command';
import { ISpec } from '../interfaces/spec';
import { getCommitId } from '../git/git';
import { Hash } from '../../dist/types';

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
 * @param groupOrWorkspace
 * @param scriptOrCommand
 * @param commandArgs
 */
export async function run(
    groupOrWorkspace: string,
    scriptOrCommand: string,
    commandArgs?: Array<string>,
) {
    const isCommand = Array.isArray(commandArgs) && commandArgs.length > 0;
    const spec = await compileScriptSpec(await getScriptSpec('./terrascript.yml'));
    stackConfig(spec.config || {});
    if (config.commitId) {
        updateConfig({ env: { [config.commitId]: await getCommitId() } });
    }
    for (const workspace of getWorkspaces(spec, groupOrWorkspace)) {
        stackConfig(spec.workspaces[workspace]?.config || {});
        updateConfig({ env: { TF_WORKSPACE: spec.workspaces[workspace].fullName } });
        if (isCommand) {
            const command = scriptOrCommand === '-' ? 'terraform' : scriptOrCommand;
            await runCommand(command, commandArgs, {
                cwd: spec.workspaces[workspace].workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
        } else {
            await runScript(spec, scriptOrCommand, workspace);
        }
        unstackConfig();
    }
}
