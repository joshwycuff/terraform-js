#!/usr/bin/env node

import { run } from './commands/terrascript';
import { log } from '../logging';
import { init } from './commands/init';
import Process from '../utils/process';

/**
 *
 */
async function help() {
  console.log('Terrascript');
  console.log('');
  console.log('terrascript TARGET_PATH COMMAND [...ARGS]');
}

/**
 * @param re
 * @param arr
 */
function reIndexOf(re: RegExp, arr: string[]): number {
  for (const [i, element] of arr.entries()) {
    if (element.match(re)) {
      return i;
    }
  }
  return -1;
}

/**
 *
 */
export async function main() {
  try {
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    const [, , ...cliArgs] = Process.argv();
    const index = reIndexOf(/^[^-].*/, cliArgs);
    const targetPathString = cliArgs[index];
    if (targetPathString === undefined) {
      await help();
      process.exit(1);
    }
    if (['help', '-h', '--help'].some((h) => process.argv.includes(h))) {
      await help();
      process.exit(1);
    }
    const cmd = cliArgs[index + 1];
    const args = cliArgs.slice(index + 2);
    await run(targetPathString, cmd, args);
  } catch (error) {
    log.error(error);
    log.error(error.stack);
    process.exit(1);
  }
}

main();
