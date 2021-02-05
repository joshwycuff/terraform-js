import fs from 'fs';
import path from 'path';
import { Maybe } from 'maybe-optional';
import { DOT_GIT } from '../constants';

/**
 * @param startingDir
 * @param filename
 */
export async function searchUp(filename: string, startingDir?: string): Promise<Maybe<string>> {
    let dir = startingDir || process.cwd();
    while (dir !== '/') {
        let filesAndFolders: string[] = [];
        try {
            filesAndFolders = await fs.readdirSync(dir);
        } catch (error) {
            console.log(error);
        }
        if (filesAndFolders.includes(filename)) {
            return path.join(dir, filename);
        }
        if (filesAndFolders.includes(DOT_GIT)) {
            break;
        }
        dir = path.dirname(dir);
    }
    return null;
}
