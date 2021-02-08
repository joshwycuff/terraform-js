/**
 * Context function to switch into directory before running given function and out of
 * directory after.
 *
 * @param {string} path - Directory path to switch to for given function.
 * @param {() => T} func - A function to run which requires no inputs.
 * @returns {T} The output of the given function.
 */
export async function inDir<T>(path: string, func: () => T): Promise<T> {
    const original = process.cwd();
    process.chdir(path);
    const result = await func();
    process.chdir(original);
    return result;
}
