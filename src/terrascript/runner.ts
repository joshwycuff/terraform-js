import { merge } from 'lodash';
import { ICommand, ISpec } from '../interfaces/spec';
import { config } from '../config/config';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';
import { ExitCode, Hash } from '../interfaces/types';
import { run } from '../command/command';
import { ORIGINAL_WORKING_DIRECTORY } from '../constants';

/**
 * @param tf
 * @param context
 * @param command
 */
export async function runCommand(
    tf: Terraform,
    context: IContext,
    command: ICommand,
): Promise<number> {
    log.info(`Running command: ${JSON.stringify(command)}`);
    const workspace = context.spec.workspaces[context.workspace];
    if (typeof command === 'string') {
        // strings are assumed to be terraform subcommand arguments
        // pre-apply hook
        if (command.split(' ').includes('apply')) {
            if (context.spec.hooks && context.spec.hooks['pre-apply']) {
                log.info('Running pre-apply hook');
                for (const hookCommand of context.spec.hooks['pre-apply']) {
                    await runCommand(tf, context, hookCommand);
                }
            }
        }
        // pre-destroy hook
        if (command.split(' ').includes('destroy')) {
            if (context.spec.hooks && context.spec.hooks['pre-destroy']) {
                log.info('Running pre-destroy hook');
                for (const hookCommand of context.spec.hooks['pre-destroy']) {
                    await runCommand(tf, context, hookCommand);
                }
            }
        }
        return tf.subcommand(command) as Promise<ExitCode>;
    }
    if (typeof command === 'object') {
        if ('condition' in command) {
            const condition = command.condition as ICommand;
            log.info(`Running condition: ${JSON.stringify(condition)}`);
            const exitCode = await runCommand(tf, context, condition);
            if (exitCode > 0) {
                console.warn(`Condition failed with exit code ${exitCode}`);
                return exitCode;
            }
            console.info('Condition passed.');
        }
        if ('function' in command) {
            log.info(`Running function: ${command.function}`);
            const [m, f] = command.function.split('.');
            const cwd = command.cwd || workspace.workingDirectory;
            process.chdir(cwd);
            if (context.spec.modules) {
                return context.spec.modules[m][f](tf, context) as Promise<ExitCode>;
            }
            process.chdir(ORIGINAL_WORKING_DIRECTORY);
        } else if ('command' in command) {
            const cmd = command.command;
            const args = command.args || [];
            const cwd = command.cwd || workspace.workingDirectory;
            const env = merge(process.env, config.env) as Hash;
            return run(cmd, args, { cwd, env });
        } else {
            // command is written in short hand
            const cmd = Object.keys(command)[0];
            const args = command[cmd];
            console.log(args);
            return run(cmd, args, {
                cwd: workspace.workingDirectory,
                env: merge(process.env, config.env) as Hash,
            });
        }
    }
    return 1 as ExitCode;
}

/**
 * @param tf
 * @param context
 * @param commands
 */
export async function runCommands(tf: Terraform, context: IContext, commands: Array<ICommand>) {
    for (const command of commands) {
        let exitCode = 0;
        exitCode = await runCommand(tf, context, command).catch((error) => (exitCode = error));
        if (exitCode > 0) {
            log.error(`Command failed with exit code ${exitCode}`);
            log.error(JSON.stringify(command));
            throw new Error('Command failed.');
        }
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
    const tf = new Terraform({ cwd: workspace.workingDirectory });
    const context: IContext = {
        tf,
        config,
        spec,
        workspace: workspaceName,
    };
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
}
