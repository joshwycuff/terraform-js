# terrascript-plugin-modules

Terrascript plugin which implements the modules functionality. This allows arbitrary JavaScript
to be imported and run in Terrascript actions.

## Install

This plugin comes with any installation of Terrascript as a dependency.

## Usage

Define modules under the `modules` key in a `terrascript.yml` configuration file. The
`terrascript.yml` in which a module is defined as well as any child subprojects can use the module.

With modules, you can run Javascript functions within actions. The function should take
a single input which is the `context` object. Modules that you want to import should look
similar to the example below.

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
