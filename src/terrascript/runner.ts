import { merge } from 'lodash';
import { ICommand } from '../interfaces/spec';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';
import { ExitCode, Hash } from '../interfaces/types';
import { Command } from '../command/command';
import { Expand } from './command';
import { inDir } from '../utils/in-dir';

/**
 * @param tf
 * @param context
 * @param command
 */
export async function runCommand(context: IContext, command: ICommand): Promise<ExitCode> {
    log.info(`Running command: ${JSON.stringify(command)}`);
    const { spec, config, target } = context;
    const tf = new Terraform(
        { cwd: config.infrastructureDirectory, env: config.env as Hash },
        config.command,
    );
    const commandContext: IContext = {
        tf,
        spec,
        config,
        target,
    };
    let icmd: Hash = {};
    let cmd: Command;
    let isTerraformSubcommand = false;
    if (typeof command === 'string') {
        let cmdStr = command;
        if (cmdStr.split(' ')[0] === 'terraform') {
            cmdStr = cmdStr.split(' ').slice(1).join(' ');
        }
        const [cmdCommand, ...args] = cmdStr.split(' ');
        isTerraformSubcommand = Terraform.isSubcommand(cmdCommand);
        icmd.command = cmdCommand;
        icmd.args = args.join(' ');
    } else {
        icmd = (command as unknown) as Hash;
        isTerraformSubcommand = Terraform.isSubcommand(icmd.command);
    }
    if (isTerraformSubcommand) {
        // pre-apply hook
        if (icmd.command === 'apply') {
            if (spec.hooks && spec.hooks['pre-apply']) {
                log.info('Running pre-apply hook');
                for (const hookCommand of spec.hooks['pre-apply']) {
                    await runCommand(commandContext, hookCommand);
                }
            }
        }
        // pre-destroy hook
        if (icmd.command === 'destroy') {
            if (spec.hooks && spec.hooks['pre-destroy']) {
                log.info('Running pre-destroy hook');
                for (const hookCommand of spec.hooks['pre-destroy']) {
                    await runCommand(commandContext, hookCommand);
                }
            }
        }
    }
    if ('condition' in icmd) {
        const condition = icmd.condition as ICommand;
        log.info(`Running condition: ${JSON.stringify(condition)}`);
        const exitCode: ExitCode = (await runCommand(commandContext, condition)) || 0;
        if (exitCode > 0) {
            console.warn(`Condition failed with exit code ${exitCode}`);
            return exitCode;
        }
        console.info('Condition passed.');
    }
    if ('function' in icmd) {
        log.info(`Running function: ${icmd.function}`);
        const [m, f] = icmd.function.split('.');
        const cwd = icmd.cwd || spec.infrastructureDirectory || process.cwd();
        return inDir(cwd, async () => {
            try {
                if (spec.modules) {
                    const func = spec.modules[m][f];
                    await func(commandContext);
                }
            } catch (error) {
                log.error('Function failed.');
                log.error(error);
                return 1;
            }
            return 0;
        });
    }
    if (isTerraformSubcommand) {
        cmd = (await (tf as Terraform).subcommand(icmd.command, icmd.args, 'command')) as Command;
    } else {
        const cwd = icmd.cwd || spec.infrastructureDirectory;
        const env = merge(process.env, config.env) as Hash;
        cmd = new Command(icmd.command, icmd.args, { cwd, env });
    }
    return Expand.expandAndRunCommand(commandContext, cmd);
}

/**
 * @param tf
 * @param context
 * @param commands
 */
export async function runCommands(context: IContext, commands: Array<ICommand>): Promise<ExitCode> {
    for (const command of commands) {
        if (await runCommand(context, command)) {
            return 1;
        }
    }
    return 0;
}

/**
 * @param context
 * @param scriptName
 */
export async function runScript(context: IContext, scriptName: string) {
    return runCommands(context, context.spec.scripts[scriptName]);
}
