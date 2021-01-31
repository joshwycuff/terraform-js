import { Command, flags } from '@oclif/command';

import { run } from './terrascript/run';

class Terrascript extends Command {
    static description = 'describe the command here';

    static strict = false;

    static flags = {
        version: flags.version({ char: 'v' }),
        help: flags.help({ char: 'h' }),
    };

    static args = [
        { name: 'groupOrWorkspace', required: true },
        { name: 'scriptOrCommand', required: true },
        { name: 'commandArgs' },
    ];

    async run() {
        const { args, flags } = this.parse(Terrascript);

        const { groupOrWorkspace } = args;
        const { scriptOrCommand } = args;
        const commandArgs = this.argv.slice(2);

        await run(groupOrWorkspace, scriptOrCommand, commandArgs);
    }
}

export = Terrascript;
