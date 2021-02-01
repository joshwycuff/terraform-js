import { cloneDeep, merge } from 'lodash';
import path from 'path';
import { _IConfig, IConfig } from '../interfaces/config';

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
}

/**
 * @param config
 * @param inputConfig
 */
export function stackConfig(inputConfig: IConfig) {
    const currentConfig = cloneDeep(getTop());
    const stackedConfig = merge(currentConfig, cloneDeep(inputConfig));
    CONFIG_STACK.push(stackedConfig);
    setTop();
}

/**
 *
 */
export function unstackConfig() {
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
function getRcConfig(): IConfig {
    try {
        const cwd = process.cwd();
        // eslint-disable-next-line global-require
        return require(path.join(cwd, '.terrascriptrc'));
    } catch {
        return {};
    }
}

stackConfig(getRcConfig());
