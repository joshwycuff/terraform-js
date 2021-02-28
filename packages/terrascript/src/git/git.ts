import { execute } from '../../../command/src/command/command';

/**
 *
 */
export async function getCommitId() {
    return (await execute('git', 'rev-parse HEAD')).trim();
}
