import { ISpec } from '../interfaces/spec';
import { specStack } from '../spec/specs';

/**
 * @param spec
 * @param func
 */
export async function withSpec<T>(spec: ISpec, func: () => T): Promise<T> {
  specStack.push(spec);
  const result = await func();
  specStack.pop();
  return result;
}
