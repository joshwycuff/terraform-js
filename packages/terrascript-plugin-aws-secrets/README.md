# terrascript-plugin-aws-secrets

Terrascript Plugin to set AWS SecretsManager secrets as environment variables.

## Install

```bash
npm install @joshwycuff/terrascript-plugin-aws-secrets --save-dev
```

```bash
yarn add @joshwycuff/terrascript-plugin-aws-secrets --dev
```

## Usage

Place the plugin name in the `plugins` key of the top-level `terrascript.yml`.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-aws-secrets"
```

The plugin can be configured in a terrascript.yml configuration file. It will usually be used
in combination with [terrascript-plugin-aws-cli](../terrascript-plugin-aws-cli/README.md).

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-aws-cli"
  - "@joshwycuff/terrascript-plugin-aws-secrets"
aws:
  profile: example_aws_profile
  defaultRegion: example_aws_default_region
  secrets:
    - envName: EXAMPLE_ENVIRONMENT_VARIABLE_NAME
      secretName: example_aws_secretsmanager_secret_name
      # jsonKey: optional json key
      # versionStage: optional version stage
      # profile: optional AWS profile override
      # region: optional AWS region override
```

With this example, Terrascript will use the given AWS profile (example_aws_profile) and default
region (example_aws_default_region) to retrieve the secret (example_aws_secretsmanager_secret_name)
and set its value as an environment variable (EXAMPLE_ENVIRONMENT_VARIABLE_NAME).

Note that the `aws.profile` and `aws.defaultRegion` keys are actually part of the separate but
related Terrascript plugin, [terrascript-plugin-aws-cli](../terrascript-plugin-aws-cli/README.md).

If a secret is JSON-formatted and a particular key is desired, a configuration like the following
could be used:

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-aws-cli"
  - "@joshwycuff/terrascript-plugin-aws-secrets"
aws:
  profile: example_aws_profile
  defaultRegion: example_aws_default_region
  secrets:
    - envName: EXAMPLE_ENVIRONMENT_VARIABLE_NAME
      secretName: example_aws_secretsmanager_secret_name
      jsonKey: example_json_key
```

In a project with nested Terrascript subprojects, the AWS profile and default region information
can be set in a parent terrascript.yml. The child terrascript.yml would then look like the
following:

```yaml
aws:
  secrets:
    - envName: EXAMPLE_ENVIRONMENT_VARIABLE_NAME
      secretName: example_aws_secretsmanager_secret_name
```

## Configuration

| Option | Required | Description |
| --- | --- | --- |
| `envName` | Yes | The name of the environment variable for the secret value.
| `secretName` | Yes | The name of the AWS SecretsManager secret to be retrieved.
| `jsonKey` | No | An optional JSON key. If this is provided, the secret value will be JSON parsed before further retrieving the specified JSON key to be used as the secret value in the environment variable. |
| `versionStage` | No | Optional [staging label](https://docs.aws.amazon.com/secretsmanager/latest/userguide/terms-concepts.html) to use when retrieving secret.
| `profile` | No | Optional AWS profile override for when retrieving secrets from different accounts.
| `region` | No | Optional AWS region override for when retrieving secrets from different regions.
