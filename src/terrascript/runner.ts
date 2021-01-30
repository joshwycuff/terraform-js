import * as fs from 'fs';
import { merge } from 'lodash';
import { copySync } from 'fs-extra';
import { ISpec } from '../interfaces/spec';
import { config, stackConfig, unstackConfig } from '../config/config';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';
import { Hash } from '../../dist/types';
import { run } from '../command/command';
import { ORIGINAL_WORKING_DIRECTORY } from '../constants';

/**
 * @param tf
 * @param spec
 * @param workspace
 * @param workspaceName
 */
export async function initWorkspace(tf: Terraform, spec: ISpec, workspaceName: string) {
    const workspace = spec.workspaces[workspaceName];
    log.silly(tf);
    log.silly(JSON.stringify(spec, null, 2));
    log.silly(workspaceName);
    log.silly(JSON.stringify(workspace, null, 2));
    log.silly(workspace.workingDirectory);
    await fs.mkdirSync(workspace.workingDirectory, { recursive: true });
    await copySync(config.infrastructureDirectory, workspace.workingDirectory);
}

/**
 * @param tf
 * @param context
 * @param command
 */
async function runCommand(tf: Terraform, context: IContext, command: string | Hash) {
    log.info(`Running command: ${JSON.stringify(command)}`);
    const workspace = context.spec.workspaces[context.workspace];
    if (typeof command === 'string') {
        // pre-apply hook
        if (command.split(' ').includes('apply')) {
            if (context.spec.hooks && context.spec.hooks['pre-apply']) {
                log.info('Running pre-apply hook');
                for (const hookCommand of context.spec.hooks['pre-apply']) {
                    await runCommand(tf, context, hookCommand);
                }
            }
        }
        // await tf.subcommand(command);
    } else if (typeof command === 'object') {
        if ('function' in command) {
            log.info(`Running function: ${command.function}`);
            const [m, f] = command.function.split('.');
            process.chdir(workspace.workingDirectory);
            if (context.spec.modules) {
                await context.spec.modules[m][f](tf, context);
            }
            process.chdir(ORIGINAL_WORKING_DIRECTORY);
        } else {
            const cmd = Object.keys(command)[0];
            const args = command[cmd].split(' ');
            await run(cmd, args, {
                cwd: context.spec.workspaces[context.workspace].workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
        }
    }
}

/**
 * @param tf
 * @param context
 * @param commands
 */
export async function runCommands(
    tf: Terraform,
    context: IContext,
    commands: Array<string | Hash>,
) {
    for (const command of commands) {
        await runCommand(tf, context, command);
    }
}

/**
 * @param spec
 * @param scriptName
 * @param workspace
 * @param workspaceName
 */
export async function runScript(spec: ISpec, scriptName: string, workspaceName: string) {
    const workspace = spec.workspaces[workspaceName];
    stackConfig(workspace?.config || {});
    const tf = new Terraform({ cwd: workspace.workingDirectory });
    const context: IContext = {
        tf,
        config,
        spec,
        workspace: workspaceName,
    };
    await initWorkspace(tf, spec, workspaceName);
    // setup hook
    if (context.spec.hooks && context.spec.hooks.setup) {
        log.info('Running setup hook');
        await runCommands(tf, context, context.spec.hooks.setup);
    }
    await runCommands(tf, context, spec.scripts[scriptName]);
    // teardown hook
    if (context.spec.hooks && context.spec.hooks.teardown) {
        log.info('Running teardown hook');
        await runCommands(tf, context, context.spec.hooks.teardown);
    }
    unstackConfig();
}
