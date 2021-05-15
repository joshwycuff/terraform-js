import { main } from '../cli/cli';

const mock = jest.mock('../utils/process', () => ({
  argv: jest.fn().mockReturnValue(['', '', 'example', 'hello']),
}));

describe('run', () => {
  test('run', async () => {
    process.chdir('.ignore');
    console.log(process.cwd());
    await main();
  });
});
