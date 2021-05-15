# terrascript-plugin-terraform

Terrascript plugin for additional Terraform functionality.

## Install

```bash
npm install @joshwycuff/terrascript-plugin-terraform --save-dev
```

```bash
yarn add @joshwycuff/terrascript-plugin-terraform --dev
```

## Usage

Place the plugin name in the `plugins` key of the top-level `terrascript.yml`.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
```

### Basic Configuration

Configuration of the Terraform plugin for Terrascript is set under the `terraform` key.

```yaml
terraform:
  # shorthandTerraformCommand: tf
  # shorthandTerraformSubcommands: true
```

- `shorthandTerraformCommand` allows the definition of a shorthand (or alias) terraform command (e.g. tf).
- `shorthandTerraformSubcommands` allows terraform subcommands to be run directly without specifying the top-level terraform command at all (e.g. `terraform init` -> `init`).

The Terraform plugin also adds additional hooks specifically for Terraform actions. These occur
at the same time as the `beforeAction` and `afterAction` hooks.

```yaml
hooks:
  beforeTerraform:        # runs before any terraform command
  afterTerraform:         # runs after any terraform command
  beforeTerraformApply:   # runs before terraform apply
  afterTerraformApply:    # runs after terraform apply
  beforeTerraformDestroy: # runs before terraform destroy
  afterTerraformDestroy:  # runs after terraform destroy
```

Technically, the plugin supports `beforeTerraform{subcommand}` and `afterTerraform{subcommand}` for
any Terraform subcommand. Those above are just the most common.

### Walk-through

When specifying `shorthandTerraformSubcommands` as `true`, terraform actions can be defined in
shorthand as well.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
targets:
  dev:
actions:
  build:
    - init
    - plan
    - apply
```

You can specify Terraform input variables which can be effectively combined with Terrascript
template expressions.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
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
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
  tfVarsFiles:
    - "tfvars/{{ target.name }}.tfvars"
targets:
  dev:
```

```shell
terrascript dev apply
# `terraform apply -var-file=tfvars/dev.tfvars`
```

Tired of typing `-auto-approve` or plan on using this in CI/CD?

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
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
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
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
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
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
  beforeTerraform: init -reconfigure
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
plugins:
  - "@joshwycuff/terrascript-plugin-terraform"
terraform:
  shorthandTerraformSubcommands: true
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
  beforeTarget: init -reconfigure
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
