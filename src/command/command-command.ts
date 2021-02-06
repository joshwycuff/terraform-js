import path from 'path';

// private version of this interface where everything is required
// eslint-disable-next-line @typescript-eslint/naming-convention
interface _ICommandCommand {
    path: string;
    name: string;
}

// public version of this interface where everything is optional
interface ICommandCommand {
    path?: string;
    name?: string;
}

// all the types CommandCommand can accept
export type CommandCommandLike = string | ICommandCommand | CommandCommand;

/**
 * A class to handle any string manipulation of commands.
 */
export class CommandCommand implements _ICommandCommand {
    path: string;

    name: string;

    // eslint-disable-next-line require-jsdoc
    constructor(command: CommandCommandLike) {
        if (typeof command === 'string') {
            const iCommandCommand = this.deconstructString(command);
            this.path = iCommandCommand.path;
            this.name = iCommandCommand.name;
        } else {
            this.path = command.path || '';
            this.name = (command as _ICommandCommand).name;
        }
    }

    /**
     * Get the string representation of a command.
     */
    toString() {
        return this.get();
    }

    /**
     * Get the string representation of a command.
     */
    get() {
        return path.join(this.path, this.name);
    }

    // eslint-disable-next-line class-methods-use-this
    private deconstructString(str: string): _ICommandCommand {
        return {
            path: path.dirname(str),
            name: path.basename(str),
        };
    }
}
