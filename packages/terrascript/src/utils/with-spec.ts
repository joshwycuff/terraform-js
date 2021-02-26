import { ISpec } from '../interfaces/spec';
import { SPEC_STACK } from '../spec/specs';

/**
 * @param spec
 * @param func
 */
export async function withSpec<T>(spec: ISpec, func: () => T): Promise<T> {
    SPEC_STACK.push(spec);
    const result = await func();
    SPEC_STACK.pop();
    return result;
}
