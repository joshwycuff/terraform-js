import { execute as _execute } from './execute';
import { run as _run } from './run';
import { CommandCommand, CommandCommandLike } from './command-command';
import { CommandArguments, CommandArgumentsLike } from './command-arguments';
import { log } from '../logging/logging';

export interface CommandOptions {
    cwd?: string;
    env?: { [key: string]: string };
}

export class Command {
    private command: CommandCommand;

    private args: CommandArguments;

    private options: CommandOptions;

    constructor(
        command: CommandCommandLike,
        args?: CommandArgumentsLike,
        options?: CommandOptions,
    ) {
        this.command = new CommandCommand(command);
        this.args = new CommandArguments(args);
        this.options = options || {};
    }

    toString() {
        return this.get();
    }

    get(): string {
        const command = this.command.get();
        const args = this.args.get();
        return [command, args].filter((x) => x).join(' ');
    }

    async execute() {
        log.debug(`Executing: "${this}"`);
        log.debug(`cwd: ${this.options.cwd}`);
        log.silly(`env: ${JSON.stringify(this.options.env, null, 2)}`);
        return _execute(this.get(), this.options.cwd, this.options.env);
    }

    async run() {
        log.debug(`Running: "${this}"`);
        log.debug(`cwd: ${this.options.cwd}`);
        log.silly(`env: ${JSON.stringify(this.options.env, null, 2)}`);
        const command = this.command.get();
        const args = this.args.getArray();
        return _run(command, args, this.options.cwd, this.options.env);
    }
}

/**
 * @param command
 * @param args
 * @param options
 */
export async function execute(
    command: CommandCommandLike,
    args?: CommandArgumentsLike,
    options?: CommandOptions,
) {
    return new Command(command, args, options).execute();
}

/**
 * @param command
 * @param args
 * @param options
 * @param stdin
 */
export async function run(
    command: CommandCommandLike,
    args?: CommandArgumentsLike,
    options?: CommandOptions,
) {
    return new Command(command, args, options).run();
}
