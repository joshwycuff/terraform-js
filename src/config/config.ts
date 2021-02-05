import { cloneDeep, merge } from 'lodash';
import path from 'path';
import fs from 'fs';
import { _IConfig, IConfig } from '../interfaces/config';
import { DOT_GIT, TERRASCRIPT_RC, TERRASCRIPT_RC_JS } from '../constants';
import { updateLogLevel } from '../logging/logging';
import { MergeStack } from '../utils/merge-stack';

export const config: _IConfig = {
    infrastructureDirectory: process.cwd(),
    tmpDirectory: '',
    command: {
        path: '',
        name: 'terraform',
    },
    env: {
        TF_LOG: '',
        TF_LOG_PATH: '',
        TF_INPUT: '',
        TF_CLI_ARGS: '',
        TF_DATA_DIR: '',
        TF_WORKSPACE: '',
        TF_IN_AUTOMATION: '',
        TF_REGISTRY_DISCOVERY_RETRY: '',
        TF_REGISTRY_CLIENT_TIMEOUT: '',
        TF_CLI_CONFIG_FILE: '',
        TF_IGNORE: '',
    },
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
    onWorkspaceNotFound: 'warn',
    workspacePrefix: '',
    workspaceSuffix: '',
};

const CONFIG_STACK = new MergeStack<IConfig>(config);

/**
 *
 */
function setTop() {
    Object.assign(config, CONFIG_STACK.peek());
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
    try {
        let dir = process.cwd();
        while (dir !== '/') {
            const filesAndFolders = await fs.readdirSync(dir);
            if (filesAndFolders.includes(TERRASCRIPT_RC_JS)) {
                break;
            }
            if (filesAndFolders.includes(DOT_GIT)) {
                break;
            }
            dir = path.dirname(dir);
        }
        // eslint-disable-next-line global-require,import/no-dynamic-require
        return require(path.join(dir, TERRASCRIPT_RC));
    } catch {
        return {};
    }
}

/**
 *
 */
export async function pushRcConfig() {
    await pushConfig(await getRcConfig());
}

pushRcConfig();
