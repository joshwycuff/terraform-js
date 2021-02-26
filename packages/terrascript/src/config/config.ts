import { merge } from 'lodash';
import path from 'path';
import { _IConfig, IConfig } from '../interfaces/config';
import { TERRASCRIPT_RC, TERRASCRIPT_RC_JS } from '../constants';
import { log, updateLogLevel } from '../logging/logging';
import { MergeStack } from '../utils/merge-stack';
import { searchUp } from '../utils/search-up';

export const config: _IConfig = {
    infrastructureDirectory: process.cwd(),
    tmpDirectory: '',
    command: {
        path: '',
        name: 'terraform',
    },
    env: {},
    tfVars: {},
    tfVarsFiles: [],
    autoApprove: false,
    autoApproveApply: false,
    autoApproveDestroy: false,
    backendConfig: {},
    backendConfigFile: '',
    logging: {
        level: 'warn',
    },
    gitCommitIdEnvVar: 'TF_VAR_GIT_COMMIT_ID',
    onSubprojectNotFound: 'warn',
    onTargetNotFound: 'warn',
};

export const CONFIG_STACK = new MergeStack<IConfig>(config);

/**
 *
 */
function setTop() {
    const top = CONFIG_STACK.peek();
    Object.assign(config, top);
    for (const key of Object.keys(config)) {
        if (!(key in top)) {
            delete config[key];
        }
    }
    updateLogLevel(config.logging.level);
}

/**
 * @param config
 * @param inputConfig
 */
export async function pushConfig(inputConfig: IConfig) {
    CONFIG_STACK.push(inputConfig);
    setTop();
}

/**
 *
 */
export async function popConfig() {
    if (CONFIG_STACK.length > 1) {
        CONFIG_STACK.pop();
        setTop();
    }
}

/**
 * @param config
 * @param inputConfig
 */
export function updateConfig(inputConfig: IConfig) {
    const conf = CONFIG_STACK.peek();
    merge(conf, inputConfig);
    setTop();
}

/**
 *
 */
async function getRcConfig(): Promise<IConfig> {
    const rcfile = await searchUp(TERRASCRIPT_RC_JS);
    if (rcfile) {
        const rcdir = path.dirname(rcfile);
        try {
            // eslint-disable-next-line global-require,import/no-dynamic-require
            return require(path.join(rcdir, TERRASCRIPT_RC));
        } catch (error) {
            log.error(error);
            log.error(error.stack);
            process.exit(1);
        }
    }
    return {};
}

/**
 *
 */
export async function pushRcConfig() {
    await pushConfig(await getRcConfig());
}

pushRcConfig();
