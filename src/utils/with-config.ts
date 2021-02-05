import { IConfig } from '../interfaces/config';
import { popConfig, pushConfig } from '../config/config';

/**
 * @param conf
 * @param func
 */
export async function withConfig<T>(conf: IConfig, func: () => T): Promise<T> {
    pushConfig(conf);
    const result = await func();
    popConfig();
    return result;
}
