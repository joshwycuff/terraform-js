import { cloneDeep, merge } from 'lodash';

import {
  CommandCommandLike,
  CommandOptions,
  run,
  execute,
  Command,
  CommandArguments as TerraformArguments,
  CommandArgumentsLike,
} from '@joshwycuff/command';

import { config, IConfig, IConfigOptions } from './config';
import { TF_INPUT, TF_LOG } from './types';

type TerraformCommandLike = CommandCommandLike;
type TerraformArgumentsLike = CommandArgumentsLike;

/**
 * A class which wraps Terraform's CLI with additional support for automation.
 */
export class Terraform {
  conf: IConfig;

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
    'refresh',
    'show',
    'state',
    'taint',
    'untaint',
    'validate',
    'workspace',
  ];

  /**
   * Create an instance of the Terraform wrapper.
   *
   * @param {CommandOptions} options - Subprocess options (e.g. cwd, env).
   * @param {TerraformCommandLike} command - Override the Terraform command. This can be used
   * to specify a certain path to a particular Terraform executable.
   * @param conf
   */
  constructor(conf?: IConfigOptions) {
    this.conf = {} as IConfig;
    merge(
      this.conf,
      cloneDeep(config.peek()),
      cloneDeep(conf || {}),
    );
  }

  // region Terraform commands
  /**
   * Run `terraform apply [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments (e.g. -auto-approve).
   * @param {boolean} get - Flag to return stdout.
   */
  async apply(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('apply', args, get);
  }

  /**
   * Run `terraform console [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async console(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('console', args, get);
  }

  /**
   * Run `terraform destroy [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments (e.g. -auto-approve).
   * @param {boolean} get - Flag to return stdout.
   */
  async destroy(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('destroy', args, get);
  }

  /**
   * Run `terraform fmt [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async fmt(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('fmt', args, get);
  }

  /**
   * Run `terraform force-unlock [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async forceUnlock(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('force-unlock', args, get);
  }

  /**
   * Run `terraform get [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async get(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('get', args, get);
  }

  /**
   * Run `terraform graph [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async graph(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('graph', args, get);
  }

  /**
   * Run `terraform import [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async import(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('import', args, get);
  }

  /**
   * Run `terraform init [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async init(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('init', args, get);
  }

  /**
   * Run `terraform login [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async login(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('login', args, get);
  }

  /**
   * Run `terraform logout [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async logout(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('logout', args, get);
  }

  /**
   * Run `terraform output [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async output(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('output', args, get);
  }

  /**
   * Run `terraform output -json [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   */
  async getOutputJson(args?: TerraformArgumentsLike) {
    const tfArgs = new TerraformArguments(args);
    tfArgs.addFlag('-json');
    return JSON.parse((await this.subcommand('output', tfArgs, true)) as string);
  }

  /**
   * Run `terraform plan [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async plan(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('plan', args, get);
  }

  /**
   * Run `terraform providers [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async providers(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('providers', args, get);
  }

  /**
   * Run `terraform providers lock [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async providersLock(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('providers lock', args, get);
  }

  /**
   * Run `terraform providers mirror [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async providersMirror(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('providers mirror', args, get);
  }

  /**
   * Run `terraform providers schema [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async providersSchema(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('providers schema', args, get);
  }

  /**
   * Run `terraform refresh [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async refresh(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('refresh', args, get);
  }

  /**
   * Run `terraform show [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async show(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('show', args, get);
  }

  /**
   * Run `terraform show -json [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   */
  async getShowJson(args?: TerraformArgumentsLike) {
    const tfArgs = new TerraformArguments(args);
    tfArgs.addFlag('-json');
    return JSON.parse((await this.subcommand('show', tfArgs, true)) as string);
  }

  /**
   * Run `terraform state list [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async stateList(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state list', args, get);
  }

  /**
   * Run `terraform state list [args]` and return result as an array.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   */
  async getStateListArray(args?: TerraformArgumentsLike) {
    return ((await this.subcommand('state list', args, true)) as string)
      .split('\n')
      .filter((x) => x);
  }

  /**
   * Run `terraform state mv [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async stateMv(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state mv', args, get);
  }

  /**
   * Run `terraform state pull [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async statePull(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state pull', args, get);
  }

  /**
   * Run `terraform state replace-provider [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async stateReplaceProvider(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state replace-provider', args, get);
  }

  /**
   * Run `terraform state rm [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async stateRm(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state rm', args, get);
  }

  /**
   * Run `terraform state show [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async stateShow(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('state show', args, get);
  }

  /**
   * Run `terraform taint [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async taint(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('taint', args, get);
  }

  /**
   * Run `terraform untaint [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async untaint(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('untaint', args, get);
  }

  /**
   * Run `terraform validate [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async validate(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('validate', args, get);
  }

  /**
   * Run `terraform workspace list [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async workspaceList(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('workspace list', args, get);
  }

  /**
   * Run `terraform workspace select [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async workspaceSelect(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('workspace select', args, get);
  }

  /**
   * Run `terraform workspace new [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async workspaceNew(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('workspace new', args, get);
  }

  /**
   * Run `terraform workspace delete [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async workspaceDelete(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('workspace delete', args, get);
  }

  /**
   * Run `terraform workspace show [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async workspaceShow(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('workspace show', args, get);
  }

  /**
   * Run `terraform version [args]`.
   *
   * @param {TerraformArgumentsLike} args - Additional CLI arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  async version(args?: TerraformArgumentsLike, get = false) {
    return this.subcommand('version', args, get);
  }

  // endregion

  // region Terraform environment variables

  /**
   * Set an environment variable to be passed to Terraform subprocess.
   *
   * @param {string} name - Environment variable name.
   * @param {string} value - Environment variable value.
   */
  setEnvVariable(name: string, value: string) {
    if (this.conf.env === undefined) {
      this.conf.env = {
        ...{},
        ...cloneDeep(process.env),
      };
    }
    this.conf.env[name] = value;
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_LOG environment variable value.
   */
  set_TF_LOG(value: TF_LOG) {
    this.setEnvVariable('TF_LOG', value);
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess as TRACE.
   */
  set_TF_LOG_TRACE() {
    this.setEnvVariable('TF_LOG', 'TRACE');
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess as DEBUG.
   */
  set_TF_LOG_DEBUG() {
    this.setEnvVariable('TF_LOG', 'DEBUG');
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess as INFO.
   */
  set_TF_LOG_INFO() {
    this.setEnvVariable('TF_LOG', 'INFO');
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess as WARN.
   */
  set_TF_LOG_WARN() {
    this.setEnvVariable('TF_LOG', 'WARN');
  }

  /**
   * Set the TF_LOG environment variable to be passed to Terraform subprocess as ERROR.
   */
  set_TF_LOG_ERROR() {
    this.setEnvVariable('TF_LOG', 'ERROR');
  }

  /**
   * Set the TF_LOG_PATH environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_LOG_PATH environment variable value.
   */
  set_TF_LOG_PATH(value: string) {
    this.setEnvVariable('TF_LOG_PATH', value);
  }

  /**
   * Set the TF_INPUT environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_INPUT environment variable value.
   */
  set_TF_INPUT(value: TF_INPUT) {
    this.setEnvVariable('TF_INPUT', value);
  }

  /**
   * Set the TF_INPUT environment variable to be passed to Terraform subprocess as "true".
   */
  set_TF_INPUT_ON() {
    this.setEnvVariable('TF_INPUT', 'true');
  }

  /**
   * Set the TF_INPUT environment variable to be passed to Terraform subprocess as "false".
   */
  set_TF_INPUT_OFF() {
    this.setEnvVariable('TF_INPUT', 'false');
  }

  /**
   * Set a TF_VAR_name environment variable to be passed to Terraform subprocess.
   *
   * @param {string} name - The name to be appended to TF_VAR_ in the environment variable name.
   * @param {string} value - Environment variable value.
   */
  set_TF_VAR_name(name: string, value: string) {
    this.setEnvVariable(`TF_VAR_${name}`, value);
  }

  /**
   * Set the TF_CLI_ARGS environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_CLI_ARGS environment variable value.
   */
  set_TF_CLI_ARGS(value: string) {
    this.setEnvVariable('TF_CLI_ARGS', value);
  }

  /**
   * Set a TF_CLI_ARGS_name environment variable to be passed to Terraform subprocess.
   *
   * @param {string} name - The name to be appended to TF_CLI_ARGS_ in the environment variable
   * name.
   * @param {string} value - Environment variable value.
   */
  set_TF_CLI_ARGS_name(name: string, value: string) {
    this.setEnvVariable(`TF_CLI_ARGS_${name}`, value);
  }

  /**
   * Set the TF_DATA_DIR environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_DATA_DIR environment variable value.
   */
  set_TF_DATA_DIR(value: string) {
    this.setEnvVariable('TF_DATA_DIR', value);
  }

  /**
   * Set the TF_WORKSPACE environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_WORKSPACE environment variable value.
   */
  set_TF_WORKSPACE(value: string) {
    this.setEnvVariable('TF_WORKSPACE', value);
  }

  /**
   * Set the TF_IN_AUTOMATION environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_IN_AUTOMATION environment variable value.
   */
  set_TF_IN_AUTOMATION(value: string) {
    this.setEnvVariable('TF_IN_AUTOMATION', value);
  }

  /**
   * Set the TF_IN_AUTOMATION environment variable to be passed to Terraform subprocess as "true".
   */
  set_TF_IN_AUTOMATION_ON() {
    this.setEnvVariable('TF_IN_AUTOMATION', 'true');
  }

  /**
   * Set the TF_IN_AUTOMATION environment variable to be passed to Terraform subprocess as "".
   */
  set_TF_IN_AUTOMATION_OFF() {
    this.setEnvVariable('TF_IN_AUTOMATION', '');
  }

  /**
   * Set the TF_REGISTRY_DISCOVERY_RETRY environment variable to be passed to Terraform
   * subprocess.
   *
   * @param {string} value - TF_REGISTRY_DISCOVERY_RETRY environment variable value.
   */
  set_TF_REGISTRY_DISCOVERY_RETRY(value: string) {
    this.setEnvVariable('TF_REGISTRY_DISCOVERY_RETRY', value);
  }

  /**
   * Set the TF_REGISTRY_CLIENT_TIMEOUT environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_REGISTRY_CLIENT_TIMEOUT environment variable value.
   */
  set_TF_REGISTRY_CLIENT_TIMEOUT(value: string) {
    this.setEnvVariable('TF_REGISTRY_CLIENT_TIMEOUT', value);
  }

  /**
   * Set the TF_CLI_CONFIG_FILE environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_CLI_CONFIG_FILE environment variable value.
   */
  set_TF_CLI_CONFIG_FILE(value: string) {
    this.setEnvVariable('TF_CLI_CONFIG_FILE', value);
  }

  /**
   * Set the TF_IGNORE environment variable to be passed to Terraform subprocess.
   *
   * @param {string} value - TF_IGNORE environment variable value.
   */
  set_TF_IGNORE(value: string) {
    this.setEnvVariable('TF_IGNORE', value);
  }

  /**
   * Set the TF_IGNORE environment variable to be passed to Terraform subprocess as "TRACE".
   */
  set_TF_IGNORE_ON() {
    this.setEnvVariable('TF_IGNORE', 'TRACE');
  }

  /**
   * Set the TF_IGNORE environment variable to be passed to Terraform subprocess as "".
   */
  set_TF_IGNORE_OFF() {
    this.setEnvVariable('TF_IGNORE', '');
  }

  // endregion

  // region Additional settings

  /**
   * Set the auto approve flag.
   *
   * @param {boolean} value - Flag value.
   */
  setAutoApprove(value: boolean) {
    this.conf.autoApprove = value;
  }

  /**
   * Turn on auto approve.
   */
  setAutoApproveOn() {
    this.conf.autoApprove = true;
  }

  /**
   * Turn off auto approve.
   */
  setAutoApproveOff() {
    this.conf.autoApprove = false;
  }

  /**
   * Set a backend configuration option.
   *
   * @param {string} key - Name of backend configuration option.
   * @param {string} value - Value of backend configuration option.
   */
  configureBackend(key: string, value: string) {
    this.conf.backendConfig[key] = value;
  }

  /**
   * Set a backend configuration file.
   *
   * @param {string} filepath - Backend configuration filepath.
   */
  configureBackendFile(filepath: string) {
    this.conf.backendConfigFile = filepath;
  }

  // endregion

  // region Additional functionality

  /**
   * Check if a command string is a terraform subcommand
   *
   * @param {string} cmd - A command string
   * @returns {boolean} True if given command string is a terraform subcommand, otherwise false
   */
  static isSubcommand(cmd: string): boolean {
    return this.subcommands.includes(cmd);
  }

  // endregion

  // region Lower-level execution commands

  /**
   * Run terraform with inherited stdin and stdout.
   *
   * @param {TerraformArgumentsLike} args - Terraform arguments.
   * @param {CommandOptions} overrides - Command options to override instance options.
   * @param optionsOverrides
   */
  async run(args: TerraformArgumentsLike, optionsOverrides: CommandOptions = {}) {
    return run(this.conf.terraformCommand, args, this.getCommandOptions(optionsOverrides));
  }

  /**
   * Execute terraform and return the stdout.
   *
   * @param {TerraformArgumentsLike} args - Terraform arguments.
   * @param {CommandOptions} optionsOverrides - Command options to override instance options.
   * @returns {string} stdout
   */
  async execute(
    args: TerraformArgumentsLike,
    optionsOverrides: CommandOptions = {},
  ): Promise<string> {
    return execute(this.conf.terraformCommand, args, this.getCommandOptions(optionsOverrides));
  }

  /**
   * Run or execute a subcommand with additional arguments.
   *
   * @param {string} subcommand - A Terraform subcommand (e.g. init, apply).
   * @param {TerraformArgumentsLike} args - Subcommand arguments (e.g. -auto-approve).
   * @param {boolean} get - Flag to return stdout.
   */
  async subcommand(
    subcommand: string,
    args?: TerraformArgumentsLike,
    get: boolean | string = false,
  ) {
    const getAsBoolean = !!get;
    const subargs = new TerraformArguments(subcommand)
      .getArray()
      .concat(new TerraformArguments(args).getArray())
      .filter((x) => `${x}`)
      .join(' ');
    const tfArgs = new TerraformArguments(subargs);
    const arg1 = tfArgs.getArray()[0];
    if (arg1 === 'init') {
      if (Object.keys(this.conf.backendConfig).length > 0) {
        Object.keys(this.conf.backendConfig)
          .forEach((key) => {
            tfArgs.addOption(`-backend-config=${key}=${this.conf.backendConfig[key]}`);
          });
      } else if (this.conf.backendConfigFile) {
        tfArgs.addOption(`-backend-config=${this.conf.backendConfigFile}`);
      }
      return this._init(tfArgs, get);
    }
    if (['plan', 'apply', 'destroy'].includes(arg1)) {
      await this.addTfVarsAndTfVarsFiles(tfArgs);
    }
    if (arg1 === 'apply' && (this.conf.autoApprove || this.conf.autoApproveApply)) {
      tfArgs.addFlag('-auto-approve');
    }
    if (arg1 === 'destroy' && (this.conf.autoApprove || this.conf.autoApproveDestroy)) {
      tfArgs.addFlag('-auto-approve');
    }
    if (get === 'command') {
      return new Command(this.conf.terraformCommand, tfArgs, this.getCommandOptions());
    }
    return getAsBoolean ? this.execute(tfArgs) : this.run(tfArgs);
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * A private init function to ensure that TF_WORKSPACE is always default for the init
   * subcommand.
   *
   * @param {TerraformArguments} tfArgs - Terraform arguments.
   * @param {boolean} get - Flag to return stdout.
   */
  private async _init(tfArgs: TerraformArguments, get: boolean | string) {
    const getAsBoolean = !!get;
    const overrides: CommandOptions = {
      env: {
        TF_WORKSPACE: 'default',
      },
    };
    if (get === 'command') {
      return new Command(this.conf.terraformCommand, tfArgs, this.getCommandOptions());
    }
    return getAsBoolean ? this.execute(tfArgs, overrides) : this.run(tfArgs, overrides);
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * This allows running arbitrary commands with Terraform environment and is mostly meant for
   * help with testing
   *
   * @param command
   * @param args
   * @param optionsOverrides
   */
  async _execute(
    command: CommandCommandLike,
    args: CommandArgumentsLike,
    optionsOverrides: CommandOptions = {},
  ): Promise<string> {
    return execute(command, args, this.getCommandOptions(optionsOverrides));
  }

  // eslint-disable-next-line require-jsdoc
  private getCommandOptions(optionsOverrides: CommandOptions = {}): CommandOptions {
    const commandOptions: CommandOptions = cloneDeep({
      cwd: this.conf.cwd,
      env: this.conf.env,
    });
    merge(commandOptions, cloneDeep(optionsOverrides));
    return commandOptions;
  }

  // eslint-disable-next-line require-jsdoc
  private async addTfVarsAndTfVarsFiles(tfArgs: TerraformArguments): Promise<TerraformArguments> {
    for (const key of Object.keys(this.conf.tfVars)) {
      tfArgs.addOption(`-var=${key}=${this.conf.tfVars[key]}`);
    }
    for (const key of this.conf.tfVarsFiles) {
      tfArgs.addOption(`-var-file=${key}`);
    }
    return tfArgs;
  }

  // endregion
}
