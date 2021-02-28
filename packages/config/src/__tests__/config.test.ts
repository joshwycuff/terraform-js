import fs from 'fs';
import yaml from 'js-yaml';

import { conf } from '..';
import { ArgvConfig } from '../stores/argv';
import { EnvConfig } from '../stores/env';

const getProcessArgv = jest.spyOn(ArgvConfig, 'getProcessArgv');
const getProcessEnv = jest.spyOn(EnvConfig, 'getProcessEnv');

/**
 * @param ms
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('config', () => {
  afterEach(() => {
    getProcessArgv.mockReset();
    getProcessEnv.mockReset();
  });
  afterAll(() => {
    getProcessArgv.mockRestore();
    getProcessEnv.mockRestore();
  });
  describe('construction', () => {
    describe('argv', () => {
      it('should only override when used', () => {
        getProcessArgv.mockReturnValue(['--a=2']);
        const config = conf({ a: 1 }).peek();
        expect(config).toEqual({ a: 1 });
      });
      it('should format number correctly', () => {
        getProcessArgv.mockReturnValue(['--a=2']);
        const config = conf({ a: 1 }).argv().peek();
        expect(config).toEqual({ a: 2 });
      });
      it('should format string correctly', () => {
        getProcessArgv.mockReturnValue(['--a=2']);
        const config = conf({ a: '1' }).argv().peek();
        expect(config).toEqual({ a: '2' });
      });
      it('should format boolean correctly', () => {
        getProcessArgv.mockReturnValue(['--a=false']);
        const config = conf({ a: true }).argv().peek();
        expect(config).toEqual({ a: false });
      });
      it('should override one of multiple', () => {
        getProcessArgv.mockReturnValue(['--b=3']);
        const config = conf({ a: 1, b: 2 }).argv().peek();
        expect(config).toEqual({ a: 1, b: 3 });
      });
      it('should override multiple', () => {
        getProcessArgv.mockReturnValue(['--a=3', '--b=4']);
        const config = conf({ a: 1, b: 2 }).argv().peek();
        expect(config).toEqual({ a: 3, b: 4 });
      });
      it('should work with words', () => {
        getProcessArgv.mockReturnValue(['--some-var=2']);
        const config = conf({ someVar: 1 }).argv().peek();
        expect(config).toEqual({ someVar: 2 });
      });
      it('should work with namespace', () => {
        getProcessArgv.mockReturnValue(['--asdf--some-var=2']);
        const config = conf({ someVar: 1 }, 'asdf').argv().peek();
        expect(config).toEqual({ someVar: 2 });
      });
      it('should work with nested value', () => {
        getProcessArgv.mockReturnValue(['--a--b=2']);
        const config = conf({ a: { b: 1 } }).argv().peek();
        expect(config).toEqual({ a: { b: 2 } });
      });
      it('should work with nested value and namespace', () => {
        getProcessArgv.mockReturnValue(['--asdf--a--b=2']);
        const config = conf({ a: { b: 1 } }, 'asdf').argv().peek();
        expect(config).toEqual({ a: { b: 2 } });
      });
    });
    describe('env', () => {
      it('should only override when used', () => {
        getProcessEnv.mockReturnValue({ A: '2' });
        const config = conf({ a: 1 }).peek();
        expect(config).toEqual({ a: 1 });
      });
      it('should format number correctly', () => {
        getProcessEnv.mockReturnValue({ A: '2' });
        const config = conf({ a: 1 }).env().peek();
        expect(config).toEqual({ a: 2 });
      });
      it('should format string correctly', () => {
        getProcessEnv.mockReturnValue({ A: '2' });
        const config = conf({ a: '1' }).env().peek();
        expect(config).toEqual({ a: '2' });
      });
      it('should format boolean correctly', () => {
        getProcessEnv.mockReturnValue({ A: 'false' });
        const config = conf({ a: true }).env().peek();
        expect(config).toEqual({ a: false });
      });
      it('should override one of multiple', () => {
        getProcessEnv.mockReturnValue({ B: '3' });
        const config = conf({ a: 1, b: 2 }).env().peek();
        expect(config).toEqual({ a: 1, b: 3 });
      });
      it('should override multiple', () => {
        getProcessEnv.mockReturnValue({ A: '3', B: '4' });
        const config = conf({ a: 1, b: 2 }).env().peek();
        expect(config).toEqual({ a: 3, b: 4 });
      });
      it('should work with words', () => {
        getProcessEnv.mockReturnValue({ SOME_VAR: '2' });
        const config = conf({ someVar: 1 }).env().peek();
        expect(config).toEqual({ someVar: 2 });
      });
      it('should work with namespace', () => {
        getProcessEnv.mockReturnValue({ ASDF__SOME_VAR: '2' });
        const config = conf({ someVar: 1 }, 'asdf').env().peek();
        expect(config).toEqual({ someVar: 2 });
      });
      it('should work with nested value', () => {
        getProcessEnv.mockReturnValue({ A__B: '2' });
        const config = conf({ a: { b: 1 } }).env().peek();
        expect(config).toEqual({ a: { b: 2 } });
      });
      it('should work with nested value and namespace', () => {
        getProcessEnv.mockReturnValue({ ASDF__A__B: '2' });
        const config = conf({ a: { b: 1 } }, 'asdf').env().peek();
        expect(config).toEqual({ a: { b: 2 } });
      });
    });
    describe('object', () => {
      it('should merge object', () => {
        const defaults = { a: 1, b: { c: 2 } };
        const obj = { b: { c: 3 } };
        const config = conf(defaults).object(obj).peek();
        expect(config).toEqual({ a: 1, b: { c: 3 } });
      });
      it('should merge object with customizer', () => {
        // eslint-disable-next-line unicorn/consistent-function-scoping,consistent-return
        const customizer: _.MergeWithCustomizer = (value: any, srcValue: any) => {
          if (typeof value === 'number' && typeof srcValue === 'number') {
            return value + srcValue;
          }
        };
        const defaults = { a: 1, b: { c: 2 } };
        const obj = { b: { c: 3 } };
        const config = conf(defaults, '', customizer).object(obj).peek();
        expect(config).toEqual({ a: 1, b: { c: 5 } });
      });
    });
    describe('file', () => {
      describe('js', () => {
        const testFilepath = 'test.js';
        beforeAll(async () => {
          const content = 'module.exports = { b: { c: 3 } };';
          await fs.writeFileSync(testFilepath, content);
        });
        afterAll(async () => {
          await fs.rmSync(testFilepath);
        });
        it('should merge', async () => {
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults).file(testFilepath).peek();
          expect(config).toEqual({ a: 1, b: { c: 3 } });
        });
        it('should merge with customizer', () => {
          // eslint-disable-next-line unicorn/consistent-function-scoping,consistent-return
          const customizer: _.MergeWithCustomizer = (value: any, srcValue: any) => {
            if (typeof value === 'number' && typeof srcValue === 'number') {
              return value + srcValue;
            }
          };
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults, '', customizer).file(testFilepath).peek();
          expect(config).toEqual({ a: 1, b: { c: 5 } });
        });
      });
      describe('json', () => {
        const testFilepath = 'test.json';
        beforeAll(async () => {
          await fs.writeFileSync(testFilepath, JSON.stringify({ b: { c: 3 } }));
        });
        afterAll(async () => {
          await fs.rmSync(testFilepath);
        });
        it('should merge', async () => {
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults).file(testFilepath);
          await sleep(1);
          expect(config.peek()).toEqual({ a: 1, b: { c: 3 } });
        });
        it('should merge with customizer', async () => {
          // eslint-disable-next-line unicorn/consistent-function-scoping,consistent-return
          const customizer: _.MergeWithCustomizer = (value: any, srcValue: any) => {
            if (typeof value === 'number' && typeof srcValue === 'number') {
              return value + srcValue;
            }
          };
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults, '', customizer).file(testFilepath);
          await sleep(1);
          expect(config.peek()).toEqual({ a: 1, b: { c: 5 } });
        });
      });
      describe('yaml', () => {
        const testFilepath = 'test.yaml';
        beforeAll(async () => {
          await fs.writeFileSync(testFilepath, yaml.dump({ b: { c: 3 } }));
        });
        afterAll(async () => {
          await fs.rmSync(testFilepath);
        });
        it('should merge', async () => {
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults).file(testFilepath);
          await sleep(1);
          expect(config.peek()).toEqual({ a: 1, b: { c: 3 } });
        });
        it('should merge with customizer', async () => {
          // eslint-disable-next-line unicorn/consistent-function-scoping,consistent-return
          const customizer: _.MergeWithCustomizer = (value: any, srcValue: any) => {
            if (typeof value === 'number' && typeof srcValue === 'number') {
              return value + srcValue;
            }
          };
          const defaults = { a: 1, b: { c: 2 } };
          const config = conf(defaults, '', customizer).file(testFilepath);
          await sleep(1);
          expect(config.peek()).toEqual({ a: 1, b: { c: 5 } });
        });
      });
      describe('optional file', () => {
        const testFilepath = 'test.yaml';
        beforeAll(async () => {
          await fs.writeFileSync(testFilepath, yaml.dump({ b: { c: 3 } }));
        });
        afterAll(async () => {
          await fs.rmSync(testFilepath);
        });
        it('should merge file that exists', async () => {
          const defaults = { a: 1, b: { c: 2 } };
          const config = (await conf(defaults).optionalFileSync(testFilepath)).peek();
          expect(config).toEqual({ a: 1, b: { c: 3 } });
        });
        it('should skip file that does not exist', async () => {
          const defaults = { a: 1, b: { c: 2 } };
          const config = (await conf(defaults).optionalFileSync('asdfwoeir.yaml')).peek();
          expect(config).toEqual({ a: 1, b: { c: 2 } });
        });
      });
    });
    describe('combining constructions', () => {
      const defaults = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
      const testJsonFilepath = 'testCombiningConstructions.json';
      const testYamlFilepath = 'testCombiningConstructions.yaml';
      const testJsFilepath = 'testCombiningConstructions.js';
      beforeAll(async () => {
        const contentJson = JSON.stringify({ b: 22, c: 0, d: 0, e: 0, f: 0 });
        const contentYaml = yaml.dump({ c: 33, d: -1, e: -1, f: -1 });
        const contentJs = 'module.exports = { d: 44, e: -2, f: -2 };';
        await fs.writeFileSync(testJsFilepath, contentJs);
        await fs.writeFileSync(testJsonFilepath, contentJson);
        await fs.writeFileSync(testYamlFilepath, contentYaml);
        getProcessEnv.mockReturnValue({ E: '55', F: '-3' });
        getProcessArgv.mockReturnValue(['--f=66']);
      });
      afterAll(async () => {
        await fs.rmSync(testJsFilepath);
        await fs.rmSync(testJsonFilepath);
        await fs.rmSync(testYamlFilepath);
      });
      test('last option should override', async () => {
        const config = (await (await conf(defaults)
          .fileSync(testJsonFilepath))
          .fileSync(testYamlFilepath))
          .file(testJsFilepath)
          .env()
          .argv()
          .peek();
        expect(config).toEqual({ a: 1, b: 22, c: 33, d: 44, e: 55, f: 66 });
      });
    });
  });
});
