import { StdioOptions } from 'child_process';
import { execute as _execute } from './execute';
import { run as _run } from './run';
import { CommandCommand, CommandCommandLike } from './command-command';
import { CommandArguments, CommandArgumentsLike } from './command-arguments';
import { log } from '../logging/logging';
import { ExitCode, Hash } from '../interfaces/types';

export interface CommandOptions {
    cwd?: string;
    env?: Hash;
    stdio?: StdioOptions;
    handlers?: Hash<Hash<(data: any) => void>>;
}

/**
 * A class to handle commands and arguments with methods for either running a command with inherited
 * stdin and stdout or running a command and returning the stdout as a variable for further
 * processing.
 */
export class Command {
    private command: CommandCommand;

    private args: CommandArguments;

    private options: CommandOptions;

    /**
     * Create a new instance of a command.
     *
     * @param {CommandCommandLike} command - The main command to be run.
     * @param {CommandArgumentsLike} args - Subcommands, arguments, flags, and options.
     * @param {CommandOptions} options - Subprocess options (cwd and env).
     */
    constructor(
        command: CommandCommandLike,
        args?: CommandArgumentsLike,
        options?: CommandOptions,
    ) {
        this.command = new CommandCommand(command);
        this.args = new CommandArguments(args);
        this.options = options || {};
    }

    /**
     * Get string representation of command.
     */
    toString() {
        return this.get();
    }

    /**
     * Get string representation of command.
     */
    get(): string {
        const command = this.command.get();
        const args = this.args.get();
        return [command, args].filter((x) => x).join(' ');
    }

    /**
     * Execute the command and return the stdout.
     *
     * @returns {Promise<string>} The stdout of the subprocess.
     */
    async execute(): Promise<string> {
        log.debug(`Executing: "${this}"`);
        log.debug(`cwd: ${this.options.cwd}`);
        log.silly(`env: ${JSON.stringify(this.options.env, null, 2)}`);
        return _execute(this.get(), this.options.cwd, this.options.env);
    }

    /**
     * Execute the command with inherited stdin and stdout.
     *
     * @returns {Promise<ExitCode>} The exit code of the subprocess.
     */
    async run(): Promise<ExitCode> {
        log.debug(`Running: "${this}"`);
        log.debug(`cwd: ${this.options.cwd}`);
        log.silly(`env: ${JSON.stringify(this.options.env, null, 2)}`);
        const command = this.command.get();
        const args = this.args.getArray();
        return _run(
            command,
            args,
            this.options.cwd,
            this.options.env,
            this.options.stdio,
            this.options.handlers,
        );
    }
}

/**
 * Execute a command and return the stdout.
 *
 * @param {CommandCommandLike} command - The main command to be run.
 * @param {CommandArgumentsLike} args - Subcommands, arguments, flags, and options.
 * @param {CommandOptions} options - Subprocess options (cwd and env).
 * @returns {Promise<string>} The stdout of the subprocess.
 */
export async function execute(
    command: CommandCommandLike,
    args?: CommandArgumentsLike,
    options?: CommandOptions,
): Promise<string> {
    return new Command(command, args, options).execute();
}

/**
 * Execute the command with inherited stdin and stdout.
 *
 * @param {CommandCommandLike} command - The main command to be run.
 * @param {CommandArgumentsLike} args - Subcommands, arguments, flags, and options.
 * @param {CommandOptions} options - Subprocess options (cwd and env).
 * @returns {Promise<ExitCode>} The exit code of the subprocess.
 */
export async function run(
    command: CommandCommandLike,
    args?: CommandArgumentsLike,
    options?: CommandOptions,
): Promise<ExitCode> {
    return new Command(command, args, options).run();
}
