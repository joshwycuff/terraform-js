// import { config, CONFIG_STACK } from '../../config/config';
// import { withConfig } from '../../utils/with-config';
//
// describe('withConfig', () => {
//     it('should push conf and then pop conf', async () => {
//         const { length } = CONFIG_STACK;
//         await withConfig({ asdf: 'qwer' }, async () => {
//             expect(CONFIG_STACK.length).toEqual(length + 1);
//             expect(config.asdf).toEqual('qwer');
//         });
//         expect(CONFIG_STACK.length).toEqual(length);
//         expect(config.asdf).toBe(undefined);
//     });
// });
