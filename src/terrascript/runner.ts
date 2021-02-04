import { merge } from 'lodash';
import { Maybe } from 'maybe-optional';
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
    tf: Maybe<Terraform>,
    context: IContext,
    command: ICommand,
): Promise<ExitCode> {
    log.info(`Running command: ${JSON.stringify(command)}`);
    let cmd: Hash = {};
    let isTerraformSubcommand = false;
    const workspace = context.spec.workspaces[context.workspace || ''];
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
        const exitCode: ExitCode = (await runCommand(tf, context, condition)) || 0;
        if (exitCode > 0) {
            console.warn(`Condition failed with exit code ${exitCode}`);
            return exitCode;
        }
        console.info('Condition passed.');
    }
    if ('function' in cmd) {
        log.info(`Running function: ${cmd.function}`);
        const [m, f] = cmd.function.split('.');
        const cwd = cmd.cwd || workspace?.workingDirectory || process.cwd();
        process.chdir(cwd);
        try {
            if (context.spec.modules) {
                const func = context.spec.modules[m].module[f];
                await func(tf, context);
            }
        } catch (error) {
            log.error('Function failed.');
            log.error(error);
            return 1;
        }
        process.chdir(ORIGINAL_WORKING_DIRECTORY);
        return 0;
    }
    if (isTerraformSubcommand) {
        return (tf as Terraform).subcommand(cmd.command, cmd.args) as Promise<ExitCode>;
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
export async function runCommands(
    tf: Maybe<Terraform>,
    context: IContext,
    commands: Array<ICommand>,
): Promise<ExitCode> {
    for (const command of commands) {
        if (await runCommand(tf, context, command)) {
            return 1;
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
    const workspace = spec.workspaces[workspaceName];
    const tf = new Terraform({ cwd: workspace.workingDirectory });
    const context: IContext = {
        tf,
        config,
        spec,
        workspace: workspaceName,
    };
    return runCommands(tf, context, spec.scripts[scriptName]);
}