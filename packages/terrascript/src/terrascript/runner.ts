import { merge, cloneDeep } from 'lodash';
import { ICommand } from '../interfaces/spec';
import { Terraform } from '../terraform/terraform';
import { log } from '../logging/logging';
import { IContext } from '../interfaces/context';
import { ExitCode, Hash } from '../interfaces/types';
import { Command } from '../../../command/src/command/command';
import { Expand } from './command';
import { inDir } from '../utils/in-dir';

/**
 * TODO
 */
export class Runner {
    /**
     * TODO
     *
     * @param context
     * @param scriptName
     */
    static async runScript(context: IContext, scriptName: string) {
        // beforeEachScript hook
        if (context.spec.hooks.beforeEachScript) {
            log.info('Running beforeEachScript hook');
            await Runner.runCommands(context, context.spec.hooks.beforeEachScript);
        }
        await Runner.runCommands(context, context.spec.scripts[scriptName]);
        // afterEachScript hook
        if (context.spec.hooks.afterEachScript) {
            log.info('Running afterEachScript hook');
            await Runner.runCommands(context, context.spec.hooks.afterEachScript);
        }
    }

    /**
     * TODO
     *
     * @param context
     * @param commands
     * @param isHook
     */
    static async runCommands(context: IContext, commands: Array<ICommand>, isHook = false) {
        for (const command of commands) {
            await Runner.runCommand(context, command, isHook);
        }
    }

    /**
     * TODO
     *
     * @param contextWithoutTf
     * @param command
     * @param isHook
     */
    static async runCommand(
        contextWithoutTf: IContext,
        command: ICommand,
        isHook = false,
    ): Promise<ExitCode> {
        log.info(`Running command: ${JSON.stringify(command)}`);
        const { spec, conf } = contextWithoutTf;
        const tf = new Terraform(
            { cwd: conf.infrastructureDirectory, env: conf.env as Hash },
            conf.command,
        );
        const context: IContext = {
            tf,
            ...contextWithoutTf,
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
        if ('condition' in icmd) {
            const condition = icmd.condition as ICommand;
            log.info(`Running condition: ${JSON.stringify(condition)}`);
            const exitCode: ExitCode = (await Runner.runCommand(context, condition)) || 0;
            if (exitCode > 0) {
                console.warn(`Condition failed with exit code ${exitCode}`);
                return exitCode;
            }
            console.info('Condition passed.');
        }
        // beforeEachCommand hook
        if (!isHook && spec.hooks.beforeEachCommand) {
            log.info('Running beforeEachCommand hook');
            await Runner.runCommands(context, spec.hooks.beforeEachCommand, true);
        }
        if (isTerraformSubcommand) {
            // beforeEachTerraform hook
            if (!isHook && spec.hooks.beforeEachTerraform) {
                log.info('Running beforeEachTerraform hook');
                await Runner.runCommands(context, spec.hooks.beforeEachTerraform, true);
            }
            // beforeEachTerraformApply hook
            if (icmd.command === 'apply') {
                if (!isHook && spec.hooks.beforeEachTerraformApply) {
                    log.info('Running beforeEachTerraformApply hook');
                    await Runner.runCommands(context, spec.hooks.beforeEachTerraformApply, true);
                }
            }
            // beforeEachTerraformDestroy hook
            if (icmd.command === 'destroy') {
                if (!isHook && spec.hooks.beforeEachTerraformDestroy) {
                    log.info('Running beforeEachTerraformDestroy hook');
                    await Runner.runCommands(context, spec.hooks.beforeEachTerraformDestroy, true);
                }
            }
        }
        if ('function' in icmd) {
            log.info(`Running function: ${icmd.function}`);
            const [m, f] = icmd.function.split('.');
            const cwd = icmd.cwd || spec.infrastructureDirectory || process.cwd();
            return inDir(cwd, async () => {
                try {
                    if (spec.modules) {
                        const func = spec.modules[m][f];
                        await func(context);
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
            cmd = (await (tf as Terraform).subcommand(
                icmd.command,
                icmd.args,
                'command',
            )) as Command;
        } else {
            const cwd = icmd.cwd || spec.infrastructureDirectory;
            const env: Hash = {};
            merge(env, cloneDeep(process.env), cloneDeep(conf.env));
            cmd = new Command(icmd.command, icmd.args, { cwd, env });
        }
        const result = await Expand.expandAndRunCommand(context, cmd);
        if (isTerraformSubcommand) {
            // afterEachTerraform hook
            if (!isHook && spec.hooks.afterEachTerraform) {
                log.info('Running afterEachTerraform hook');
                await Runner.runCommands(context, spec.hooks.afterEachTerraform, true);
            }
            // afterEachTerraformApply hook
            if (icmd.command === 'apply') {
                if (!isHook && spec.hooks.afterEachTerraformApply) {
                    log.info('Running afterEachTerraformApply hook');
                    await Runner.runCommands(context, spec.hooks.afterEachTerraformApply, true);
                }
            }
            // afterEachTerraformDestroy hook
            if (icmd.command === 'destroy') {
                if (!isHook && spec.hooks.afterEachTerraformDestroy) {
                    log.info('Running afterEachTerraformDestroy hook');
                    await Runner.runCommands(context, spec.hooks.afterEachTerraformDestroy, true);
                }
            }
        }
        // afterEachCommand hook
        if (!isHook && spec.hooks.afterEachCommand) {
            log.info('Running afterEachCommand hook');
            await Runner.runCommands(context, spec.hooks.afterEachCommand, true);
        }
        return result;
    }
}
