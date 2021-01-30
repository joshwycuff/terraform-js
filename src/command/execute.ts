import { exec } from 'child_process';

/**
 * @param command
 * @param cwd
 * @param env
 */
export async function execute(
    command: string,
    cwd?: string,
    env?: { [key: string]: string },
): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { cwd, env }, (error, stdout, stderr) => {
            if (error === null) {
                resolve(stdout);
            } else {
                console.error(stderr);
                reject(stderr);
            }
        });
    });
}
