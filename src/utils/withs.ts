import { isFunction } from 'lodash';

type IFunc<U> = () => Promise<U>;
type IContextValue<T> = T | (() => T);
type IContextFunc<T, U> = (withValue: T, func: IFunc<U>) => Promise<U>;
type ICurriedContextFunc<U> = (func: IFunc<U>) => Promise<U>;

/**
 * @param withContext
 * @param context
 */
export function curryWith<T, U>(
    withContext: IContextFunc<T, U>,
    context: IContextValue<T>,
): ICurriedContextFunc<U> {
    return async function (func: IFunc<U>) {
        if (isFunction(context)) {
            return withContext(context(), func);
        }
        return withContext(context, func);
    };
}

/**
 * @param curriedWiths
 * @param func
 * @param curriedWith
 */
export function combineContexts<U>(
    curriedWiths: ICurriedContextFunc<U>[],
    curriedWith?: ICurriedContextFunc<U>,
): ICurriedContextFunc<U> {
    const l = curriedWiths.length;
    if (l === 0) {
        return curriedWith as ICurriedContextFunc<U>;
    }
    const last = curriedWiths.slice(-1)[0];
    if (curriedWith) {
        return combineContexts(curriedWiths.slice(0, -1), async (func: IFunc<U>) =>
            last(async () => curriedWith(func)),
        );
    }
    return combineContexts(curriedWiths.slice(0, -1), async (func: IFunc<U>) => last(func));
}

/**
 * @param contexts
 * @param func
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
