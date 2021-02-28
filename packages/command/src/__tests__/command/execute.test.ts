import { execute } from '../../command/execute';

describe('execute', () => {
  it('should return stdout', async () => {
    const cmd = 'printf asdf';
    const result = await execute(cmd);
    expect(result)
      .toEqual('asdf');
  });

  it('should optionally take a cwd', async () => {
    const cmd = 'pwd';
    const cwd = '/';
    const result = await execute(cmd, cwd);
    expect(result)
      .toEqual('/\n');
  });

  it('should optionally take environment variables', async () => {
    const cmd = 'printf $testVar';
    const cwd = undefined;
    const env = { testVar: 'asdf' };
    const result = await execute(cmd, cwd, env);
    expect(result)
      .toEqual('asdf');
  });

  it('should reject when error', async () => {
    expect.assertions(1);
    const cmd = 'exit 1';
    await expect(execute(cmd))
      .rejects
      .toBeDefined();
  });
});
