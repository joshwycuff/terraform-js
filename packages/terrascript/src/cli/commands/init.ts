import fs from 'fs';
import jsyaml from 'js-yaml';
import glob from 'glob';
import path from 'path';
import { log } from '../../logging';

/**
 * @param filepath
 * @param data
 */
async function tryWriteFile(filepath: string, data: string) {
  try {
    await fs.writeFileSync(filepath, data, { flag: 'wx' });
  } catch (error) {
    log.info(error);
  }
}

/**
 *
 */
async function initRcFile() {
  await tryWriteFile('.terrascriptrc.js', 'module.exports = {}');
}

/**
 *
 */
async function findInfrastructureDirectory(): Promise<string> {
  return new Promise((resolve, reject) => {
    glob('**/main.tf', {}, (error, files) => {
      if (error) {
        reject(error);
      }
      if (files.length === 0) {
        resolve('');
      } else {
        resolve(path.dirname(files[0]));
      }
    });
  });
}

/**
 *
 */
export async function initYmlFile() {
  const infrastructureDirectory = await findInfrastructureDirectory() || '.';
  const data = {
    config: { infrastructureDirectory },
    groups: { all: ['prod', 'dev'] },
    hooks: {},
    modules: {},
    scripts: {},
    targets: {
      prod: {},
      dev: {},
    },
  };
  const yml = jsyaml.dump(data).replace(/{}/g, '');
  await tryWriteFile('terrascript.yml', yml);
}

/**
 *
 */
export async function init() {
  await initRcFile();
  await initYmlFile();
}
