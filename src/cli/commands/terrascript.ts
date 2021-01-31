import { run } from '../../terrascript/run';

/**
 * @param group
 * @param cmd
 * @param args
 */
export async function runTerrascript(group: string, cmd: string, args: string[]) {
    await run(group, cmd, args);
}
