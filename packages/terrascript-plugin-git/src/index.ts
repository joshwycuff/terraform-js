import { execute } from '@joshwycuff/command';
import { ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';
import { Hash, JSONObject } from '@joshwycuff/types';
import { log } from './logging';

/* eslint-disable no-param-reassign */

const COMMANDS_TO_VARIABLES = {
  GIT_BRANCH: 'git rev-parse --abbrev-ref HEAD',
  GIT_COMMIT_ID: 'git log --format="%H" -n 1',
};

// eslint-disable-next-line @typescript-eslint/naming-convention
interface iGit extends JSONObject {
  env: Hash<string>
}

export default class GitPlugin implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    const env = (spec?.git as iGit)?.env || {} as Hash<string>;
    const promises = [];
    for (const [name, command] of Object.entries(COMMANDS_TO_VARIABLES)) {
      promises.push(GitPlugin.getAndSetGitVariable(spec, name, command));
    }
    for (const [name, command] of Object.entries(env)) {
      promises.push(GitPlugin.getAndSetGitVariable(spec, name, command));
    }
    await Promise.all(promises);
  }

  private static async getAndSetGitVariable(
    spec: ISpec,
    name: string,
    command: string,
  ): Promise<void> {
    log.silly(`Setting result of command "${command}" to environment variable ${name}`);
    const value = (await execute(command)).trim();
    spec.config.env[name] = value;
  }
}
