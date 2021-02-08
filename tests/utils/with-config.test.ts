import { config, CONFIG_STACK } from '../../src/config/config';
import { withConfig } from '../../src/utils/with-config';

describe('withConfig', () => {
    it('should push config and then pop config', async () => {
        const { length } = CONFIG_STACK;
        await withConfig({ asdf: 'qwer' }, async () => {
            expect(CONFIG_STACK.length).toEqual(length + 1);
            expect(config.asdf).toEqual('qwer');
        });
        expect(CONFIG_STACK.length).toEqual(length);
        expect(config.asdf).toBe(undefined);
    });
});
