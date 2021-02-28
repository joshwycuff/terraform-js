import { StdioOptions } from 'child_process';
import { Command, CommandOptions, execute, run } from '../../command/command';

describe('command', () => {
  const handlers = {
    stdout: {
      data: (data: string) => console.log(data.toString()),
    },
  };

  const spy = jest.spyOn(console, 'log')
    .mockImplementation();

  describe('Command', () => {
    beforeEach(() => {
      spy.mockReset();
    });
    it('should take a command', () => {
      const cmd = new Command('pwd');
      expect(cmd.get())
        .toEqual('pwd');
    });
    it('should take args', () => {
      const cmd = new Command('echo', 'asdf');
      expect(cmd.get())
        .toEqual('echo asdf');
    });
    it('should take options', () => {
      const options = {
        cwd: '/',
        env: {},
      };
      const cmd = new Command('pwd', undefined, options);
      expect(cmd.get())
        .toEqual('pwd');
    });
    it('should execute a command and return stdout', async () => {
      const cmd = new Command('printf', 'asdf');
      const result = await cmd.execute();
      expect(result)
        .toEqual('asdf');
    });
    it('should run a command and return exit code', async () => {
      const stdio: StdioOptions = 'pipe';
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const options: CommandOptions = {
        stdio,
        handlers,
      };
      const cmd = new Command('printf', 'asdf', options);
      const result = await cmd.run();
      expect(result)
        .toEqual(0);
      expect(spy)
        .toHaveBeenCalled();
      const stdout = spy.mock.calls[0][0];
      expect(stdout)
        .toEqual('asdf');
    });
  });
  describe('execute', () => {
    it('should take a command', async () => {
      const result = await execute('pwd');
      expect(result)
        .toEqual(`${process.cwd()}\n`);
    });
    it('should take args', async () => {
      const result = await execute('printf', 'asdf');
      expect(result)
        .toEqual('asdf');
    });
    it('should take options', async () => {
      const options = {
        cwd: '/',
        env: {},
      };
      const result = await execute('pwd', undefined, options);
      expect(result)
        .toEqual('/\n');
    });
  });
  describe('run', () => {
    const stdio: StdioOptions = 'pipe';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const options: CommandOptions = {
      stdio,
      handlers,
    };
    beforeEach(() => {
      spy.mockReset();
    });
    it('should take a command', async () => {
      const result = await run('pwd', undefined, options);
      expect(result)
        .toEqual(0);
      expect(spy)
        .toHaveBeenCalled();
      const stdout = spy.mock.calls[0][0];
      expect(stdout)
        .toEqual(`${process.cwd()}\n`);
    });
    it('should take args', async () => {
      const result = await run('printf', 'asdf', options);
      expect(result)
        .toEqual(0);
      expect(spy)
        .toHaveBeenCalled();
      const stdout = spy.mock.calls[0][0];
      expect(stdout)
        .toEqual('asdf');
    });
    it('should take cwd options', async () => {
      const result = await run('pwd', undefined, { cwd: '/', ...options });
      expect(result)
        .toEqual(0);
      expect(spy)
        .toHaveBeenCalled();
      const stdout = spy.mock.calls[0][0];
      expect(stdout)
        .toEqual('/\n');
    });
  });
});
