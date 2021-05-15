# terrascript-plugin-template-expressions

Terrascript plugin which implements template expressions functionality. Template expressions allow
for more dynamic configurations in a `terrascript.yml` by allowing the referencing of various
available variables within the current context or even to run arbitrary JavaScript code.

## Install

This plugin comes with any installation of Terrascript as a dependency.

## Usage

The main available variable is called `context` whose main fields look like:
```typescript
interface Context {
  conf: IConfig;
  spec: ISpec;
  cmd: string;
  args: string[];
  target?: ITarget; // available in target hooks, action hooks, and actions
}
```

`conf` is the current config under which the given command/hook/script is being run.

`spec` is the yaml configuration (or specification) under which the given command/hook/script
is being run.

`cmd` and `args` are the command and arguments from the CLI input.

`target` is the current target.

Also, for convenience, `conf`, `spec`, and `target` are made directly available in templates.

Template expressions are evaluated dynamically at runtime and can access inherited values from
parent projects.

```yaml
name: project
target:
  dev:
scripts:
  things:
    - echo {{ spec.name }}
    - echo {{ target.name }}
    - echo {{ 1 + 1 }}
```

```shell
terrascript dev things
# project
# dev
# 2
```
