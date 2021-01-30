// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NULL } from '../constants'; // just making sure constants get evaluated first
import { compileScriptSpec, getScriptSpec } from './terrascript';
import { stackConfig } from '../config/config';
import { runScript } from './runner';
import { ISpec } from '../interfaces/spec';

/**
 * @param spec
 * @param groupOrWorkspaceName
 */
function getWorkspaces(spec: ISpec, groupOrWorkspaceName: string) {
    const { groups } = spec;
    const workspaces = Object.keys(spec.workspaces);
    if (groupOrWorkspaceName === '*') {
        return workspaces;
    }
    if (groups && groupOrWorkspaceName in groups) {
        return groups[groupOrWorkspaceName];
    }
    return [groupOrWorkspaceName];
}

/**
 *
 */
export async function run() {
    const scriptName = 'version';
    const groupOrWorkspaceName = '*';
    const spec = await compileScriptSpec(await getScriptSpec('./terrascript.yml'));
    stackConfig(spec.config || {});
    for (const workspace of getWorkspaces(spec, groupOrWorkspaceName)) {
        await runScript(spec, scriptName, workspace);
    }
}
