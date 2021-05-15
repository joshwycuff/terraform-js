import { MergeStack } from '@joshwycuff/merge-stack';
import { cloneDeep, mergeWith } from 'lodash';
import { JSONObject } from '@joshwycuff/types';
import { IRootContext } from '../interfaces/context';
import { ISpec, ITarget } from '../interfaces/spec';
import { IConfig } from '../interfaces/config';
import { log } from '../logging/logging';
import { config } from '../config/config';
import { inDir } from '../utils/in-dir';

/**
 * @param objValue
 * @param srcValue
 * @param key
 * @param something
 */
// eslint-disable-next-line consistent-return,require-jsdoc
function customizer(objValue: any, srcValue: any, key: string, something: any): any {
  if (key === 'name') {
    return srcValue;
  }
  if (key === 'specpath') {
    return srcValue;
  }
  if (key === 'subprojects') {
    return srcValue;
  }
  if (key === 'targets') {
    const objClone = cloneDeep(objValue || {});
    const srcClone = cloneDeep(srcValue || {});
    for (const objKey of Object.keys(objValue || {})) {
      if (!(objKey in srcValue)) {
        delete objClone[objKey];
      }
    }
    mergeWith(objClone, srcClone, customizer);
    return objClone;
  }
  if (Array.isArray(objValue) || Array.isArray(srcValue)) {
    if (objValue === null || objValue === undefined) {
      return srcValue;
    }
    if (srcValue === null || srcValue === undefined) {
      return objValue;
    }
    if (!Array.isArray(objValue)) {
      return [objValue].concat(srcValue);
    }
    if (!Array.isArray(srcValue)) {
      return objValue.concat([srcValue]);
    }
    return objValue.concat(srcValue);
  }
}

const CONTEXT: MergeStack<IRootContext> = new MergeStack<IRootContext>({}, customizer);

/**
 * @param contexts
 * @param func
 */
export async function withContexts<T extends IRootContext>(
  contexts: T[],
  func: (context: T) => Promise<void>,
): Promise<void> {
  for (const context of contexts) {
    CONTEXT.push(context);
  }
  const context = CONTEXT.peek();
  if ('conf' in context) {
    config.push(context.conf as IConfig);
  }
  const dirpath = (
    context && context.spec && (context.spec as JSONObject).dirpath) as string || process.cwd();
  await inDir(dirpath, async () => {
    await func(CONTEXT.peek() as T);
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const cntxt of contexts) {
    CONTEXT.pop();
  }
  config.pop();
}

/**
 * @param specs
 * @param func
 */
export async function withSpecs<T extends IRootContext>(
  specs: ISpec[],
  func: (context: T) => Promise<void>,
): Promise<void> {
  const contexts: T[] = specs.map((spec) => ({ spec, conf: spec.config }) as unknown as T);
  await withContexts<T>(contexts, func);
}

/**
 * @param specpath
 * @param func
 */
export async function withSpecPath<T extends IRootContext>(
  specpath: string[],
  func: (context: T) => Promise<void>,
): Promise<void> {
  log.silly(`with spec path "${specpath.join('/')}"`);
  const contexts: T[] = [{ specpath } as unknown as T];
  await withContexts<T>(contexts, func);
}

/**
 * @param configs
 * @param func
 */
export async function withConfigs<T extends IRootContext>(
  configs: IConfig[],
  func: (context: T) => Promise<void>,
): Promise<void> {
  const contexts: T[] = configs.map((conf) => ({ conf }) as unknown as T);
  await withContexts<T>(contexts, func);
}

/**
 * @param target
 * @param func
 */
export async function withTarget<T extends IRootContext>(
  target: ITarget,
  func: (context: T) => Promise<void>,
): Promise<void> {
  const targetCopy = cloneDeep(target) as any;
  delete targetCopy.name;
  await withSpecs<T>([targetCopy as unknown as ISpec], async () => {
    await withContexts<T>([{ target } as unknown as T], func);
  });
}
