#!/usr/bin/env node

import { runTerrascript } from './commands/terrascript';
import { log } from '../logging/logging';

/**
 *
 */
async function help() {
    console.log('Terrascript');
    console.log('');
    console.log('terrascript GROUP COMMAND [...ARGS]');
}

/**
 *
 */
async function main() {
    try {
        // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
        const [, , group, cmd, ...args] = process.argv;
        log.debug(`group: ${group}`);
        log.debug(`cmd: ${cmd}`);
        log.debug(`args: ${args}`);
        if (group === undefined) {
            await help();
            process.exit(1);
        }
        if (['help', '-h', '--help'].some((h) => process.argv.includes(h))) {
            await help();
            process.exit(1);
        }
        await runTerrascript(group, cmd, args);
    } catch (error) {
        log.error(error);
        log.error(error.stack);
        process.exit(1);
    }
}

main();
