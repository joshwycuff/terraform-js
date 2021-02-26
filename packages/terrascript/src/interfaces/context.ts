import { Hash } from './types';
import { IConfig } from './config';
import { ISpec, ITarget } from './spec';
import { Terraform } from '../terraform/terraform';

export interface IContext extends Hash<any> {
    tf?: Terraform;
    conf: IConfig;
    spec: ISpec;
    target?: ITarget;
}
