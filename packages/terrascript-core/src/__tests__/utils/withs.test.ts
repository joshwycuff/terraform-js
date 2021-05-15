// import fs from 'fs';
// import path from 'path';
// import { inDir } from '../../utils/in-dir';
// import { config, CONFIG_STACK } from '../../config/config';
// import { withConfig } from '../../utils/with-config';
// import { combineContexts, curryContext, withContexts } from '../../utils/withs';
//
// const TMP = 'tmp';
//
// describe('withs', () => {
//     beforeAll(async () => {
//         if (!(await fs.existsSync(TMP))) {
//             await fs.mkdirSync(TMP);
//         }
//     });
//     afterAll(async () => {
//         await fs.rmdirSync(TMP, { recursive: true });
//     });
//
//     describe('curryWith', () => {
//         it('should curry a context function', async () => {
//             const cwd = process.cwd();
//             const inDirContext = curryContext(inDir, TMP);
//             await inDirContext(async () => {
//                 expect(process.cwd()).toEqual(path.join(cwd, TMP));
//             });
//             expect(process.cwd()).toEqual(cwd);
//         });
//     });
//
//     describe('combineContexts', () => {
//         it('should combine context functions', async () => {
//             const cwd = process.cwd();
//             const { length } = CONFIG_STACK;
//
//             const inDirContext = curryContext(inDir, TMP);
//             const withConfigContext = curryContext(withConfig, { asdf: 'qwer' });
//
//             const withCombinedContexts = combineContexts([inDirContext, withConfigContext]);
//
//             await withCombinedContexts(async () => {
//                 expect(process.cwd()).toEqual(path.join(cwd, TMP));
//                 expect(CONFIG_STACK.length).toEqual(length + 1);
//                 expect(config.asdf).toEqual('qwer');
//             });
//
//             expect(process.cwd()).toEqual(cwd);
//             expect(CONFIG_STACK.length).toEqual(length);
//             expect(config.asdf).toBe(undefined);
//         });
//     });
//
//     describe('withContexts', () => {
//         it('should combine context functions', async () => {
//             const cwd = process.cwd();
//             const { length } = CONFIG_STACK;
//
//             const inDirContext = curryContext(inDir, TMP);
//             const withConfigContext = curryContext(withConfig, { asdf: 'qwer' });
//
//             await withContexts([inDirContext, withConfigContext], async () => {
//                 expect(process.cwd()).toEqual(path.join(cwd, TMP));
//                 expect(CONFIG_STACK.length).toEqual(length + 1);
//                 expect(config.asdf).toEqual('qwer');
//             });
//
//             expect(process.cwd()).toEqual(cwd);
//             expect(CONFIG_STACK.length).toEqual(length);
//             expect(config.asdf).toBe(undefined);
//         });
//     });
// });
