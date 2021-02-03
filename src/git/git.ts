import { execute } from '../command/command';

/**
 *
 */
export async function getCommitId() {
    return (await execute('git', 'rev-parse HEAD')).trim();
}
