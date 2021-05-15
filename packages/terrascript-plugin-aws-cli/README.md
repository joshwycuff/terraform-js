# terrascript-plugin-aws-cli

Terrascript plugin to set AWS CLI environment variables.

## Install

```bash
npm install @joshwycuff/terrascript-plugin-aws-cli --save-dev
```

```bash
yarn add @joshwycuff/terrascript-plugin-aws-cli --dev
```

## Usage

Place the plugin name in the `plugins` key of the top-level `terrascript.yml`.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-aws-cli"
```

The plugin can be configured in a `terrascript.yml` configuration file under the `aws` key.

```yaml
aws:
  profile: example_aws_profile
  defaultRegion: example_aws_default_region
```

The given AWS profile and default region would then be set as the environment variables,
`AWS_PROFILE` and `AWS_DEFAULT_REGION`, respectively.
