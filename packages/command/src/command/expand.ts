import { Hash } from '@joshwycuff/types';

/**
 * @param env
 * @param arg
 */
export function expand(env: Hash, arg: string): string {
  const ENV_VAR = /\${?(\w+)}?/;
  let expanded = arg;
  let match;
  do {
    match = ENV_VAR.exec(expanded);
    if (match) {
      expanded = expanded.replace(match[0], env[match[1]] || '');
    }
  } while (match);
  return expanded;
}
