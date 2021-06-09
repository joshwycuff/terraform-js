import { isMatch } from 'micromatch';
import { Specs } from '../spec/specs';
import { SUBPROJECT_HIERARCHICAL_DELIMITER } from '../constants';

export class TargetPath {
  static D = SUBPROJECT_HIERARCHICAL_DELIMITER;

  static NULL_TARGET = '!';

  static isMatch(specpath: string[], str: string): boolean {
    const pattern = specpath[0];
    return isMatch(str, pattern);
  }

  static next(targetPath: string[]): string[] {
    if (targetPath.length > 1) {
      return targetPath.slice(1);
    }
    return targetPath.slice(0);
  }

  static getTarget(specpath: string[]): string {
    return specpath.slice(-1)[0];
  }

  static setTarget(specpath: string[], target: string) {
    // eslint-disable-next-line no-param-reassign
    specpath[specpath.length - 1] = target;
  }

  static isNullTarget(targetPath: string[]): boolean {
    return TargetPath.getTarget(targetPath) === TargetPath.NULL_TARGET;
  }

  static resolve(specs: Specs, targetPathString: string): string {
    if (targetPathString === '') {
      throw new Error('Target path cannot be empty');
    }
    const parts = targetPathString.split(TargetPath.D);
    if (parts[0] === '') {
      return `${specs.main.name}${targetPathString}`;
    }
    if (parts[0] in specs.nodes) {
      let node = specs.nodes[parts[0]];
      const parents = [];
      // eslint-disable-next-line no-constant-condition
      while (node.name !== specs.main.name) {
        parents.push(node.parent!.name);
        node = node.parent!;
      }
      parents.reverse();
      return parents.concat(parts).join(TargetPath.D);
    }
    return targetPathString;
  }

  static string_to_array(targetPathString:string):string[] {
    return targetPathString.split(TargetPath.D);
  }
}
