import { run } from '../command/command';

/**
 * @param dotGraph
 * @param dotFile
 * @param svgFile
 */
export async function dotToSvg(dotFile: string, svgFile: string) {
    const command = 'dot';
    const args = `-Tsvg -o${svgFile} ${dotFile}`;
    await run(command, args);
}
