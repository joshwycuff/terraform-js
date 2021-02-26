import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { cloneDeep, mergeWith } from 'lodash';

import { TERRASCRIPT_YML } from '../constants';
import { searchUp } from '../utils/search-up';
import { _ISpec, ISpec } from '../interfaces/spec';
import { Hash } from '../interfaces/types';
import { inDir } from '../utils/in-dir';
import { MergeStack } from '../utils/merge-stack';
import { log } from '../logging/logging';

// eslint-disable-next-line jsdoc/require-returns
/**
 * A lodash mergeWith customizer which prevents inheritance of subprojects and targets. Also
 * simplifies inheritance of arrays.
 *
 * @param {any} objValue - Value being merged into
 * @param {any} srcValue - Value to be merged
 * @param {string} key - The key currently being merged
 */
// eslint-disable-next-line consistent-return,require-jsdoc
function customizer(objValue: any, srcValue: any, key: string): any {
    if (key === 'subprojects') {
        return srcValue;
    }
    if (key === 'targets') {
        const objClone = cloneDeep(objValue);
        const srcClone = cloneDeep(srcValue);
        for (const objKey of Object.keys(objValue)) {
            if (!(objKey in srcValue)) {
                delete objClone[objKey];
            }
        }
        mergeWith(objClone, srcClone, customizer);
        return objClone;
    }
    if (Array.isArray(objValue)) {
        return srcValue;
    }
}

export const SPEC_STACK = new MergeStack<ISpec>(undefined, customizer);

export const SPEC = () => SPEC_STACK.peek();

/**
 * Class containing logic to compile terrascript yaml files in a project
 */
export class Specs {
    private cwd: string;

    private nodes: Hash<ISpec>;

    main: ISpec;

    rootPath: ISpec[];

    /**
     * Create a new terrascript specs project instance
     *
     * @param {string} cwd - Current working directory
     */
    constructor(cwd?: string) {
        this.cwd = cwd || process.cwd();
        this.nodes = {};
        this.rootPath = [];
        this.main = {} as ISpec;
    }

    /**
     * Build all specs in current project
     */
    async build() {
        this.main = await this.compileSpec(this.cwd);
        this.rootPath = await this.getRootPath(this.cwd);
    }

    /**
     * Compile a spec
     *
     * @param {string} dir - Directory containing a terrascript yaml file
     * @param {boolean} deep - Flag to also compile subproject specs
     * @returns {Promise<ISpec>} - Compiled spec
     * @private
     */
    private async compileSpec(dir: string, deep = true): Promise<ISpec> {
        const ymlfile = path.join(process.cwd(), dir, TERRASCRIPT_YML);
        log.debug(`Compiling ${ymlfile}`);
        return inDir(dir, async () => {
            const spec = await Specs.loadSpecFromDir();
            if (spec.name in this.nodes) {
                throw new Error('Spec cycle detected.');
            }
            // compile subprojects first
            if (deep) {
                spec.subprojects = await this.compile(spec, spec.subprojects, 'subprojects');
            }
            for (const section of Object.keys(spec)) {
                if (section !== 'subprojects') {
                    spec[section] = await this.compile(spec, spec[section], section);
                }
            }
            this.nodes[spec.name] = spec;
            for (const target of Object.keys(spec.targets)) {
                spec.targets[target].name = target;
            }
            return spec;
        });
    }

    /**
     * Compile part of a spec. Determine what type of object it is and pass it to the appropriate
     * compile method.
     *
     * @param {ISpec} spec - The parent spec
     * @param {any} subsection - Subsection of a spec
     * @param {string} topLevelSectionKey - The spec key the part is under
     * @returns {any} Compiled subsection
     * @private
     */
    private async compile(spec: ISpec, subsection: any, topLevelSectionKey: string): Promise<any> {
        if (subsection === null) {
            return {};
        }
        if (typeof subsection === 'string') {
            return this.compileString(spec, subsection, topLevelSectionKey);
        }
        if (Array.isArray(subsection)) {
            return this.compileArray(spec, subsection, topLevelSectionKey);
        }
        if (typeof subsection === 'object') {
            return this.compileObject(spec, subsection, topLevelSectionKey);
        }
        throw new Error('Unhandled spec compilation type');
    }

    /**
     * Compile a string which may be a subproject spec, a JavaScript module, an alias, or a plain
     * string.
     *
     * @param {ISpec} spec - The parent spec
     * @param {string} str - The string to be compiled
     * @param {string} section - The spec key the string is under
     * @returns {any} A subproject spec, JavaScript module, or string
     * @private
     */
    private async compileString(spec: ISpec, str: string, section: string): Promise<any> {
        if (section === 'subprojects') {
            return this.compileSpec(str);
        }
        if (section === 'modules') {
            return Specs.compileModule(str);
        }
        if (str.slice(0, 1) === '$') {
            if (!!spec.definitions && str in spec.definitions) {
                return spec.definitions[str];
            }
            throw new Error(`${str} not found in definitions of spec ${spec.name}`);
        }
        return str;
    }

