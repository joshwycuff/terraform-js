import { execute } from '../command/command';

/**
 *
 */
export async function getCommitId() {
    return execute('git', 'rev-parse HEAD');
}
