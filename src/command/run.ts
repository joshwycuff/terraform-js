import { spawn } from 'child_process';
import { ExitCode } from '../interfaces/types';
import { log } from '../logging/logging';

/**
 * @param command
 * @param args
 * @param cwd
 * @param env
 * @param stdin
 */
export async function run(
    command: string,
    args: string[],
    cwd?: string,
    env?: { [key: string]: string },
): Promise<ExitCode> {
    log.silly(
        JSON.stringify({
            command,
            args,
            cwd,
        }),
    );
    const stdio = 'inherit';
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, env, stdio });
        child.on('exit', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                log.warn(`'${command} ${args.join(' ')}' returned non-zero exit code: ${code}`);
                reject(code);
            }
        });
    });
}
