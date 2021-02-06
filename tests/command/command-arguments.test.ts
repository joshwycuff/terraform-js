import { CommandArguments } from '../../src/command/command-arguments';

describe('command-arguments', () => {
    it('should take nothing', () => {
        const args = new CommandArguments();
        expect(args.get()).toEqual('');
    });
    it('should take a string', () => {
        const args = new CommandArguments('asdf asdf');
        expect(args.get()).toEqual('asdf asdf');
    });
    it('should take an array', () => {
        const args = new CommandArguments(['asdf', 'asdf']);
        expect(args.get()).toEqual('asdf asdf');
    });
    it('should take an ICommandArguments subcommands', () => {
        const iargs = { subcommands: 'asdf asdf' };
        const args = new CommandArguments(iargs);
        expect(args.get()).toEqual('asdf asdf');
    });
    it('should take an ICommandArguments args', () => {
        const iargs = { args: 'asdf asdf' };
        const args = new CommandArguments(iargs);
        expect(args.get()).toEqual('asdf asdf');
    });
    it('should take an ICommandArguments flags', () => {
        const iargs = { flags: '-asdf -asdf' };
        const args = new CommandArguments(iargs);
        expect(args.get()).toEqual('-asdf -asdf');
    });
    it('should take an ICommandArguments options', () => {
        const iargs = { options: '--asdf=qwer' };
        const args = new CommandArguments(iargs);
        expect(args.get()).toEqual('--asdf=qwer');
    });
    it('should expose subcommands', () => {
        const iargs = { subcommands: 'asdf asdf' };
        const args = new CommandArguments(iargs);
        expect(args.subcommands).toEqual(['asdf', 'asdf']);
    });
    it('should expose args', () => {
        const iargs = { args: 'asdf asdf' };
        const args = new CommandArguments(iargs);
        expect(args.args).toEqual(['asdf', 'asdf']);
    });
    it('should expose flags', () => {
        const iargs = { flags: '-asdf -asdf' };
        const args = new CommandArguments(iargs);
        expect(args.flags).toEqual(['-asdf', '-asdf']);
    });
    it('should expose options', () => {
        const iargs = { options: { asdf: 'qwer' } };
        const args = new CommandArguments(iargs);
        expect(args.options).toEqual(['asdf=qwer']);
    });
    it('should add subcommands', () => {
        const iargs = { subcommands: 'asdf' };
        const args = new CommandArguments(iargs);
        args.addSubcommand('qwer');
        expect(args.get()).toEqual('asdf qwer');
    });
    it('should add args', () => {
        const iargs = { args: 'asdf' };
        const args = new CommandArguments(iargs);
        args.addArg('qwer');
        expect(args.get()).toEqual('asdf qwer');
    });
    it('should add flags', () => {
        const iargs = { flags: 'asdf' };
        const args = new CommandArguments(iargs);
        args.addFlag('qwer');
        expect(args.get()).toEqual('asdf qwer');
    });
    it('should add options', () => {
        const iargs = { options: 'asdf' };
        const args = new CommandArguments(iargs);
        args.addOption('qwer');
        expect(args.get()).toEqual('asdf qwer');
    });
    it('should expose toString', () => {
        const args = new CommandArguments('asdf asdf');
        expect(`${args}`).toEqual('asdf asdf');
    });
});
