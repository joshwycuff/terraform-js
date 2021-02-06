import { exec } from 'child_process';
import { Hash } from '../interfaces/types';
import { log } from '../logging/logging';

/**
 * @param command
 * @param cwd
 * @param env
 */
export async function execute(
    command: string,
    cwd?: string,
    env?: Hash,
): Promise<string> {
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
