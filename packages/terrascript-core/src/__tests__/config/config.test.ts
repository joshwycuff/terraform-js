// import { cloneDeep } from 'lodash';
// import { config, pushConfig, popConfig, updateConfig, CONFIG_STACK } from '../../config/config';
//
// describe('config', () => {
//     describe('pushConfig', () => {
//         it('should not affect conf for empty input', () => {
//             const configStackSize = CONFIG_STACK.length;
//             const clone = cloneDeep(config);
//             pushConfig({});
//             expect(config).toEqual(clone);
//             expect(CONFIG_STACK.length).toEqual(configStackSize + 1);
//         });
//         it('should add non-existing key-value pair', () => {
//             const configStackSize = CONFIG_STACK.length;
//             pushConfig({ pushConfigTest: 'qwer' });
//             expect(config.pushConfigTest).toEqual('qwer');
//             expect(CONFIG_STACK.length).toEqual(configStackSize + 1);
//         });
//         it('should update an existing key-value pair', () => {
//             const configStackSize = CONFIG_STACK.length;
//             pushConfig({ backendConfigFile: 'qwer' });
//             expect(config.backendConfigFile).toEqual('qwer');
//             expect(CONFIG_STACK.length).toEqual(configStackSize + 1);
//         });
//     });
//     describe('popConfig', () => {
//         it('should pop a layer from the conf merge-stack', () => {
//             const configStackSize = CONFIG_STACK.length;
//             pushConfig({ popConfigTest: 'qwer' });
//             expect(config.popConfigTest).toEqual('qwer');
//             expect(CONFIG_STACK.length).toEqual(configStackSize + 1);
//             popConfig();
//             expect(config.popConfigTest).toEqual(undefined);
//             expect(CONFIG_STACK.length).toEqual(configStackSize);
//         });
//     });
//     describe('updateConfig', () => {
//         it('should update conf without adding a layer to the stack', () => {
//             const configStackSize = CONFIG_STACK.length;
//             updateConfig({ updateConfigTest: 'asdf' });
//             expect(config.updateConfigTest).toEqual('asdf');
//             expect(CONFIG_STACK.length).toEqual(configStackSize);
//         });
//     });
// });
