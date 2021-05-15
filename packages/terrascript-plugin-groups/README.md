# terrascript-plugin-groups

Terrascript plugin which implements the groups functionality.

## Install

This plugin comes with any installation of Terrascript as a dependency.

## Usage

Define groups under the `groups` key in a `terrascript.yml` configuration file. The
`terrascript.yml` in which a group is defined as well as any child subprojects can use the group.

```yaml
groups:
  both:
    - prod
    - dev
targets:
  prod:
  dev:
```

Both the prod and dev targets can then be run by referencing the group, both.

```bash
terrascript both echo running
```
