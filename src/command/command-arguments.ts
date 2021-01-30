interface _ICommandArguments {
    subcommands: string | string[];
    args: string | string[];
    flags: string | string[];
    options: string | string[] | { [key: string]: string };
}

interface ICommandArguments {
    subcommands?: string | string[];
    args?: string | string[];
    flags?: string | string[];
    options?: string | string[] | { [key: string]: string };
}

export type CommandArgumentsLike = string | string[] | ICommandArguments | CommandArguments;

export class CommandArguments implements _ICommandArguments {
    private _subcommands: string[];

    private _args: string[];

    private _flags: string[];

    private _options: string[];

    constructor(args?: CommandArgumentsLike) {
        this._subcommands = [];
        this._args = [];
        this._flags = [];
        this._options = [];
        if (typeof args === 'undefined') {
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

    get subcommands() {
        return this._subcommands;
    }

    get args() {
        return this._args;
    }

    get flags() {
        return this._flags;
    }

    get options() {
        return this._options;
    }

    set subcommands(value: string | string[]) {
        this._subcommands = Array.isArray(value) ? value : value.split(' ');
    }

    set args(value: string | string[]) {
        this._args = Array.isArray(value) ? value : value.split(' ');
    }

    set flags(value: string | string[]) {
        this._flags = Array.isArray(value) ? value : value.split(' ');
    }

    set options(value: string | string[] | { [key: string]: string }) {
        if (typeof value === 'string') {
            this._options = value.split(' ');
        } else if (Array.isArray(value)) {
            this._options = value;
        } else {
            this._options = Object.keys(value).map((key) => `${key}=${value[key]}`);
        }
    }

    addSubcommand(value: string) {
        this._subcommands.push(value);
    }

    addArg(value: string) {
        this._args.push(value);
    }

    addFlag(value: string) {
        this._flags.push(value);
    }

    addOption(value: string) {
        this._options.push(value);
    }

    toString() {
        return this.get();
    }

    get() {
        return this.getArray().join(' ');
    }

    getArray() {
        return this._subcommands.concat(this._args, this._flags, this._options).filter((x) => x);
    }
}
