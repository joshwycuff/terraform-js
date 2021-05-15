import { Hash, JSONArray, JSONObject, JSONValue } from '@joshwycuff/types';
import { IActionContext, TerrascriptPlugin } from '@joshwycuff/terrascript-core';
import { log } from './logging';

/* eslint-disable no-param-reassign */

// eslint-disable-next-line require-jsdoc
export default class TemplateExpressions implements TerrascriptPlugin {
  private static TEMPLATE_REGEX = /{{([^{}]+)}}/;

  static async beforeAction(context: IActionContext): Promise<void> {
    const cache: Hash<string> = {};
    TemplateExpressions.evaluate(context, cache, context);
  }

  private static evaluate(context: IActionContext, cache: Hash<string>, val: JSONValue) {
    if (Array.isArray(val)) {
      TemplateExpressions.evaluateArray(context, cache, val);
    } else if (typeof val === 'object' && val !== null) {
      TemplateExpressions.evaluateObject(context, cache, val);
    }
  }

  private static evaluateArray(context: IActionContext, cache: Hash<string>, val: JSONArray) {
    for (const [index, element] of val.entries()) {
      if (typeof element === 'string') {
        // eslint-disable-next-line no-param-reassign
        val[index] = TemplateExpressions.evaluateString(context, cache, element);
      } else {
        TemplateExpressions.evaluate(context, cache, element);
      }
    }
  }

  private static evaluateObject(context: IActionContext, cache: Hash<string>, val: JSONObject) {
    for (const [key, element] of Object.entries(val)) {
      if (typeof element === 'string') {
        // eslint-disable-next-line no-param-reassign
        val[key] = TemplateExpressions.evaluateString(context, cache, element);
      } else {
        TemplateExpressions.evaluate(context, cache, element);
      }
    }
  }

  private static evaluateString(context: IActionContext, cache: Hash<string>, val: string): JSONValue {
    if (TemplateExpressions.containsTemplate(val)) {
      return TemplateExpressions.evaluateTemplateExpression(context, cache, val);
    }
    return val;
  }

  /**
   * Check if a string contains a template.
   *
   * @param {string} str - String to be checked.
   * @returns {boolean} true if string contains template, false if not
   */
  private static containsTemplate(str: string): boolean {
    return str.includes('{{') && str.includes('}}') && TemplateExpressions.TEMPLATE_REGEX.test(str);
  }

  /**
   * Expand a template by evaluating the code inside of it and providing context variables.
   *
   * @param {IContext} context - Context that can be used in the templates.
   * @param cache
   * @param {string} str - String to be expanded if there is a template.
   * @returns {string} expanded string if it contained template(s), string itself if not
   */
  private static evaluateTemplateExpression(context: IActionContext, cache: Hash<string>, str: string): JSONValue {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      spec,
      conf,
      target,
      cmd,
      args,
    } = context;
    // templating
    const match = TemplateExpressions.TEMPLATE_REGEX.exec(str);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const template = match![0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const expression = match![1];
    if (TemplateExpressions.isExpressionCached(cache, expression)) {
      const expansion = cache[expression];
      return TemplateExpressions.evaluateString(context, cache, str.replace(template, expansion));
    }
    try {
      // eslint-disable-next-line no-eval
      const expansion = `${eval(expression)}`;
      if (expansion === 'undefined') {
        throw new Error(`template expression resulted in undefined: ${expression}`);
      }
      log.silly(`Evaluated template expression "${expression}" to "${expansion}"`);
      TemplateExpressions.cacheExpression(cache, expression, expansion);
      return TemplateExpressions.evaluateString(context, cache, str.replace(template, expansion));
    } catch (error) {
      log.error(error);
      throw new Error(`error during evaluation of template: ${expression}`);
    }
  }

  private static isExpressionCached(cache: Hash<string>, str: string): boolean {
    return str in cache;
  }

  private static cacheExpression(cache: Hash<string>, str: string, val: string) {
    cache[str] = val;
  }
}
