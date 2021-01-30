import * as path from 'path';

interface _ICommandCommand {
    path: string;
    name: string;
}

interface ICommandCommand {
    path?: string;
    name?: string;
}

export type CommandCommandLike = string | ICommandCommand | CommandCommand;

export class CommandCommand implements _ICommandCommand {
    path: string;

    name: string;

    constructor(command: CommandCommandLike) {
        if (typeof command === 'string') {
            const iCommandCommand = this.deconstructString(command);
            this.path = iCommandCommand.path;
            this.name = iCommandCommand.name;
        } else {
            this.path = (command as _ICommandCommand).path;
            this.name = (command as _ICommandCommand).name;
        }
    }

    toString() {
        return this.get();
    }

    get() {
        return path.join(this.path, this.name);
    }

    private deconstructString(str: string): _ICommandCommand {
        return {
            path: path.dirname(str),
            name: path.basename(str),
        };
    }
}
