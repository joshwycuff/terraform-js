import { cloneDeep, merge } from 'lodash';
import path from 'path';
import fs from 'fs';
import { _IConfig, IConfig } from '../interfaces/config';
import { DOT_GIT, TERRASCRIPT_RC, TERRASCRIPT_RC_JS } from '../constants';
import { updateLogLevel } from '../logging/logging';

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
    commitId: '',
    onSubprojectNotFound: 'warn',
    onWorkspaceNotFound: 'warn',
    workspacePrefix: '',
    workspaceSuffix: '',
};

const CONFIG_STACK = [cloneDeep(config)];

/**
 *
 */
function getTop(): _IConfig {
    return CONFIG_STACK.slice(-1)[0];
}

/**
 *
 */
function setTop() {
    Object.assign(config, getTop());
    updateLogLevel(config.logging.level);
}

/**
 * @param config
 * @param inputConfig
 */
export async function stackConfig(inputConfig: IConfig) {
    const currentConfig = cloneDeep(getTop());
    const stackedConfig = merge(currentConfig, cloneDeep(inputConfig));
    CONFIG_STACK.push(stackedConfig);
    setTop();
}

/**
 *
 */
export async function unstackConfig() {
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
    const currentConfig = cloneDeep(getTop());
    const updatedConfig = merge(currentConfig, cloneDeep(inputConfig));
    CONFIG_STACK[CONFIG_STACK.length - 1] = updatedConfig;
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
export async function stackRcConfig() {
    await stackConfig(await getRcConfig());
}

stackRcConfig();
