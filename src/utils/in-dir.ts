/**
 * @param path
 * @param func
 */
export async function inDir<T>(path: string, func: () => T): Promise<T> {
    const original = process.cwd();
    process.chdir(path);
    const result = await func();
    process.chdir(original);
    return result;
}
