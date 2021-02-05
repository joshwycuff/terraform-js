import { Run } from '../../terrascript/run';
import { buildSpecs, SPEC, SPEC_STACK } from '../../spec/specs';
import { curryWith, withContexts } from '../../utils/withs';
import { withSpec } from '../../utils/with-spec';
import { ISpec } from '../../interfaces/spec';

/**
 * @param specPath
 * @param cmd
 * @param args
 */
export async function runTerrascript(specPath: string, cmd: string, args: string[]) {
    let normalizedSpecPath = specPath;
    if (normalizedSpecPath.startsWith('*/')) {
        // do nothing
    } else if (normalizedSpecPath.startsWith('/')) {
        normalizedSpecPath = `*${normalizedSpecPath}`;
    } else {
        normalizedSpecPath = `*/${normalizedSpecPath}`;
    }
    const specs = await buildSpecs();
    for (const spec of specs.rootPath) {
        SPEC_STACK.push(spec);
    }
    SPEC_STACK.push(specs.main);
    const spec = SPEC();
    await Run.runSpec(spec, normalizedSpecPath, cmd, args);
}
