import {
  ISpec,
  ISubprojectContext,
  TargetPath,
  TerrascriptPlugin,
} from '@joshwycuff/terrascript-core';

import { Hash } from '@joshwycuff/types';
import { log } from './logging';

/* eslint-disable no-param-reassign */

type IGroups = Hash<string[]>;

export default class Groups implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    spec.groups = spec.groups || {} as unknown as IGroups;
  }

  static async beforeSubproject(context: ISubprojectContext): Promise<void> {
    const groups = context.spec.groups as IGroups;
    const groupNames = Object.keys(groups);
    const target = TargetPath.getTarget(context.targetPath);
    if (groupNames.includes(target)) {
      const group = groups[target];
      const targetsGlobPattern = `{${group.join(',')}}`;
      log.debug(`Expanding group "${target}" to glob pattern: "${targetsGlobPattern}"`);
      TargetPath.setTarget(context.targetPath, targetsGlobPattern);
    }
  }
}
