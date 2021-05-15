import fs from 'fs';
import path from 'path';
import { Maybe } from 'maybe-optional';

/**
 * @param filename
 * @param startingDir
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
    if (filesAndFolders.includes('.git')) {
      break;
    }
    dir = path.dirname(dir);
  }
  return null;
}