    /**
     * Compile a spec array
     *
     * @param {ISpec} spec - The parent spec
     * @param {any[]} arr - The array to be compiled
     * @param {string} section - The spec key the array is under
     * @returns {Promise<any[]>} - Compiled array
     * @private
     */
    private async compileArray(spec: ISpec, arr: any[], section: string): Promise<any[]> {
        const clone = cloneDeep(arr);
        return Promise.all(clone.map((x) => this.compile(spec, x, section)));
    }

    /**
     * Compile a spec object
     *
     * @param {ISpec} spec - The parent spec
     * @param {Hash<any>} obj - The object to be compiled
     * @param {string} section - The spec key the object is under
     * @returns {Promise<Hash<any>>} - Compiled object
     * @private
     */
    private async compileObject(spec: ISpec, obj: Hash<any>, section: string): Promise<Hash<any>> {
        const clone = cloneDeep(obj);
        for (const key of Object.keys(clone)) {
            clone[key] = await this.compile(spec, clone[key], section);
        }
        return clone;
    }

    // eslint-disable-next-line jsdoc/require-returns
    /**
     * Require the given JavaScript module
     *
     * @param {string} modulePath - Relative path to JavaScript module
     * @private
     */
    private static async compileModule(modulePath: string) {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        return require(path.join(process.cwd(), modulePath));
    }

    /**
     * Find all parent terrascript specs in the current project
     *
     * @param {string} cwd - Current working directory
     * @returns {Promise<ISpec[]>} - Array of parent specs up to project root
     * @private
     */
    private async getRootPath(cwd: string): Promise<ISpec[]> {
        const dirs: string[] = [];
        let dir = cwd;
        const next = async () => searchUp(TERRASCRIPT_YML, dir);
        for (let node = await next(); node; node = await next()) {
            dirs.push(path.dirname(node));
            dir = path.dirname(dir);
        }
        dirs.splice(0, 1);
        dirs.reverse();
        return Promise.all(dirs.map((d) => this.compileSpec(d, false)));
    }

    /**
     * Load the terrascript yaml file from the given directory
     *
     * @param {string} inputDir - The directory to load the terrascript yaml file from
     * @returns {Promise<ISpec>} - The terrascript spec if the yaml existed and was valid
     * @private
     */
    private static async loadSpecFromDir(inputDir?: string): Promise<ISpec> {
        const dir = inputDir || process.cwd();
        const filesAndFolders = await fs.readdirSync(dir);
        if (filesAndFolders.includes(TERRASCRIPT_YML)) {
            const filepath = path.join(dir, TERRASCRIPT_YML);
            return Specs.loadSpec(filepath);
        }
        throw new Error(`No ${TERRASCRIPT_YML} found in directory ${dir}`);
    }

    /**
     * Load spec from yaml file
     *
     * @param {string} filepath - A yaml filepath
     * @returns {ISpec} A spec instance based on the given yaml file
     * @private
     */
    private static async loadSpec(filepath: string): Promise<ISpec> {
        const spec = (yaml.load(fs.readFileSync(filepath, 'utf-8')) || {}) as _ISpec;
        spec.filepath = filepath;
        spec.dirpath = path.dirname(filepath);
        return Specs.fillSpec(spec);
    }

    /**
     * Fill spec with any missing keys
     *
     * @param {_ISpec} unfilledSpec - Input spec which may be missing keys
     * @returns {ISpec} Filled spec which contains all supported keys
     * @private
     */
    private static fillSpec(unfilledSpec: _ISpec): ISpec {
        const spec = cloneDeep(unfilledSpec);
        if (!spec.name) {
            spec.name = path.basename(path.dirname(spec.filepath));
        }
        if (!spec.subprojects) {
            spec.subprojects = {};
        }
        if (!spec.config) {
            spec.config = {};
        }
        if (!spec.config.infrastructureDirectory) {
            spec.config.infrastructureDirectory = '.';
        }
        if (!spec.groups) {
            spec.groups = {};
        }
        if (!spec.hooks) {
            spec.hooks = {};
        }
        if (!spec.modules) {
            spec.modules = {};
        }
        if (!spec.scripts) {
            spec.scripts = {};
        }
        if (!spec.targets) {
            spec.targets = {};
        }
        if (!spec.definitions) {
            spec.definitions = {};
        }
        return spec as ISpec;
    }
}

/**
 * @param cwd
 */
export async function buildSpecs(cwd?: string): Promise<Specs> {
    const tree = new Specs(cwd || process.cwd());
    await tree.build();
    return tree;
}
