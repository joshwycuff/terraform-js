import { CommandCommand } from '../../src/command/command-command';

describe('command-command', () => {
    it('should take a string', () => {
        const cmd = new CommandCommand('asdf');
        expect(cmd.get()).toEqual('asdf');
    });
    it('should take a string with relative path', () => {
        const cmd = new CommandCommand('./asdf/qwer');
        expect(cmd.get()).toEqual('asdf/qwer');
    });
    it('should take a string with absolute path', () => {
        const cmd = new CommandCommand('/asdf/qwer');
        expect(cmd.get()).toEqual('/asdf/qwer');
    });
    it('should take an object', () => {
        const cmd = new CommandCommand({ name: 'asdf', path: '/qwer' });
        expect(cmd.get()).toEqual('/qwer/asdf');
    });
    it('should take an object with name only', () => {
        const cmd = new CommandCommand({ name: 'asdf' });
        expect(cmd.get()).toEqual('asdf');
    });
    it('should have string representation', () => {
        const cmd = new CommandCommand('asdf');
        expect(`${cmd}`).toEqual('asdf');
    });
});
