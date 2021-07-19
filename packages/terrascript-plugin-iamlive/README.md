# terrascript-plugin-iamlive

Terrascript plugin which implements the aliasing functionality.

## Install

This plugin comes with any installation of Terrascript as a dependency.

## Usage

Define iamlive under the `iamlive` key in a `terrascript.yml` configuration file.

These iamlive can be referenced anywhere else in the same `terrascript.yml`.

```yaml
config:
  env:
    ENV_VAR_1: "@an_alias"
    ENV_VAR_2: "@an_alias"
iamlive:
  an_alias: value
```
