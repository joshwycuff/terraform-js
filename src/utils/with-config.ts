import { IConfig } from '../interfaces/config';
import { popConfig, pushConfig } from '../config/config';

/**
 * Context function to push conf before running given function and pop conf after
 *
 * @param {IConfig} conf - The configuration to push.
 * @param {() => T} func - A function to run which requires no inputs.
 * @returns {T} The output of the given function.
 */
export async function withConfig<T>(conf: IConfig, func: () => T): Promise<T> {
    pushConfig(conf);
    const result = await func();
    popConfig();
    return result;
}
