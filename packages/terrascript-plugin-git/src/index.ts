import { execute } from '@joshwycuff/command';
import { ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';

/* eslint-disable no-param-reassign */

const COMMANDS_TO_VARIABLES = {
  GIT_BRANCH: 'git rev-parse --abbrev-ref HEAD',
  GIT_COMMIT_ID: 'git log --format="%H" -n 1',
  GIT_DESCRIBE: 'git describe --tags',
};

export default class GitPlugin implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    const promises = [];
    for (const [name, command] of Object.entries(COMMANDS_TO_VARIABLES)) {
      promises.push(GitPlugin.getAndSetGitVariable(spec, name, command));
    }
    await Promise.all(promises);
  }

  private static async getAndSetGitVariable(
    spec: ISpec,
    name: string,
    command: string,
  ): Promise<void> {
    const value = (await execute(command)).trim();
    spec.config.env[name] = value;
  }
}
