import { Run } from '../../terrascript/run';
import { buildSpecs, SPEC, SPEC_STACK } from '../../spec/specs';
import { curryContext, withContexts } from '../../utils/withs';
import { withSpec } from '../../utils/with-spec';

/**
 * @param specPath
 * @param cmd
 * @param args
 */
export async function runTerrascript(specPath: string, cmd: string, args: string[]) {
    let normalizedSpecPath = specPath;
    if (normalizedSpecPath.startsWith('*/')) {
        // do nothing
    } else if (normalizedSpecPath.startsWith('./')) {
        normalizedSpecPath = `*${normalizedSpecPath.slice(1)}`;
    } else if (normalizedSpecPath.startsWith('/')) {
        normalizedSpecPath = `*${normalizedSpecPath}`;
    } else {
        normalizedSpecPath = `*/${normalizedSpecPath}`;
    }
    const specs = await buildSpecs();
    const rootContexts = specs.rootPath.map((s) => curryContext(withSpec, s));
    await withContexts(rootContexts, async () => {
        await withSpec(specs.main, async () => {
            const spec = SPEC();
            await Run.runSpec(spec, normalizedSpecPath, cmd, args);
        });
    });
}
