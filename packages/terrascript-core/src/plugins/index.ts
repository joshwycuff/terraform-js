import { Maybe } from 'maybe-optional';
import { Hash } from '@joshwycuff/types';
import { TerrascriptPlugin, TerrascriptPluginApi } from '../interfaces/plugin';
import { log } from '../logging/logging';
import { IActionContext } from '../interfaces/context';

const _plugins: Hash<TerrascriptPlugin> = {};

/**
 * @param pluginName
 * @param promise
 */
// eslint-disable-next-line max-len,require-jsdoc
function timeout(pluginName: string, promise: Promise<TerrascriptPlugin>): Promise<TerrascriptPlugin> {
  return new Promise((resolve) => {
    setTimeout(() => {
      log.error(`Loading of plugin "${pluginName}" timed out.`);
      process.exit(1);
    }, 5000);
    promise.then((plugin) => resolve(plugin));
  });
}

/**
 * @param pluginName
 */
async function loadPlugin(pluginName: string): Promise<void> {
  log.info(`Loading plugin "${pluginName}"`);
  const plugin = (await import(pluginName)).default as TerrascriptPlugin;
  _plugins[pluginName] = plugin;
}

/**
 * @param pluginNames
 */
export async function loadPlugins(pluginNames: string[]): Promise<void> {
  const promises: Promise<void>[] = pluginNames.map((name) => loadPlugin(name));
  await Promise.all(promises);
}

/**
 * @param functionName
 */
export function getPluginsWithFunction(functionName: TerrascriptPluginApi): TerrascriptPlugin[] {
  return Object.values(_plugins)
    .filter((plugin) => functionName in plugin);
}

/**
 * @param functionName
 */
export function getPluginFunctions<T>(
  functionName: TerrascriptPluginApi,
): Array<(context: T) => Promise<void>> {
  // eslint-disable-next-line max-len
  return getPluginsWithFunction(functionName)
    .map((plugin) => plugin[functionName] as unknown as (context: T) => Promise<void>);
}

/**
 * @param context
 * @param functionName
 */
export async function runPluginFunctions<T>(
  context: T,
  functionName: TerrascriptPluginApi,
): Promise<void> {
  for (const [pluginName, plugin] of Object.entries(_plugins)) {
    if (Object.getOwnPropertyNames(plugin).includes(functionName)) {
      log.debug(`Running "${pluginName}" "${functionName}"`);
      const func = plugin[functionName] as unknown as (c: T) => Promise<void>;
      await func(context);
    }
  }
}

/**
 * @param context
 */
export async function getPluginForAction(
  context: IActionContext,
): Promise<Maybe<TerrascriptPlugin>> {
  for (const plugin of getPluginsWithFunction(TerrascriptPluginApi.isPluginAction)) {
    const isPluginAction = await plugin.isPluginAction?.(context);
    if (isPluginAction) {
      return plugin;
    }
  }
  return null;
}
