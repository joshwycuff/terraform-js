#!/usr/bin/env node

import { run } from './terrascript/run';
import { log } from './logging/logging';

/**
 *
 */
async function main() {
    try {
        // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
        const [, , group, cmd, ...args] = process.argv;
        await run(group, cmd, args);
    } catch (error) {
        log.error(error);
    }
}

main();
