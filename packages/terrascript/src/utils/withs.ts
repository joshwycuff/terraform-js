import { isFunction } from 'lodash';

type IFunc<U> = () => Promise<U>;
type IContextValue<T> = T | (() => T);
type IContextFunc<T, U> = (withValue: T, func: IFunc<U>) => Promise<U>;
type ICurriedContextFunc<U> = (func: IFunc<U>) => Promise<U>;

/**
 * Curry a context function with the given context value.
 *
 * This makes it easier to combine contexts for cleaner code.
 *
 * @param {IContextFunc} contextFunc - A context function.
 * @param {IContextValue} contextValue - A context value or a function which returns the context
 * value.
 * @returns {ICurriedContextFunc} A curried context function which no longer requires the value
 * input.
 */
export function curryContext<T, U>(
    contextFunc: IContextFunc<T, U>,
    contextValue: IContextValue<T>,
): ICurriedContextFunc<U> {
    return async function (func: IFunc<U>) {
        if (isFunction(contextValue)) {
            return contextFunc(contextValue(), func);
        }
        return contextFunc(contextValue, func);
    };
}

/**
 * Combine multiple curried context functions into a single context function.
 *
 * @param {ICurriedContextFunc[]} curriedContextFuncs - An array of curried context functions.
 * @param {ICurriedContextFunc} curriedContextFunc - This is meant for this function's internal use.
 * @returns {ICurriedContextFunc} A single context function which combines all given contexts.
 */
export function combineContexts<U>(
    curriedContextFuncs: ICurriedContextFunc<U>[],
    curriedContextFunc?: ICurriedContextFunc<U>,
): ICurriedContextFunc<U> {
    const l = curriedContextFuncs.length;
    if (l === 0) {
        return curriedContextFunc as ICurriedContextFunc<U>;
    }
    const last = curriedContextFuncs.slice(-1)[0];
    if (curriedContextFunc) {
        // eslint-disable-next-line max-len
        return combineContexts(curriedContextFuncs.slice(0, -1), async (func: IFunc<U>) =>
            last(async () => curriedContextFunc(func)),
        );
    }
    return combineContexts(curriedContextFuncs.slice(0, -1), async (func: IFunc<U>) => last(func));
}

/**
 * Given an array of context functions, run the given function.
 *
 * @param {ICurriedContextFunc[]} contexts - An array of context functions.
 * @param {IFunc} func - A function to run which requires no inputs.
 * @returns {T} The output of the given function.
 */
export async function withContexts<T>(
    contexts: ICurriedContextFunc<T>[],
    func: IFunc<T>,
): Promise<T> {
    if (contexts.length > 0) {
        return combineContexts(contexts)(() => func());
    }
    return func();
}
