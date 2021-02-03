import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';
import { CommandOptions, run, execute } from '../command/command';
import { CommandCommand as TerraformCommand, CommandCommandLike } from '../command/command-command';
import {
    CommandArguments as TerraformArguments,
    CommandArgumentsLike,
} from '../command/command-arguments';
import { TF_INPUT, TF_LOG } from './types';
import { dotToSvg } from '../graphviz/dot';
import { Hash } from '../interfaces/types';
import { config } from '../config/config';

type TerraformCommandLike = CommandCommandLike;
type TerraformArgumentsLike = CommandArgumentsLike;

export class Terraform {
    command: TerraformCommand;

    options: CommandOptions;

    tfVars: Hash;

    tfVarsFiles: Array<string>;

    autoApprove: boolean;

    autoApproveApply: boolean;

    autoApproveDestroy: boolean;

    backendConfig: Hash;

    backendConfigFile?: string;

    private static subcommands = [
        'apply',
        'console',
        'destroy',
        'fmt',
        'force-unlock',
        'get',
        'graph',
        'import',
        'init',
        'login',
        'logout',
        'output',
        'plan',
        'providers',
        'push',
        'refresh',
        'show',
        'state',
        'taint',
        'untaint',
        'validate',
        'version',
        'workspace',
    ];

    constructor(options?: CommandOptions, command: TerraformCommandLike = config.command) {
        this.command = new TerraformCommand(command);
        this.options = merge({ env: process.env }, { env: config.env }, options);
        this.tfVars = config.tfVars;
        this.tfVarsFiles = config.tfVarsFiles;
        this.autoApprove = config.autoApprove;
        this.autoApproveApply = config.autoApproveApply;
        this.autoApproveDestroy = config.autoApproveDestroy;
        this.backendConfig = config.backendConfig;
        this.backendConfigFile = config.backendConfigFile;
    }

    // region Terraform commands
    async apply(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('apply', args, get);
    }

    async console(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('console', args, get);
    }

    async destroy(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('destroy', args, get);
    }

    async fmt(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('fmt', args, get);
    }

    async forceUnlock(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('force-unlock', args, get);
    }

    async get(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('get', args, get);
    }

    async graph(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('graph', args, get);
    }

    async import(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('import', args, get);
    }

    async init(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('init', args, get);
    }

    async login(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('login', args, get);
    }

    async logout(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('logout', args, get);
    }

    async output(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('output', args, get);
    }

    async getOutputJson(args?: TerraformArgumentsLike) {
        const tfArgs = new TerraformArguments(args);
        tfArgs.addFlag('-json');
        return JSON.parse((await this.subcommand('output', tfArgs, true)) as string);
    }

    async plan(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('plan', args, get);
    }

    async providers(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('providers', args, get);
    }

    async providersLock(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('providers lock', args, get);
    }

    async providersMirror(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('providers mirror', args, get);
    }

    async providersSchema(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('providers schema', args, get);
    }

    async push(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('push', args, get);
    }

    async refresh(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('refresh', args, get);
    }

    async show(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('show', args, get);
    }

    async getShowJson(args?: TerraformArgumentsLike) {
        const tfArgs = new TerraformArguments(args);
        tfArgs.addFlag('-json');
        return JSON.parse((await this.subcommand('show', tfArgs, true)) as string);
    }

    async stateList(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state list', args, get);
    }

    async getStateListArray(args?: TerraformArgumentsLike) {
        return ((await this.subcommand('state list', args, true)) as string)
            .split('\n')
            .filter((x) => x);
    }

    async stateMv(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state mv', args, get);
    }

    async statePull(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state pull', args, get);
    }

    async stateReplaceProvider(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state replace-provider', args, get);
    }

    async stateRm(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state rm', args, get);
    }

    async stateShow(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('state show', args, get);
    }

    async taint(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('taint', args, get);
    }

    async untaint(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('untaint', args, get);
    }

    async validate(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('validate', args, get);
    }

    async workspaceList(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('workspace list', args, get);
    }

    async workspaceSelect(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('workspaceSelect', args, get);
    }

    async workspaceNew(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('workspaceNew', args, get);
    }

    async workspaceDelete(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('workspaceDelete', args, get);
    }

    async workspaceShow(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('workspace show', args, get);
    }

    async version(args?: TerraformArgumentsLike, get = false) {
        return this.subcommand('version', args, get);
    }
    // endregion

    // region Terraform environment variables
    setEnvVariable(name: string, value: string) {
        if (typeof this.options.env === 'undefined') {
            this.options.env = {
                ...{},
                ...process.env,
            };
        }
        this.options.env[name] = value;
    }

    set_TF_LOG(value: TF_LOG) {
        this.setEnvVariable('TF_LOG', value);
    }

    set_TF_LOG_TRACE() {
        this.setEnvVariable('TF_LOG', 'TRACE');
    }

    set_TF_LOG_DEBUG() {
        this.setEnvVariable('TF_LOG', 'DEBUG');
    }

    set_TF_LOG_INFO() {
        this.setEnvVariable('TF_LOG', 'INFO');
    }

    set_TF_LOG_WARN() {
        this.setEnvVariable('TF_LOG', 'WARN');
    }

    set_TF_LOG_ERROR() {
        this.setEnvVariable('TF_LOG', 'ERROR');
    }

