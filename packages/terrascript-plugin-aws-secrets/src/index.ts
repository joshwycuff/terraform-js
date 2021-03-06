import AWS from 'aws-sdk';

import { Hash, JSONObject } from '@joshwycuff/types';
import { IActionContext, TerrascriptPlugin } from '@joshwycuff/terrascript-core';
import { log } from './logging';

/* eslint-disable no-param-reassign */

interface iAwsSecret extends JSONObject {
  profile: string
  region: string
  envName: string
  secretName: string
  versionStage: string
  jsonKey: string
}

type iAwsSecrets = Hash<iAwsSecret>;

const cache: Hash<string> = {};

export default class AwsSecrets implements TerrascriptPlugin {
  static async beforeAction(context: IActionContext): Promise<void> {
    const { spec } = context;
    spec.aws = spec.aws || {};
    const aws = spec.aws as JSONObject;
    aws.secrets = aws.secrets || {} as iAwsSecrets;
    const promises = [];
    for (const [key, secret] of Object.entries(aws.secrets)) {
      promises.push(AwsSecrets.getAndSetSecretValue(context, key, secret));
    }
    await Promise.all(promises);
  }

  static async getAndSetSecretValue(context: IActionContext, key: string, secret: iAwsSecret) {
    const secretValue = await AwsSecrets.getSecretValue(context, secret);
    context.spec.config.env[secret.envName] = secretValue;
  }

  private static async getSecretValue(
    context: IActionContext,
    secret: iAwsSecret,
  ): Promise<string> {
    let secretString;
    if (AwsSecrets.isSecretCached(secret)) {
      secretString = cache[AwsSecrets.getSecretCacheName(secret)];
    } else {
      secretString = await AwsSecrets.getSecretValueFromAws(context, secret);
      cache[AwsSecrets.getSecretCacheName(secret)] = secretString;
    }
    if (secret.jsonKey) {
      secretString = JSON.parse(secretString)[secret.jsonKey];
    }
    return secretString;
  }

  private static async getSecretValueFromAws(
    context: IActionContext,
    secret: iAwsSecret,
  ): Promise<string> {
    const profile = secret.profile || context.spec.config.env.AWS_PROFILE;
    const region = secret.region || context.spec.config.env.AWS_DEFAULT_REGION;
    const credentials = new AWS.SharedIniFileCredentials({ profile });
    const sm = new AWS.SecretsManager({
      region,
      credentials,
    });
    const params = {
      SecretId: secret.secretName,
      VersionStage: secret.versionStage,
    };
    log.debug(`Getting AWS Secret: ${JSON.stringify(params, null, 2)}`);
    return (await sm.getSecretValue(params).promise()).SecretString as string;
  }

  private static isSecretCached(secret: iAwsSecret): boolean {
    const name = AwsSecrets.getSecretCacheName(secret);
    return name in cache;
  }

  private static getSecretCacheName(secret: iAwsSecret): string {
    const profile = secret.profile || '';
    const region = secret.region || '';
    const secretName = secret.secretName || '';
    const versionStage = secret.versionStage || '';
    return `${profile}|${region}|${secretName}|${versionStage}`;
  }
}
