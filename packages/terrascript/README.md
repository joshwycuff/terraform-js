# terrascript

JavsScript/TypeScript wrapper for running Terraform commands in NodeJS

[![npm version](https://badge.fury.io/js/%40joshwycuff%2Fterrascript.svg)](https://badge.fury.io/js/%40joshwycuff%2Fterrascript)
[![Actions Status](https://github.com/joshwycuff/terrascript/workflows/build/badge.svg)](https://github.com/joshwycuff/terrascript/actions)

- [What is Terrascript?](#what-is-terrascript)
- [Installation](#installation)
- [Usage](#usage)
  * [CLI](#cli)
    + [Configuration file](#configuration-file)
    + [Name](#name) 
    + [Targets](#targets) 
    + [Groups](#groups) 
    + [Config](#config) 
    + [Aliasing](#aliasing) 
    + [Scripts](#scripts)
    + [Templating](#template-expressions)
    + [Hooks](#hooks)
    + [Modules](#modules) 
    + [Special Terraform support](#special-terraform-support) 
    + [Subprojects](#subprojects) 
    + [Inheritance](#inheritance)

## What is Terrascript?

There are two parts to Terrascript. One is a JavaScript/TypeScript wrapper for running Terraform
commands in NodeJS. The other is a CLI which allows you to structure, organize, and automate
Terraform configurations and tasks.

## Installation

Using npm:

`npm install @joshwycuff/terrascript`

Using yarn:

`yarn add @joshwycuff/terrascript`

I also recommend using
[@jahed/terraform](https://www.npmjs.com/package/@jahed/terraform?activeTab=readme)
along with Terrascript.

## Usage

### CLI

Terrascript command-line arguments take the form:

```shell
terrascript TARGET_PATH COMMAND [ARGUMENTS...]
```

You can run any command you want via terrascript but there is special support for Terraform
commands.

Terrascript needs to be run in the same directory as a Terrascript yaml configuration file
(`terrascript.yml`).

#### Configuration file

A configuration file with every supported key and no values looks like the following:
```yaml
name:
subprojects:
config:
groups:
hooks:
modules:
scripts:
targets:
definitions:
```

Note that nothing is stopping you from storing additional information in other keys. This can even
be useful when using [template expressions](#template-expressions).

##### Name

The `name` key contains a string value. It is not required and will default to the name of the
directory the yaml file is in.

##### Targets

A Terrascript command will not run if the `TARGET_PATH` does not resolve to a defined target in the
configuration file.

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

You can also specify multiple targets:
```yaml
targets:
  dev:
  prod:
```

Now you can run commands for either target, or you can use glob patterns to run multiple targets:
```shell
terrascript "*" pwd
# /Users/somebody/project
# /Users/somebody/project
```

##### Groups

You can also specify groups of targets:
```yaml
groups:
  agroup:
    - dev
    - prod
targets:
  dev:
  prod:
```

```shell
terrascript agroup pwd
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

##### Aliasing

If you have something in your config file that needs to be in several places, you can use
aliasing. Alias definitions are found under the definitions key and must begin with "$".

```yaml
config:
  env:
    VAR1: $VAL
    VAR2: $VAL
targets:
  dev:
definitions:
  $VAL: stuffidontwanttorepeat
```

```shell
terrascript dev echo '$VAR1'
# stuffidontwanttorepeat
```

Aliasing is a simple way to make DRY config files. However, it is limited. Subprojects cannot "see"
alias definitions of parent projects. You also can't combine or perform any logic with aliases. For
anything that aliasing can't accomplish, you probably need to go with
[template expressions](#template-expressions).

##### Scripts

If you have a set of commands that you run often, you can create a script for them.

```yaml
targets:
  dev:
scripts:
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
or even to run arbitrary Javascript code.

The main available variable is called `context` which looks like this:
```typescript
export interface IContext extends Hash<any> {
    tf?: Terraform;
    conf: IConfig;
    spec: ISpec;
    target?: ITarget;
}
```

`tf` is an instance of Terraform. This is more useful in [module functions](#modules) than templates.

`conf` is the current config under which the given command/hook/script is being run.

`spec` is the yaml configuration (or specification) under which the given command/hook/script
is being run.

`target` is the current target.

`tf` and `target` may or may not be available depending on if you're accessing the context in a hook
and which hook it is. They're always available in a normal command or script, though.

Also, for convenience, `conf`, `spec`, and `target` are made available in templates.

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

There are a number of special hooks that allow you to run commands before or after certain
events. Here they are in the order in which they run:
- `beforeEachSubproject`
- `beforeEachTarget`
- `beforeEachScript`
- `beforeEachCommand`
- `beforeEachTerraform`
- `beforeEachTerraformApply`
- `beforeEachTerraformDestroy`
- `afterEachTerraformDestroy`
- `afterEachTerraformApply`
- `afterEachTerraform`
- `afterEachCommand`
- `afterEachScript`
- `afterEachTarget`
- `afterEachSubproject`

Here's an example:
```yaml
targets:
  dev:
  prod:
hooks:
  beforeEachTarget:
    - echo do a thing beforeEachTarget
```

```shell
terrascript "*" echo '{{ target.name }}'
# do a thing beforeEachTarget
# dev
# do a thing beforeEachTarget
# prod
```

##### Modules

With modules, you can also run Javascript functions within scripts. The function should take
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

You can import Javascript modules and run them in scripts like so:

```yaml
targets:
  dev:
modules:
  mymodule: scripts/mymodule.js
scripts:
  doathing:
    - function: mymodule.func
```

```shell
terrascript dev doathing
# running func
# I'm in dev
```

You can also modify the context which then propagates to downstream targets.

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
    - function: mymodule.func
    - echo $A_VAR
```

```shell
terrascript dev doathing
#
# running func
# adding an environment variable to the config
# A_VAL
```

##### Special Terraform support

Okay, so I want to do Terraform things...

Any Terraform subcommand can be run by just specifying the subcommand and its arguments. You don't
have to type terraform as part of the command.

```shell
terrascript dev init
terrascript dev plan
terrascript dev apply
```

This shorthand also extends to scripts.

```yaml
targets:
  dev:
scripts:
  build:
    - init
    - plan
    - apply
```

You can specify Terraform input variables in the config section.

```yaml
config:
  tfVars:
    environment: "{{ target.name }}"
targets:
  dev:
```

```shell
terrascript dev apply
# `terraform apply -var=environment=dev`
```

You can specify Terraform variable definitions (.tfvars) files in the config section as well.

```yaml
config:
  tfVarsFiles:
    - "tfvars/{{ target.name }}.tfvars"
targets:
  dev:
```

```shell
terrascript dev apply
# `terraform apply -var-file=tfvars/dev.tfvars`
```

Tired of typing `-auto-approve`?

```yaml
config:
  autoApprove: true
targets:
  dev:
```

```shell
terrascript dev apply
# `terraform apply -auto-approve`
```

Want to specify auto-approve for only apply or destroy commands?

```yaml
config:
  autoApproveApply: true
  autoApproveDestroy: true
targets:
  dev:
```

You can dynamically configure your remote backend in the config block.

```hcl
# main.tf
terraform {
    backend "s3" {}
}
```

```yaml
config:
  autoApprove: true
  backendConfig:
    profile: my-profile
    region: us-east-1
    bucket: my-remote-state-bucket
    key: "project/{{ target.name }}/terraform.tfstate"
    dynamodb_table: my-remote-state-lock-table
targets:
  dev:
  prod:
hooks:
  # This hook is useful when running multiple targets which have different backend configurations.
  beforeEachTarget: init -reconfigure
```

```shell
terrascript "*" apply
# `terraform init -reconfigure \
#     -backend-config=profile=my-profile \
#     -backend-config=region=us-east-1 \
#     -backend-config=bucket=my-remote-state-bucket \
#     -backend-config=key=project/dev/terraform.tfstate \
#     -backend-config=dynamodb_table=my-remote-state-lock-table`
# `terraform apply -auto-approve`
# `terraform init -reconfigure \
#     -backend-config=profile=my-profile \
#     -backend-config=region=us-east-1 \
#     -backend-config=bucket=my-remote-state-bucket \
#     -backend-config=key=project/prod/terraform.tfstate \
#     -backend-config=dynamodb_table=my-remote-state-lock-table`
# `terraform apply -auto-approve`
```

##### Subprojects

What if I have a bunch of Terraform projects?

Let's say we have a project structure like this:

```
.
├── terrascript.yml
└── infrastructure/
    ├── subproject1/
    │   ├── terrascript.yml
    │   ├── main.tf
    │   └── ...
    └── subproject2/
        ├── terrascript.yml
        ├── main.tf
        └── ...
```

And the terrascript.yml files look like this:

```yaml
# ./terrascript.yml
subprojects:
  subproject1: ./infrastructure/subproject1/
  subproject2: ./infrastructure/subproject2/
```

```yaml
# ./infrastructure/subproject1/terrascript.yml
targets:
  dev:
  prod:
```

```yaml
# ./infrastructure/subproject2/terrascript.yml
targets:
  dev:
  prod:
```

To run the dev target for just subproject1:
```shell
terrascript subproject1/dev apply
```

To run the dev target for all subprojects:
```shell
terrascript dev apply
```

To run all targets for all subprojects:
```shell
terrascript "*" apply
```

Note that since the top-level terrascript.yml does not contain any targets, these commands are not
run there. It simply passes the commands down to its subprojects.

Also note that glob patterns apply to both subprojects and targets.

##### Inheritance

Subprojects inherit yaml configuration from parent projects. This applies to every supported key
with the notable exceptions of `subprojects` and `targets`. This means that `backendConfig` (and
pretty much anything else) set in the top-level terrascript.yml file is also found in lower-level
subprojects at runtime. Values in subprojects override inherited values (just as target-level values
will override everything else).

Let's make a more complicated project.

```
.
├── terrascript.yml
└── infrastructure/
    ├── subproject1/
    │   ├── terrascript.yml
    │   ├── subproject1a/
    │   │   ├── terrascript.yml
    │   │   ├── main.tf
    │   │   └── ...
    │   └── subproject1b/
    │       ├── terrascript.yml
    │       ├── main.tf
    │       └── ...
    └── subproject2/
        ├── terrascript.yml
        ├── subproject2a/
        │   ├── terrascript.yml
        │   ├── main.tf
        │   └── ...
        └── subproject2b/
            ├── terrascript.yml
            ├── main.tf
            └── ...
```

The terrascript files might look something like:

```yaml
# ./terrascript.yml
# Note that the key below has no special significance to Terraform or Terrascript. It's simply a
# stored value that gets passed down via inheritance and is useful for templating (as you can see
# in the backend key below).
projectName: project
subprojects:
  subproject1: ./infrastructure/subproject1/
  subproject2: ./infrastructure/subproject2/
config:
  autoApprove: true
  backendConfig:
    profile: my-profile
    region: us-east-1
    bucket: my-remote-state-bucket
    # this key would come out to something like: project/subproject1/subproject1a/dev/terraform.tfstate
    key: "{{ spec.projectName }}/{{ spec.subprojectName }}/{{ spec.name }}/{{ target.name }}/terraform.tfstate"
    dynamodb_table: my-remote-state-lock-table
  tfVars:
    environment: "{{ target.name }}" # This input variable would apply to every subproject.
hooks:
  # This hook is useful when running multiple targets which have different backend configurations.
  beforeEachTarget: init -reconfigure
```

```yaml
# ./subproject1/terrascript.yml
subprojectName: subproject1
subprojects:
  subproject1a: ./subproject1a/
  subproject1b: ./subproject1b/
config:
  tfVars:
    someName: someValue # this is an input variable that applies to all of subproject1 including its subprojects
```

```yaml
# ./subproject1/subproject1a/terrascript.yml
config:
  tfVars:
    someNameFor1a: someValueFor1a # this is an input variable that applies only to subproject1a
targets:
  dev:
  prod:
```

You can see that this project has a more nested structure where different subprojects have different
configuration needs but there are common elements that can be templated and passed down
through inheritance.

Now, let's say you want to run a command for just subproject1a:
```shell
terrascript subproject1/subproject1a/dev apply # note that we don't need to init since we've got that hook
```

What if, for some reason, I wanted to run a command for only subprojects ending in "b"?
```shell
terrascript "*/*b/dev" apply  # note that the quotes are needed because of the asterisks
```

Can I run dev for all subprojects? Yep.
```shell
terrascript dev apply
```

Can I run every target for every subproject? Yep.
```shell
terrascript "*" apply
```

<details>
<summary>Just so you know, the terraform commands that were automated with that last command look like this...</summary>

```shell
cd ./infrastructure/subproject1/subproject1a/
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject1/subproject1a/dev/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=dev \
    -var=someName=someValue \
    -var=someNameFor1a=someValueFor1a
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject1/subproject1a/prod/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=prod \
    -var=someName=someValue \
    -var=someNameFor1a=someValueFor1a
cd ../../infrastructure/subproject1/subproject1b/
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject1/subproject1b/dev/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=dev \
    -var=someName=someValue
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject1/subproject1b/prod/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=prod \
    -var=someName=someValue
cd ../../infrastructure/subproject2/subproject2a/
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject2/subproject2a/dev/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=dev
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject2/subproject2a/prod/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=prod
cd ../../infrastructure/subproject2/subproject2b/
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject2/subproject2b/dev/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=dev
terraform init -reconfigure \
    -backend-config=profile=my-profile \
    -backend-config=region=us-east-1 \
    -backend-config=bucket=my-remote-state-bucket \
    -backend-config=key=project/subproject2/subproject2b/prod/terraform.tfstate \
    -backend-config=dynamodb_table=my-remote-state-lock-table
terraform apply -auto-approve \
    -var=environment=prod
```
</details>

### Javascript/Typescript wrapper

TODO
