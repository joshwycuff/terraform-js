import fs, { writeFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { runTerrascript } from '../../cli/commands/terrascript';
import { TERRASCRIPT_YML } from '../../constants';

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
const DEFAULT_MODULE = `module.exports = {
    qwer: (context) => {
        console.log('qwer')
    }
}
`;

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
    const spy = jest.spyOn(console, 'log').mockImplementation();

    beforeAll(async () => {
        jest.setTimeout(6000000);
    });
    afterAll(async () => {
        spy.mockRestore();
        jest.setTimeout(5000);
    });

    describe('single project', () => {
        beforeEach(async () => {
            spy.mockReset();
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
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            await expectFileContent('default.txt', '');
        });
        test('workspace', async () => {
            const spec = {
                config: {
                    env: {
                        TF_WORKSPACE: '{{ target.name }}',
                    },
                },
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            await expectFileContent('dev.txt', '');
        });
        test('tfVars', async () => {
            const spec = {
                config: {
                    tfVars: {
                        content: 'asdf',
                    },
                },
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            await expectFileContent('default.txt', 'asdf');
        });
        test('script', async () => {
            const spec = {
                targets: {
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
            await expectFileContent('default.txt', '');
        });
        test('group', async () => {
            const spec = {
                config: {
                    env: {
                        TF_WORKSPACE: '{{ target.name }}',
                    },
                },
                targets: {
                    dev: {},
                    prod: {},
                },
                groups: {
                    agroup: ['dev', 'prod'],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('agroup', 'apply', ['-auto-approve']);
            await expectFilesContent(['dev.txt', 'prod.txt'], '');
        });
        test('glob pattern', async () => {
            const spec = {
                config: {
                    env: {
                        TF_WORKSPACE: '{{ target.name }}',
                    },
                },
                targets: {
                    dev: {},
                    prod: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('{dev,prod}', 'apply', ['-auto-approve']);
            await expectFilesContent(['dev.txt', 'prod.txt'], '');
        });
        test('tfVars && templating', async () => {
            const spec = {
                arbitrary: 'asdf',
                config: {
                    tfVars: {
                        content: '{{ spec.arbitrary }}',
                    },
                },
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('dev', 'apply', ['-auto-approve']);
            await expectFileContent('default.txt', 'asdf');
        });
        test('templating non-existent property', async () => {
            const spec = {
                config: {
                    tfVars: {
                        content: '{{ spec.nope }}',
                    },
                },
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('dev', 'init', []);
            await expect(async () => {
                await runTerrascript('dev', 'apply', []);
            }).rejects.toThrowError();
        });
        test('module function', async () => {
            const spec = {
                modules: {
                    asdf: './asdf.js',
                },
                targets: {
                    dev: {},
                },
                scripts: {
                    asdf: [
                        {
                            function: 'asdf.qwer',
                        },
                    ],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await writeFileSync('asdf.js', DEFAULT_MODULE);
            await runTerrascript('dev', 'asdf', []);
            expect(spy).toHaveBeenCalled();
            const stdout = spy.mock.calls[0][0];
            expect(stdout).toEqual('qwer');
        });
    });

    describe('subproject', () => {
        beforeEach(async () => {
            spy.mockReset();
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
                targets: {
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
            await expectFileContent('subproject/default.txt', '');
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
                targets: {
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
            await expectFileContent('subproject/default.txt', 'asdf');
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
                targets: {
                    dev: {},
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await fs.mkdirSync('subproject');
            await writeYaml(path.join('subproject', TERRASCRIPT_YML), subspec);
            await writeJson(path.join('subproject', MAIN_TF_JSON), DEFAULT_MAIN);
            await runTerrascript('dev', 'pwd', []);
            await runTerrascript('dev', 'init', []);
            await runTerrascript('dev', 'validate', []);
            await runTerrascript('subproject/dev', 'apply', ['-auto-approve']);
            await expectFileContent('subproject/default.txt', 'subproject');
        });
        test('module function', async () => {
            const spec = {
                subprojects: {
                    subproject: './subproject',
                },
            };
            const subspec = {
                name: 'subproject',
                modules: {
                    asdf: './asdf.js',
                },
                targets: {
                    dev: {},
                },
                scripts: {
                    asdf: [
                        {
                            function: 'asdf.qwer',
                        },
                    ],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await fs.mkdirSync('subproject');
            await writeYaml(path.join('subproject', TERRASCRIPT_YML), subspec);
            await writeJson(path.join('subproject', MAIN_TF_JSON), DEFAULT_MAIN);
            await writeFileSync(path.join('subproject', 'asdf.js'), DEFAULT_MODULE);
            await runTerrascript('dev', 'asdf', []);
            expect(spy).toHaveBeenCalled();
            const stdout = spy.mock.calls[0][0];
            expect(stdout).toEqual('qwer');
        });
    });

    describe('subprojects', () => {
        beforeEach(async () => {
            spy.mockReset();
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
        test('apply single target of multiple', async () => {
            const spec = {
                config: {
                    env: {
                        TF_WORKSPACE: '{{ target.name }}',
                    },
                },
                subprojects: {
                    subproject1: './subproject1',
                    subproject2: './subproject2',
                },
            };
            const subproject1 = {
                targets: {
                    dev: {},
                    prod: {},
                },
            };
            const subproject2 = {
                targets: {
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
