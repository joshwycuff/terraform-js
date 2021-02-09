import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { runTerrascript } from '../../cli/commands/terrascript';
import { TERRASCRIPT_YML } from '../../constants';
import { ISpec } from '../../interfaces/spec';

const CWD = process.cwd();
const TMP = 'tmp';
const MAIN_TF_JSON = 'main.tf.json';
const DEFAULT_MAIN = {
    terraform: {},
    variable: { content: { default: '' } },
    resource: {
        local_file: {
            file: {
                // eslint-disable-next-line no-template-curly-in-string
                filename: '${terraform.workspace}.txt',
                // eslint-disable-next-line no-template-curly-in-string
                content: '${var.content}',
            },
        },
    },
    output: {
        filename: {
            // eslint-disable-next-line no-template-curly-in-string
            value: '${local_file.file.filename}',
        },
        content: {
            // eslint-disable-next-line no-template-curly-in-string
            value: '${local_file.file.content}',
        },
    },
};

/**
 * @param filepath
 * @param data
 */
async function writeJson(filepath: string, data: any) {
    await fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/**
 * @param filepath
 * @param exists
 */
async function expectFile(filepath: string, exists = true) {
    await expect(await fs.existsSync(filepath)).toBe(exists);
}

/**
 * @param filepaths
 * @param exists
 */
async function expectFiles(filepaths: string[], exists = true) {
    for (const filepath of filepaths) {
        await expectFile(filepath, exists);
    }
}

/**
 * @param filepath
 * @param content
 */
async function expectFileContent(filepath: string, content: string) {
    await expectFile(filepath);
    await expect((await fs.readFileSync(filepath)).toString()).toEqual(content);
}

/**
 * @param filepaths
 * @param content
 */
async function expectFilesContent(filepaths: string[], content: string) {
    await expectFiles(filepaths);
    for (const filepath of filepaths) {
        await expectFileContent(filepath, content);
    }
}

/**
 * @param filepath
 * @param data
 */
async function writeYaml(filepath: string, data: any) {
    await fs.writeFileSync(filepath, yaml.dump(data));
}

describe('terrascript', () => {
    beforeAll(async () => {
        jest.setTimeout(6000000);
    });
    afterAll(async () => {
        jest.setTimeout(5000);
    });

    describe('single project', () => {
        beforeEach(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            process.chdir(TMP);
        });
        afterEach(async () => {
            process.chdir(CWD);
            await fs.rmdirSync(TMP, { recursive: true });
        });
        test('basic', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            expectFileContent('dev.txt', '');
        });
        test('tfVars', async () => {
            const spec = {
                config: {
                    tfVars: {
                        content: 'asdf',
                    },
                },
                workspaces: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            expectFileContent('dev.txt', 'asdf');
        });
        test('script', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                },
                scripts: {
                    apply: ['apply -auto-approve'],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'apply', []);
            expectFileContent('dev.txt', '');
        });
        test('group', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                    prod: {},
                },
                groups: {
                    agroup: ['dev'],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('agroup', 'apply', ['-auto-approve']);
            expectFilesContent(['dev.txt', 'prod.txt'], '');
        });
        test('glob pattern', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                    prod: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('{dev,prod}', 'apply', ['-auto-approve']);
            expectFilesContent(['dev.txt', 'prod.txt'], '');
        });
        test('tfVars && templating', async () => {
            const spec = {
                arbitrary: 'asdf',
                config: {
                    tfVars: {
                        content: '{{ spec.arbitrary }}',
                    },
                },
                workspaces: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            expectFileContent('dev.txt', 'asdf');
        });
    });

    describe('subproject', () => {
        beforeEach(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            process.chdir(TMP);
        });
        afterEach(async () => {
            process.chdir(CWD);
            await fs.rmdirSync(TMP, { recursive: true });
        });
        test('basic', async () => {
            const spec = {
                subprojects: {
                    subproject: './subproject',
                },
            };
            const subspec = {
                workspaces: {
                    dev: {},
                },
            };
            await fs.mkdirSync('subproject');
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeYaml(path.join('subproject', TERRASCRIPT_YML), subspec);
            await writeJson(path.join('subproject', MAIN_TF_JSON), DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('subproject/dev', 'apply', ['-auto-approve']);
            await expectFileContent('subproject/dev.txt', '');
        });
        test('tfVars && inheritance', async () => {
            const spec = {
                subprojects: {
                    subproject: './subproject',
                },
                config: {
                    tfVars: {
                        content: 'asdf',
                    },
                },
            };
            const subspec = {
                workspaces: {
                    dev: {},
                },
            };
            await fs.mkdirSync('subproject');
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeYaml(path.join('subproject', TERRASCRIPT_YML), subspec);
            await writeJson(path.join('subproject', MAIN_TF_JSON), DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('subproject/dev', 'apply', ['-auto-approve']);
            await expectFileContent('subproject/dev.txt', 'asdf');
        });
        test('tfVars && templating && inheritance', async () => {
            const spec = {
                subprojects: {
                    subproject: './subproject',
                },
                config: {
                    tfVars: {
                        content: '{{ spec.name }}',
                    },
                },
            };
            const subspec = {
                name: 'subproject',
                workspaces: {
                    dev: {},
                },
            };
            await fs.mkdirSync('subproject');
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeYaml(path.join('subproject', TERRASCRIPT_YML), subspec);
            await writeJson(path.join('subproject', MAIN_TF_JSON), DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('subproject/dev', 'apply', ['-auto-approve']);
            await expectFileContent('subproject/dev.txt', 'subproject');
        });
    });

    describe('subprojects', () => {
        beforeEach(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            process.chdir(TMP);
        });
        afterEach(async () => {
            process.chdir(CWD);
            await fs.rmdirSync(TMP, { recursive: true });
        });
        test('apply single workspace of multiple', async () => {
            const spec = {
                subprojects: {
                    subproject1: './subproject1',
                    subproject2: './subproject2',
                },
            };
            const subproject1 = {
                workspaces: {
                    dev: {},
                    prod: {},
                },
            };
            const subproject2 = {
                workspaces: {
                    dev: {},
                    prod: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await fs.mkdirSync('subproject1');
            await writeYaml(path.join('subproject1', TERRASCRIPT_YML), subproject1);
            await writeJson(path.join('subproject1', MAIN_TF_JSON), DEFAULT_MAIN);
            await fs.mkdirSync('subproject2');
            await writeYaml(path.join('subproject2', TERRASCRIPT_YML), subproject2);
            await writeJson(path.join('subproject2', MAIN_TF_JSON), DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            await expectFileContent('subproject1/dev.txt', '');
            await expectFile('subproject1/prod.txt', false);
            await expectFileContent('subproject2/dev.txt', '');
            await expectFile('subproject2/prod.txt', false);
        });
    });
});
