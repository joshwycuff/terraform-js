import { Hash } from './types';
import { IConfig } from './config';
import { ISpec } from './spec';
import { Terraform } from '../terraform/terraform';

export interface IContext extends Hash<any> {
    tf?: Terraform;
    config: IConfig;
    spec: ISpec;
    workspace?: string;
}
