import { buildSpecs } from './spec/specs';
import { TargetPath } from './terrascript/target-path';
import { IContext } from './interfaces/context';
import { withConfigs, withContexts, withSpecs } from './terrascript/context';
import { TerrascriptRunner } from './terrascript/terrascript';
import { config, configReady } from './config/config';
import { log } from './logging/logging';

/**
 * @param targetPathString
 * @param cmd
 * @param args
 */
export async function run(targetPathString: string, cmd: string, args: string[]) {
  await configReady;
  log.debug(`TARGET_PATH: ${targetPathString}`);
  log.debug(`cmd: ${cmd}`);
  log.debug(`args: ${args}`);
  const specs = await buildSpecs();
  const targetPath = TargetPath.string_to_array(TargetPath.resolve(specs, targetPathString));
  log.silly(`resolved specpath: "${targetPath.join('/')}"`);
  await withConfigs([config.peek()], async () => {
    await withSpecs<IContext>(specs.rootPath.concat(specs.main), async () => {
      await withContexts<IContext>([{
        cmd,
        args,
        targetPath,
      } as unknown as IContext], async (context) => {
        await TerrascriptRunner.run(context);
      });
    });
  });
}
