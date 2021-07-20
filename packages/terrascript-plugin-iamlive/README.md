# terrascript-plugin-iamlive

Terrascript plugin which handles running [iamlive](https://github.com/iann0036/iamlive) in the
background to capture required IAM actions in policy format.

## Install

Installing this plugin does not install the iamlive application. For instructions on how to do that,
see the [iamlive documentation](https://github.com/iann0036/iamlive).

```bash
npm install @joshwycuff/terrascript-plugin-iamlive --save-dev
```

```bash
yarn add @joshwycuff/terrascript-plugin-iamlive --dev
```

## Usage

For iamlive-specific documentation, go to the [iamlive Github repo](
https://github.com/iann0036/iamlive).

After installation, to include the iamlive plugin in a terrascript project, add the plugin to the
top-level terrascript.yml.

```yaml
plugins:
  - ...
  - "@joshwycuff/terrascript-plugin-iamlive"
```

To define iamlive plugin configuration, specify an `iamlive` key in a `terrascript.yml`
configuration file. The below example shows most available configuration options with their
iamlive default values, plugin default values, or expected types.

```yaml
iamlive:
  accountId: "123456789012"
  background: false
  bindAddr: "127.0.0.1:10080"
  caBundle: "~/.iamlive/ca.pem"
  caKey: "~/.iamlive/ca.key"
  enabled: true
  failsOnly: false
  forceWildcardResource: false
  host: "127.0.0.1"
  mode: "csm"
  outputFile: "iamlive-policy.json"
  profile: "default"
  setIni: false
  sortAlphabetical: false
  autoStart: false
  autoStop: true
```
