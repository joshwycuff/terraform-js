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
    let cmd: Hash = {};
    let isTerraformSubcommand = false;
    const workspace = context.spec.workspaces[context.workspace];
    if (typeof command === 'string') {
        let cmdStr = command;
        if (cmdStr.split(' ')[0] === 'terraform') {
            cmdStr = cmdStr.split(' ').slice(1).join(' ');
        }
        const [cmdCommand, ...args] = cmdStr.split(' ');
        isTerraformSubcommand = Terraform.isSubcommand(cmdCommand);
        cmd.command = cmdCommand;
        cmd.args = args.join(' ');
    } else {
        cmd = (command as unknown) as Hash;
    }
    if (isTerraformSubcommand) {
        // pre-apply hook
        if (cmd.command === 'apply') {
            if (context.spec.hooks && context.spec.hooks['pre-apply']) {
                log.info('Running pre-apply hook');
                for (const hookCommand of context.spec.hooks['pre-apply']) {
                    await runCommand(tf, context, hookCommand);
                }
            }
        }
        // pre-destroy hook
        if (cmd.command === 'destroy') {
            if (context.spec.hooks && context.spec.hooks['pre-destroy']) {
                log.info('Running pre-destroy hook');
                for (const hookCommand of context.spec.hooks['pre-destroy']) {
                    await runCommand(tf, context, hookCommand);
                }
            }
        }
    }
    if ('condition' in cmd) {
        const condition = cmd.condition as ICommand;
        log.info(`Running condition: ${JSON.stringify(condition)}`);
        const exitCode = await runCommand(tf, context, condition);
        if (exitCode > 0) {
            console.warn(`Condition failed with exit code ${exitCode}`);
            return exitCode;
        }
        console.info('Condition passed.');
    }
    if ('function' in cmd) {
        log.info(`Running function: ${cmd.function}`);
        let functionReturnValue = 1 as ExitCode;
        const [m, f] = cmd.function.split('.');
        const cwd = cmd.cwd || workspace.workingDirectory;
        process.chdir(cwd);
        try {
            if (context.spec.modules) {
                functionReturnValue = (await context.spec.modules[m][f](tf, context)) as ExitCode;
            }
        } catch (error) {
            log.error('Function failed.');
            log.error(error);
        }
        process.chdir(ORIGINAL_WORKING_DIRECTORY);
        return functionReturnValue;
    }
    if (isTerraformSubcommand) {
        return tf.subcommand(cmd.command, cmd.args) as Promise<ExitCode>;
    }
    const cwd = cmd.cwd || workspace.workingDirectory;
    const env = merge(process.env, config.env) as Hash;
    return run(cmd.command, cmd.args, { cwd, env });
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
            return exitCode;
        }
    }
    return 0;
}

/**
 * @param spec
 * @param scriptName
 * @param workspace
 * @param workspaceName
 */
export async function runScript(spec: ISpec, scriptName: string, workspaceName: string) {
    let exitCode = 0;
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
        exitCode = await runCommands(tf, context, context.spec.hooks.setup);
    }
    if (exitCode === 0) {
        exitCode = await runCommands(tf, context, spec.scripts[scriptName]);
    }
    // teardown hook
    if (exitCode === 0 && context.spec.hooks && context.spec.hooks.teardown) {
        log.info('Running teardown hook');
        exitCode = await runCommands(tf, context, context.spec.hooks.teardown);
    }
    return exitCode;
}
