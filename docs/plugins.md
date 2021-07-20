# Terrascript Plugins

| Default plugins |
| --- |
| [@joshwycuff/terrascript-plugin-aliases](../packages/terrascript-plugin-aliases/README.md)
| [@joshwycuff/terrascript-plugin-template-expressions](../packages/terrascript-plugin-template-expressions/README.md)
| [@joshwycuff/terrascript-plugin-groups](../packages/terrascript-plugin-groups/README.md)
| [@joshwycuff/terrascript-plugin-modules](../packages/terrascript-plugin-modules/README.md)

Additional plugins maintained in this repository include:

| Additional plugins |
| --- |
| [@joshwycuff/terrascript-plugin-git](../packages/terrascript-plugin-git/README.md)
| [@joshwycuff/terrascript-plugin-aws-cli](../packages/terrascript-plugin-aws-cli/README.md)
| [@joshwycuff/terrascript-plugin-aws-secrets](../packages/terrascript-plugin-aws-secrets/README.md)
| [@joshwycuff/terrascript-plugin-terraform](../packages/terrascript-plugin-terraform/README.md)
| [@joshwycuff/terrascript-plugin-iamlive](../packages/terrascript-plugin-iamlive/README.md)

To install all non-default plugins:

```bash
npm install \
  @joshwycuff/terrascript-plugin-git \
  @joshwycuff/terrascript-plugin-aws-cli \
  @joshwycuff/terrascript-plugin-aws-secrets \
  @joshwycuff/terrascript-plugin-terraform \
  @joshwycuff/terrascript-plugin-iamlive \
  --save-dev
```

```bash
yarn add \
  @joshwycuff/terrascript-plugin-git \
  @joshwycuff/terrascript-plugin-aws-cli \
  @joshwycuff/terrascript-plugin-aws-secrets \
  @joshwycuff/terrascript-plugin-terraform \
  @joshwycuff/terrascript-plugin-iamlive \
  --dev
```

If the plugins above were included in a `terrascript.yml`, it would look like the following:

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-git"
  - "@joshwycuff/terrascript-plugin-aws-cli"
  - "@joshwycuff/terrascript-plugin-aws-secrets"
  - "@joshwycuff/terrascript-plugin-terraform"
  - "@joshwycuff/terrascript-plugin-iamlive"
```

## Developing a plugin

TODO
