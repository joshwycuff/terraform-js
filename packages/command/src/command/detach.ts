import { spawn, StdioOptions } from 'child_process';
import { Hash } from '@joshwycuff/types';
import { ExitCode } from './types';
import { log } from './logging';
import { expand } from './expand';

/**
 * Execute a command in the background and return exit code.
 *
 * @param {string} command - The command to run.
 * @param {string[]} args - List of string arguments.
 * @param {string} cwd The current working directory of the child process.
 * @param {Hash} env - Environment variable key-value pairs.
 * @param stdio
 * @param handlers
 * @returns {ExitCode} The exit code of the subprocess.
 */
export async function detach(
  command: string,
  args: string[] = [],
  cwd?: string,
  env?: Hash,
  stdio: StdioOptions = 'ignore',
  handlers: Hash<Hash<any>> = {},
): Promise<ExitCode> {
  log.silly(
    JSON.stringify({
      command,
      args,
      cwd,
    }),
  );
  return new Promise((resolve, reject) => {
    // workaround to expand environment variables
    const expandedArgs = args.map((a) => expand(env || (process.env as Hash), a));
    const child = spawn(command, expandedArgs, {
      cwd,
      env,
      stdio,
      detached: true,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        log.warn(`'${command} ${args.join(' ')}' returned non-zero exit code: ${code}`);
        reject(code);
      }
    });
    child.on('error', (err: Error) => {
      log.error(`'${command} ${args.join(' ')}' errored: ${err}`);
      reject(err);
    });
    for (const event of Object.keys(handlers.stdout || {})) {
      child.stdout?.on(event, handlers.stdout[event]);
    }
  });
}
