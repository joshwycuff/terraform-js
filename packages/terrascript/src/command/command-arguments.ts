import { Hash } from '../interfaces/types';

// private version of this interface where everything is required
// eslint-disable-next-line @typescript-eslint/naming-convention
interface _ICommandArguments {
    subcommands: string | string[];
    args: string | string[];
    flags: string | string[];
    options: string | string[] | Hash;
}

// public version of this interface where everything is optional
interface ICommandArguments {
    subcommands?: string | string[];
    args?: string | string[];
    flags?: string | string[];
    options?: string | string[] | Hash;
}

// all the types that CommandArguments can accept
export type CommandArgumentsLike = string | string[] | ICommandArguments | CommandArguments;

/**
 * A class to handle aggregation and string manipulation of command subcommands, arguments, flags,
 * and options.
 */
export class CommandArguments implements _ICommandArguments {
    private _subcommands: string[];

    private _args: string[];

    private _flags: string[];

    private _options: string[];

    /**
     * Create an instance of CommandArguments from something command arguments-like.
     *
     * @param {CommandArgumentsLike} args
     */
    constructor(args?: CommandArgumentsLike) {
        this._subcommands = [];
        this._args = [];
        this._flags = [];
        this._options = [];
        if (typeof args === 'undefined') {
            // empty args
        } else if (typeof args === 'string') {
            this.args = args;
        } else if (Array.isArray(args)) {
            this.args = args;
        } else {
            this.subcommands = (args as ICommandArguments).subcommands || [];
            this.args = (args as ICommandArguments).args || [];
            this.flags = (args as ICommandArguments).flags || [];
            this.options = (args as ICommandArguments).options || [];
        }
    }

    // eslint-disable-next-line require-jsdoc
    get subcommands() {
        return this._subcommands;
    }

    // eslint-disable-next-line require-jsdoc
    set subcommands(value: string | string[]) {
        this._subcommands = Array.isArray(value) ? value : value.split(' ');
    }

    // eslint-disable-next-line require-jsdoc
    get args() {
        return this._args;
    }

    // eslint-disable-next-line require-jsdoc
    set args(value: string | string[]) {
        this._args = Array.isArray(value) ? value : value.split(' ');
    }

    // eslint-disable-next-line require-jsdoc
    get flags() {
        return this._flags;
    }

    // eslint-disable-next-line require-jsdoc
    set flags(value: string | string[]) {
        this._flags = Array.isArray(value) ? value : value.split(' ');
    }

    // eslint-disable-next-line require-jsdoc
    get options() {
        return this._options;
    }

    // eslint-disable-next-line require-jsdoc
    set options(value: string | string[] | { [key: string]: string }) {
        if (typeof value === 'string') {
            this._options = value.split(' ');
        } else if (Array.isArray(value)) {
            this._options = value;
        } else {
            this._options = Object.keys(value).map((key) => `${key}=${value[key]}`);
        }
    }

    // eslint-disable-next-line require-jsdoc
    addSubcommand(value: string) {
        this._subcommands.push(value);
    }

    // eslint-disable-next-line require-jsdoc
    addArg(value: string) {
        this._args.push(value);
    }

    // eslint-disable-next-line require-jsdoc
    addFlag(value: string) {
        this._flags.push(value);
    }

    // eslint-disable-next-line require-jsdoc
    addOption(value: string) {
        this._options.push(value);
    }

    // eslint-disable-next-line require-jsdoc
    toString() {
        return this.get();
    }

    /**
     * Get the command arguments as a string
     */
    get() {
        return this.getArray().join(' ');
    }

    /**
     * Get command arguments as array of strings.
     */
    getArray() {
        return this._subcommands.concat(this._args, this._flags, this._options).filter((x) => x);
    }
}
