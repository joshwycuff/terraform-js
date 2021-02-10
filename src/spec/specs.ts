import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import _, { cloneDeep, mergeWith } from 'lodash';

import { TERRASCRIPT_YML } from '../constants';
import { searchUp } from '../utils/search-up';
import { _ISpec, ISpec } from '../interfaces/spec';
import { Hash } from '../interfaces/types';
import { inDir } from '../utils/in-dir';
import { MergeStack } from '../utils/merge-stack';

/**
 * @param objValue
 * @param srcValue
 * @param key
 * @param object
 * @param source
 * @param stack
 * @param obj
 * @param src
 */
function customizer(objValue: any, srcValue: any, key: string, obj: any, src: any): any {
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

export class Specs {
    private cwd: string;

    private nodes: Hash<ISpec>;

    main: ISpec;

    rootPath: ISpec[];

    constructor(cwd?: string) {
        this.cwd = cwd || process.cwd();
        this.nodes = {};
        this.rootPath = [];
        this.main = {} as ISpec;
    }

    async build() {
        this.main = await this.compileSpec(this.cwd);
        this.rootPath = await this.getRootPath(this.cwd);
    }

    private async compileSpec(dir: string, deep = true) {
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

    private async compile(spec: ISpec, subspec: any, section: string) {
        if (subspec === null) {
            return {};
        }
        if (typeof subspec === 'string') {
            return this.compileString(spec, subspec, section);
        }
        if (Array.isArray(subspec)) {
            return this.compileArray(spec, subspec, section);
        }
        if (typeof subspec === 'object') {
            return this.compileObject(spec, subspec, section);
        }
    }

    private async compileString(spec: ISpec, str: string, section: string): Promise<any> {
        if (section === 'subprojects') {
            return this.compileSpec(str);
        }
        if (section === 'modules') {
            return this.compileModule(str);
        }
        if (str.slice(0, 1) === '$') {
            if (!!spec.definitions && str in spec.definitions) {
                return spec.definitions[str];
            }
            throw new Error(`${str} not found in definitions of spec ${spec.name}`);
        }
        return str;
    }

    private async compileArray(spec: ISpec, arr: any[], section: string): Promise<any[]> {
        const clone = cloneDeep(arr);
        return Promise.all(clone.map((x) => this.compile(spec, x, section)));
    }

    private async compileObject(spec: ISpec, obj: Hash<any>, section: string): Promise<Hash<any>> {
        const clone = cloneDeep(obj);
        for (const key of Object.keys(clone)) {
            clone[key] = await this.compile(spec, clone[key], section);
        }
        return clone;
    }

    private async compileModule(modulePath: string) {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        return require(path.join(process.cwd(), modulePath));
    }

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

    private static async loadSpecFromDir(inputDir?: string): Promise<ISpec> {
        const dir = inputDir || process.cwd();
        const filesAndFolders = await fs.readdirSync(dir);
        if (filesAndFolders.includes(TERRASCRIPT_YML)) {
            const filepath = path.join(dir, TERRASCRIPT_YML);
            return Specs.loadSpec(filepath);
        }
        throw new Error(`No ${TERRASCRIPT_YML} found in directory ${dir}`);
    }

    private static async loadSpec(filepath: string): Promise<ISpec> {
        const spec = yaml.load(fs.readFileSync(filepath, 'utf-8')) as _ISpec;
        spec.filepath = filepath;
        spec.dirpath = path.dirname(filepath);
        return Specs.fillSpec(spec);
    }

    private static fillSpec(unfilledSpec: _ISpec): ISpec {
        const spec = cloneDeep(unfilledSpec);
        if (spec.name === undefined) {
            spec.name = path.basename(path.dirname(spec.filepath));
        }
        if (spec.subprojects === undefined) {
            spec.subprojects = {};
        }
        if (spec.config === undefined) {
            spec.config = {};
        }
        if (spec.config.infrastructureDirectory === undefined) {
            spec.config.infrastructureDirectory = '.';
        }
        if (spec.groups === undefined) {
            spec.groups = {};
        }
        if (spec.hooks === undefined) {
            spec.hooks = {};
        }
        if (spec.modules === undefined) {
            spec.modules = {};
        }
        if (spec.scripts === undefined) {
            spec.scripts = {};
        }
        if (spec.targets === undefined) {
            spec.targets = {};
        }
        if (spec.definitions === undefined) {
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
