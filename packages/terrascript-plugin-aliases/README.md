# terrascript-plugin-aliases

Terrascript plugin which implements the aliasing functionality.

## Install

This plugin comes with any installation of Terrascript as a dependency.

## Usage

Define aliases under the `aliases` key in a `terrascript.yml` configuration file.

These aliases can be referenced anywhere else in the same `terrascript.yml`.

```yaml
config:
  env:
    ENV_VAR_1: "@an_alias"
    ENV_VAR_2: "@an_alias"
aliases:
  an_alias: value
```
