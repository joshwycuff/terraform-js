import { IContext } from '../interfaces/context';

export const TEMPLATE_REGEX = /{{([^{}]+)}}/;

/**
 * Check if a string contains a template.
 *
 * @param {string} str - String to be checked.
 * @returns {boolean} true if string contains template, false if not
 */
export function containsTemplate(str: string): boolean {
    return str.includes('{{') && str.includes('}}') && TEMPLATE_REGEX.test(str);
}

/**
 * Expand a template by evaluating the code inside of it and providing context variables.
 *
 * @param {IContext} context - Context that can be used in the templates.
 * @param {string} str - String to be expanded if there is a template.
 * @returns {string} expanded string if it contained template(s), string itself if not
 */
export function expandTemplate(context: IContext, str: string): string {
    if (containsTemplate(str)) {
        // make some string templating more concise
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { spec, config } = context;
        // templating
        const match = TEMPLATE_REGEX.exec(str);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const template = match![0];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const expression = match![1];
        // eslint-disable-next-line no-eval
        const expansion = eval(expression);
        return expandTemplate(context, str.replace(template, expansion));
    }
    return str;
}
