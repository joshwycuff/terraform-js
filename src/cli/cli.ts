#!/usr/bin/env node

import { runTerrascript } from './commands/terrascript';
import { log } from '../logging/logging';
import { init } from './commands/init';
import { buildSpecs, SPEC, SPEC_STACK } from '../spec/specs';

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
        if (group === undefined) {
            await help();
            process.exit(1);
        }
        if (['help', '-h', '--help'].some((h) => process.argv.includes(h))) {
            await help();
            process.exit(1);
        }
        if (group === '--init') {
            await init();
        } else {
            await runTerrascript(group, cmd, args);
        }
    } catch (error) {
        log.error(error);
        log.error(error.stack);
        process.exit(1);
    }
}

main();
