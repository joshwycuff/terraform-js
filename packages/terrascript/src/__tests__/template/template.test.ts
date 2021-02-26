import { expandTemplate } from '../../template/template';
import { IContext } from '../../interfaces/context';

describe('template', () => {
    it('should not expand strings with no templates', () => {
        const context = {
            conf: {},
            spec: {},
        } as IContext;
        const str = 'asdf';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual(str);
    });
    it('should expand simple extraction of context value', () => {
        const context = {
            asdf: 'qwer',
        } as unknown as IContext;
        const str = '{{ context.asdf }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer');
    });
    it('should expand multiple identical templates', () => {
        const context = {
            asdf: 'qwer',
        } as unknown as IContext;
        const str = '{{ context.asdf }}{{ context.asdf }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwerqwer');
    });
    it('should expand with text', () => {
        const context = {
            asdf: 'qwer',
        } as unknown as IContext;
        const str = '{{ context.asdf }} other text';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer other text');
    });
    it('should expand nested templates', () => {
        const context = {
            nested: '{{ context.asdf }}',
            asdf: 'qwer',
        } as unknown as IContext;
        const str = '{{ context.nested }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer');
    });
    it('should expand this nested template', () => {
        const context = {
            something: 'nested',
            nested: '{{ context.asdf }}',
            asdf: 'qwer',
        } as unknown as IContext;
        const str = '{{ context.{{ context.something }} }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer');
    });
    it('should make spec available', () => {
        const context = {
            spec: {
                asdf: 'qwer',
            },
        } as unknown as IContext;
        const str = '{{ spec.asdf }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer');
    });
    it('should make conf available', () => {
        const context = {
            conf: {
                asdf: 'qwer',
            },
        } as unknown as IContext;
        const str = '{{ conf.asdf }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('qwer');
    });
    it('should expand arbitrary javascript', () => {
        const context = {} as IContext;
        const str = '{{ 1 > 0 ? "yes" : "no" }}';
        const expanded = expandTemplate(context, str);
        expect(expanded).toEqual('yes');
    });
});
