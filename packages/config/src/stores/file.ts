import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import _ from 'lodash';

import { JSONObject } from '@joshwycuff/types';
import { updateConfigFromObject } from './object';

/**
 * @param config
 * @param filepath
 */
function getConfigFromJs(config: JSONObject, filepath: string) {
  const absPath = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath);
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require,import/no-dynamic-require
  const jsConfig = require(absPath);
  return jsConfig;
}

/**
 * @param config
 * @param filepath
 */
async function getConfigFromJson(config: JSONObject, filepath: string) {
  const content = (await fs.readFileSync(filepath)).toString();
  const jsonConfig = JSON.parse(content);
  return jsonConfig;
}

/**
 * @param config
 * @param filepath
 */
async function getConfigFromYaml(config: JSONObject, filepath: string) {
  const content = (await fs.readFileSync(filepath)).toString();
  const yamlConfig = yaml.load(content);
  return yamlConfig;
}

/**
 * @param namespace
 * @param config
 * @param filepath
 * @param customizer
 */
export async function updateConfigFromFile(
  namespace: string,
  config: JSONObject,
  filepath: string,
  customizer?: _.MergeWithCustomizer,
): Promise<void> {
  let fileConfig;
  const ext = path.extname(filepath);
  if (ext === '.js') {
    fileConfig = getConfigFromJs(config, filepath);
  } else if (ext === '.json') {
    fileConfig = await getConfigFromJson(config, filepath);
  } else if (ext === '.yaml' || ext === '.yml') {
    fileConfig = await getConfigFromYaml(config, filepath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
  updateConfigFromObject(namespace, config, fileConfig, customizer);
}
