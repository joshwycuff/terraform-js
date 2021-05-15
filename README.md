# Terrascript

A tool to augment CLI work in Node.js projects

[![npm version](https://badge.fury.io/js/%40joshwycuff%2Fterrascript.svg)](https://badge.fury.io/js/%40joshwycuff%2Fterrascript)
[![Actions Status](https://github.com/joshwycuff/terrascript/workflows/build/badge.svg)](https://github.com/joshwycuff/terrascript/actions)

- [About](#about)
- [Install](#install)
- [Usage](#usage)
  * [CLI](#cli)
    + [Configuration file](#configuration-file)
    + [Name](#name)
    + [Targets](#targets)
    + [Groups](#groups)
    + [Config](#config)
    + [Aliasing](#aliasing)
    + [Actions](#actions)
    + [Template Expressions](#template-expressions)
    + [Hooks](#hooks)
    + [Modules](#modules)
    + [Special Terraform support](#special-terraform-support)
    + [Subprojects](#subprojects)
    + [Inheritance](#inheritance)
- [Concepts](#concepts)  
- [Configuration](#configuration)  
- [Plugins](#plugins)  

## About

Terrascript is a tool to augment CLI work in Node.js projects by providing extensible functionality
with plugins which is configurable via YAML configuration files.

## Install

```bash
npm install @joshwycuff/terrascript --save-dev
```

```bash
yarn add @joshwycuff/terrascript --dev
```

## Usage

### CLI

Terrascript command-line arguments take the form:

```shell
terrascript TARGET_PATH COMMAND [ARGUMENTS...]
```

Terrascript should be run in the same directory as the top-level Terrascript yaml configuration file
(`terrascript.yml`).

## Concepts

#### Project

A Terrascript project consists of at least one directory containing a single `terrascript.yml`
configuration file. A project can have multiple directories with each of them having 0 or 1
`terrascript.yml` files except for the top level which must have 1. Lower-level directories
containing a `terrascript.yml` file are called sub-projects.

#### Spec

Once a `terrascript.yml` configuration file has been read and processed by Terrascript, internally,
Terrascript conceptualizes the resulting object as a `spec` (short for specification).

#### Action

Actions are commands, functions, or tasks to be run. They can be as simple as a single CLI command
or as complicated as a series of CLI commands, JavaScript functions, and plugin actions.

CLI commands can be run by Terrascript without codifying them in a `terrascript.yml`. Complicated
or common tasks can be codified in a `terrascript.yml`.

#### Target

All actions must be performed against a target and any desired targets must be defined in the
sub-project in which you want to perform actions against them. For example, common targets might be
environments such as prod and dev.

#### Hook

Hooks exist to perform additional actions at certain points in the execution of Terrascript such as
before anything at all has happened, before a target, before an action, or after everything has
executed successfully or unsuccessfully.

#### Context

Context is an object that is passed around in Terrascript containing information about the current
execution including the command-line inputs and specs among other things. It is possible to
manipulate the context for the purpose of additional functionality, which is how some plugins
work.

#### Inheritance

Sub-projects "inherit" configuration from parent projects but will also overwrite configuration
that they share.

## Configuration

#### Configuration file

A basic configuration file with empty keys looks like the following:
```yaml
plugins:
subprojects:
config:
groups:
targets:
actions:
hooks:
aliases:
```

Terrascript plugins which extend the capabilities of Terrascript usually use additional keys.

Note that nothing is stopping you from storing additional information in other keys. This can even
be useful when using [template expressions](#template-expressions).

##### Targets

A Terrascript command will not run if the `TARGET_PATH` does not resolve to a defined target in a
configuration file (with one exception).

Here's a config file with a single target named `dev`:
```yaml
targets:
  dev:
```

You can now run something like:
```shell
terrascript dev echo hello world
# hello world
```

You can also define multiple targets:
```yaml
targets:
  dev:
  prod:
```

Now you can run commands for either target, or you can use glob patterns to run multiple targets:
```shell
terrascript '*' pwd
# /Users/somebody/project
# /Users/somebody/project
```

##### Groups

You can also specify groups of targets:
```yaml
groups:
  both:
    - dev
    - prod
targets:
  dev:
  prod:
```

```shell
terrascript both pwd
# /Users/somebody/project
# /Users/somebody/project
```

Yeah, I know. These commands are not terribly useful yet. Hold on...

##### Config

You can use the config key to set environment variables.

```yaml
config:
  env:
    A_VAR: A_VAL
targets:
  dev:
```

```shell
terrascript dev echo '$A_VAR'
# A_VAL
```

You can also override the top-level config with target-level configs.

```yaml
config:
  env:
    A_VAR: A_VAL
targets:
  dev:
    config:
      env:
        A_VAR: overridden
```

```shell
terrascript dev echo '$A_VAR'
# overridden
```

Note that the single quotes are necessary so that the variable is not expanded before being passed
into Terrascript.

##### Aliasing

If you have something in your config file that needs to be in several places, you can use
aliasing. Alias definitions are found under the `aliases` key and must begin with "@".

```yaml
config:
  env:
    VAR1: "@VAL"
    VAR2: "@VAL"
targets:
  dev:
aliases:
  VAL: stuffidontwanttorepeat
```

```shell
terrascript dev echo '$VAR1'
# stuffidontwanttorepeat
```

Aliasing is a simple way to make DRY config files. However, it is limited. Subprojects cannot "see"
alias definitions of parent projects. You also can't combine or perform any logic with aliases. For
anything that aliasing can't accomplish, you probably need to go with
[template expressions](#template-expressions).

##### Actions

If you have a set of commands that you run often, you can create an action for them.

```yaml
targets:
  dev:
actions:
  things:
    - echo thing 1
    - echo thing 2
```

```shell
terrascript dev things
# thing 1
# thing 2
```

##### Template Expressions

You can use template expressions to access various available variables within the current context
or even to run arbitrary JavaScript code.

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

Template expressions are evaluated dynamically at runtime and can access [inherited values](#inheritance).

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

##### Hooks

There are a number of special hooks that allow you to run actions before or after certain events.
Here they are in the order in which they run:
- `beforeAll`
- `beforeSubproject`
- `beforeTarget`
- `beforeAction`
- `afterAction`
- `afterTarget`
- `afterSubproject`
- `afterSuccess`
- `afterFailure`

Here's an example:
```yaml
targets:
  dev:
  prod:
hooks:
  beforeTarget:
    - echo do a thing beforeTarget
```

```shell
terrascript "*" echo '{{ target.name }}'
# do a thing beforeTarget
# dev
# do a thing beforeTarget
# prod
```

Plugins can even add custom hooks. See the [Terraform plugin](
packages/terrascript-plugin-terraform/README.md) for an example.

##### Modules

With modules, you can also run Javascript functions within actions. The function should take
a single input which is the `context` object. Modules that you want to import should look
like this:

```javascript
// scripts/mymodule.js
module.exports = {
    func: (context) => {
        console.log('running func')
        console.log(`I'm in ${context.target.name}`)
    }
}
```

You can import Javascript modules and run their exported functions in actions like so:

```yaml
targets:
  dev:
modules:
  mymodule: scripts/mymodule.js
actions:
  doathing:
    - mymodule.func
```

```shell
terrascript dev doathing
# running func
# I'm in dev
```

You can also modify the context.

```javascript
// scripts/mymodule.js
module.exports = {
    func: (context) => {
        console.log('running func')
        console.log('adding an environment variable to the config')
        context.conf.env.A_VAR = 'A_VAL'
    }
}
```

```yaml
targets:
  dev:
modules:
  mymodule: scripts/mymodule.js
scripts:
  doathing:
    - echo $A_VAR
    - mymodule.func
    - echo $A_VAR
```

```shell
terrascript dev doathing
#
# running func
# adding an environment variable to the config
# A_VAL
```

##### Subprojects

Let's say we have a project structure like this:

```
.
├── terrascript.yml
├── subproject1/
│   ├── terrascript.yml
│   └── ...
└── subproject2/
    ├── terrascript.yml
    └── ...
```

And the terrascript.yml files look like this:

```yaml
# ./terrascript.yml
subprojects:
  subproject1: ./subproject1/
  subproject2: ./subproject2/
```

```yaml
# ./subproject1/terrascript.yml
targets:
  dev:
  prod:
```

```yaml
# ./subproject2/terrascript.yml
targets:
  dev:
  prod:
```

To run the dev target for just subproject1:
```shell
terrascript subproject1/dev echo '{{ spec.name }} {{ target.name }}'
```

To run the dev target for all subprojects:
```shell
terrascript dev echo '{{ spec.name }} {{ target.name }}'
```

To run all targets for all subprojects:
```shell
terrascript "*" echo '{{ spec.name }} {{ target.name }}'
```

Note that since the top-level terrascript.yml does not contain any targets, these commands are not
run there. It simply passes the commands down to its subprojects.

Also note that glob patterns apply to both subprojects and targets.

##### Plugins

The optional `plugins` key contains a list of module names of plugins for Terrascript to import and
include in the execution of Terrascript actions. Some default Terrascript plugins are included
without needing them stated here. These include the plugins which implement the functionality for
aliases, groups, template-expressions, and modules.

For more information, see the [docs for plugins](docs/plugins.md).
