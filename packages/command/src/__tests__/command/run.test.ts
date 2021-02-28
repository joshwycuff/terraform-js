import { Hash } from '@joshwycuff/types';
import { run } from '../../command/run';

describe('run', () => {
  const handlers = {
    stdout: {
      data: (data: string) => console.log(data.toString()),
    },
  };

  const spy = jest.spyOn(console, 'log')
    .mockImplementation();

  /**
   * @param command
   * @param args
   * @param cwd
   * @param env
   */
  async function testrun(
    command: string,
    args: string[] = [],
    cwd?: string,
    env?: Hash,
  ) {
    spy.mockReset();
    return run(command, args, cwd, env, 'pipe', handlers);
  }

  it('should run a command', async () => {
    const cmd = 'pwd';
    const result = await testrun(cmd);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual(`${process.cwd()}\n`);
  });

  it('should take an argument', async () => {
    const cmd = 'printf';
    const args = ['asdf'];
    const result = await testrun(cmd, args);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('asdf');
  });

  it('should take arguments', async () => {
    const cmd = 'echo';
    const args = ['a', 'b'];
    const result = await testrun(cmd, args);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('a b\n');
  });

  it('should optionally take a cwd', async () => {
    const cmd = 'pwd';
    const args: string[] = [];
    const cwd = '/';
    const result = await testrun(cmd, args, cwd);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('/\n');
  });

  it('should optionally take environment variables', async () => {
    const cmd = 'env';
    const args: string[] = [];
    const cwd = undefined;
    const env = { testVar: 'asdf' };
    const result = await testrun(cmd, args, cwd, env);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('testVar=asdf\n');
  });

  it('should expand environment variables', async () => {
    const cmd = 'printf';
    // eslint-disable-next-line no-template-curly-in-string
    const args = ['$testVar ${testVar}'];
    const cwd = undefined;
    const env = { testVar: 'asdf' };
    const result = await testrun(cmd, args, cwd, env);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('asdf asdf');
  });

  it('should expand unset environment variables to empty string', async () => {
    const cmd = 'echo';
    const args = ['$testVar'];
    const cwd = undefined;
    const env = {};
    const result = await testrun(cmd, args, cwd, env);
    expect(result)
      .toEqual(0);
    expect(spy)
      .toHaveBeenCalled();
    const stdout = spy.mock.calls[0][0];
    expect(stdout)
      .toEqual('\n');
  });

  it('should reject when error', async () => {
    expect.assertions(1);
    const cmd = 'exit 1';
    await expect(run(cmd))
      .rejects
      .toBeDefined();
  });
});
