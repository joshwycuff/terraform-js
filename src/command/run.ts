import { spawn, StdioOptions } from 'child_process';
import exp from 'constants';
import { ExitCode, Hash } from '../interfaces/types';
import { log } from '../logging/logging';

/**
 * @param env
 * @param arg
 */
function expand(env: Hash, arg: string): string {
    const ENV_VAR = /\${?(\w+)}?/;
    let expanded = arg;
    let match;
    do {
        match = ENV_VAR.exec(expanded);
        if (match) {
            expanded = expanded.replace(match[0], env[match[1]] || '');
        }
    } while (match);
    return expanded;
}

/**
 * Execute a command in a subprocess and return exit code.
 *
 * @param {string} command - The command to run.
 * @param {string[]} args - List of string arguments.
 * @param {string} cwd The current working directory of the child process.
 * @param {Hash} env - Environment variable key-value pairs.
 * @param stdio
 * @param handlers
 * @returns {ExitCode} The exit code of the subprocess.
 */
export async function run(
    command: string,
    args: string[] = [],
    cwd?: string,
    env?: Hash,
    stdio: StdioOptions = 'inherit',
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
        const child = spawn(command, expandedArgs, { cwd, env, stdio });
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
