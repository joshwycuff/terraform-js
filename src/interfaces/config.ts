// eslint-disable-next-line @typescript-eslint/naming-convention
import { Hash } from './types';

interface IEnv extends Hash<string | undefined> {
    TF_LOG?: string;
    TF_LOG_PATH?: string;
    TF_INPUT?: string;
    TF_CLI_ARGS?: string;
    TF_DATA_DIR?: string;
    TF_WORKSPACE?: string;
    TF_IN_AUTOMATION?: string;
    TF_REGISTRY_DISCOVERY_RETRY?: string;
    TF_REGISTRY_CLIENT_TIMEOUT?: string;
    TF_CLI_CONFIG_FILE?: string;
    TF_IGNORE?: string;
}

export interface _IConfig extends Hash<any> {
    infrastructureDirectory: string;
    workingDirectory: string;
    command: {
        path: string;
        name: string;
    };
    env: IEnv;
    autoApprove: boolean;
    backendConfig: Hash;
    backendConfigFile: string;
    logging: {
        level: 'silly' | 'debug' | 'info' | 'warning' | 'error';
    };
    commitId: string;
}

export interface IConfig extends Hash<any> {
    infrastructureDirectory?: string;
    workingDirectory?: string;
    command?: {
        path?: string;
        name?: string;
    };
    env?: IEnv;
    autoApprove?: boolean;
    backendConfig?: Hash;
    backendConfigFile?: string;
    logging?: {
        level?: 'silly' | 'debug' | 'info' | 'warning' | 'error';
    };
    commitId?: string;
}
