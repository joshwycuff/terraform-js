# terrascript-plugin-git

Terrascript plugin for additional git functionality.

## Install

```bash
npm install @joshwycuff/terrascript-plugin-git --save-dev
```

```bash
yarn add @joshwycuff/terrascript-plugin-git --dev
```

## Usage

Place the plugin name in the `plugins` key of the top-level `terrascript.yml`.

```yaml
plugins:
  - "@joshwycuff/terrascript-plugin-git"
```

The following environment variables will then be available to your Terrascript actions.

| Name | Description |
| --- | --- |
| `GIT_BRANCH` | Name of current git branch.
| `GIT_COMMIT_ID` | Current git commit id. 
| `GIT_DESCRIBE` | Human-readable git commit identification.