    set_TF_LOG_PATH(value: string) {
        this.setEnvVariable('TF_LOG_PATH', value);
    }

    set_TF_INPUT(value: TF_INPUT) {
        this.setEnvVariable('TF_INPUT', value);
    }

    set_TF_INPUT_ON() {
        this.setEnvVariable('TF_INPUT', 'true');
    }

    set_TF_INPUT_OFF() {
        this.setEnvVariable('TF_INPUT', 'false');
    }

    set_TF_VAR_name(name: string, value: string) {
        this.setEnvVariable(`TF_VAR_${name}`, value);
    }

    set_TF_CLI_ARGS(value: string) {
        this.setEnvVariable('TF_CLI_ARGS', value);
    }

    set_TF_CLI_ARGS_name(name: string, value: string) {
        this.setEnvVariable(`TF_CLI_ARGS_${name}`, value);
    }

    set_TF_DATA_DIR(value: string) {
        this.setEnvVariable('TF_DATA_DIR', value);
    }

    set_TF_WORKSPACE(value: string) {
        this.setEnvVariable('TF_WORKSPACE', value);
    }

    set_TF_IN_AUTOMATION(value: string) {
        this.setEnvVariable('TF_IN_AUTOMATION', value);
    }

    set_TF_IN_AUTOMATION_ON() {
        this.setEnvVariable('TF_IN_AUTOMATION', 'true');
    }

    set_TF_IN_AUTOMATION_OFF() {
        this.setEnvVariable('TF_IN_AUTOMATION', '');
    }

    set_TF_REGISTRY_DISCOVERY_RETRY(value: string) {
        this.setEnvVariable('TF_REGISTRY_DISCOVERY_RETRY', value);
    }

    set_TF_REGISTRY_CLIENT_TIMEOUT(value: string) {
        this.setEnvVariable('TF_REGISTRY_CLIENT_TIMEOUT', value);
    }

    set_TF_CLI_CONFIG_FILE(value: string) {
        this.setEnvVariable('TF_CLI_CONFIG_FILE', value);
    }

    set_TF_IGNORE(value: string) {
        this.setEnvVariable('TF_IGNORE', value);
    }

    set_TF_IGNORE_ON() {
        this.setEnvVariable('TF_IGNORE', 'TRACE');
    }

    set_TF_IGNORE_OFF() {
        this.setEnvVariable('TF_IGNORE', '');
    }
    // endregion

    // region Additional settings
    setAutoApprove(value: boolean) {
        this.autoApprove = value;
    }

    setAutoApproveOn() {
        this.autoApprove = true;
    }

    setAutoApproveOff() {
        this.autoApprove = false;
    }

    configureBackend(key: string, value: string) {
        this.backendConfig[key] = value;
    }

    configureBackendFile(filepath: string) {
        this.backendConfigFile = filepath;
    }
    // endregion

    // region Additional functionality
    static isSubcommand(cmd: string): boolean {
        return this.subcommands.includes(cmd);
    }

    async graphSvg(filename = 'graph.svg') {
        const cwd = this.options.cwd || '';
        const dot = path.join(cwd, filename.replace('.svg', '.dot'));
        const svg = path.join(cwd, filename);
        const graph = (await this.graph(undefined, true)) as string;
        await fs.writeFileSync(dot, graph);
        await dotToSvg(dot, svg);
        await fs.rmSync(dot);
    }
    // endregion

    // region Lower-level execution commands
    async run(args: TerraformArgumentsLike) {
        return run(this.command, args, this.options);
    }

    async execute(args: TerraformArgumentsLike): Promise<string> {
        return execute(this.command, args, this.options);
    }

    async subcommand(subcommand: string, args?: TerraformArgumentsLike, get = false) {
        const subargs = new TerraformArguments(subcommand)
            .getArray()
            .concat(new TerraformArguments(args).getArray())
            .filter((x) => `${x}`)
            .join(' ');
        const tfArgs = new TerraformArguments(subargs);
        const arg1 = tfArgs.getArray()[0];
        if (arg1 === 'init') {
            if (Object.keys(this.backendConfig).length > 0) {
                Object.keys(this.backendConfig).forEach((key) => {
                    tfArgs.addOption(`-backend-config="${key}=${this.backendConfig[key]}"`);
                });
            } else if (this.backendConfigFile) {
                tfArgs.addOption(`-backend-config="${this.backendConfigFile}"`);
            }
        }
        if (arg1 === 'plan') {
            for (const key of Object.keys(this.tfVars)) {
                tfArgs.addOption(`-var=${key}=${this.tfVars[key]}`);
            }
            for (const key of this.tfVarsFiles) {
                tfArgs.addOption(`-var-file=${key}`);
            }
        }
        if (arg1 === 'apply') {
            if (this.autoApprove || this.autoApproveApply) {
                tfArgs.addFlag('-auto-approve');
            }
            for (const key of Object.keys(this.tfVars)) {
                tfArgs.addOption(`-var=${key}=${this.tfVars[key]}`);
            }
            for (const key of this.tfVarsFiles) {
                tfArgs.addOption(`-var-file=${key}`);
            }
        }
        if (arg1 === 'destroy') {
            if (this.autoApprove || this.autoApproveApply) {
                tfArgs.addFlag('-auto-approve');
            }
        }
        return get ? this.execute(tfArgs) : this.run(tfArgs);
    }
    // endregion
}
