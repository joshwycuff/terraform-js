import { JSONObject } from '@joshwycuff/types';
import { ISpec, TerrascriptPlugin } from '@joshwycuff/terrascript-core';
import { log } from './logging';

/* eslint-disable no-param-reassign */

const AWS_PROFILE = 'AWS_PROFILE';
const AWS_DEFAULT_REGION = 'AWS_DEFAULT_REGION';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface iAws extends JSONObject {
  profile: string
  defaultRegion: string
}

export default class AwsCli implements TerrascriptPlugin {
  static async compile(spec: ISpec): Promise<void> {
    spec.aws = spec.aws || {};
    if ((spec.aws as iAws).profile) {
      spec.config.env[AWS_PROFILE] = (spec.aws as iAws).profile;
    }
    if ((spec.aws as iAws).defaultRegion) {
      spec.config.env[AWS_DEFAULT_REGION] = (spec.aws as iAws).defaultRegion;
    }
  }
}
