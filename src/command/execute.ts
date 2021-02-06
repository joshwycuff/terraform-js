import { exec } from 'child_process';
import { Hash } from '../interfaces/types';
import { log } from '../logging/logging';

/**
 * Execute a command in a subprocess and return the stdout.
 *
 * @param {string} command - Command to run with space-separated arguments.
 * @param {string} cwd - Current working directory of the child process.
 * @param {Hash} env - Environment variable key-value pairs.
 * @returns {Promise<string>} The stdout of the subprocess.
 */
export async function execute(command: string, cwd?: string, env?: Hash): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { cwd, env }, (error, stdout, stderr) => {
            if (error === null) {
                resolve(stdout);
            } else {
                log.error(stderr);
                reject(stderr);
            }
        });
    });
}
