import fs from 'fs';
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

/**
 * @param filepath
 * @param data
 */
async function writeJson(filepath: string, data: any) {
    await fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
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
            await runTerrascript('*', 'pwd', []);
            await runTerrascript('*', 'init', []);
            await runTerrascript('*', 'validate', []);
            await runTerrascript('*', 'apply', ['-auto-approve']);
        });
        test('script', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                },
                scripts: {
                    apply: 'apply -auto-approve',
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('*', 'init', []);
            await runTerrascript('*', 'apply', []);
        });
        test('group', async () => {
            const spec = {
                workspaces: {
                    dev: {},
                },
                groups: {
                    agroup: ['dev'],
                },
            };
            await writeYaml(TERRASCRIPT_YML, spec);
            await writeJson(MAIN_TF_JSON, DEFAULT_MAIN);
            await runTerrascript('agroup', 'init', []);
            await runTerrascript('agroup', 'apply', ['-auto-approve']);
        });
    });

    describe('sub project', () => {
        beforeEach(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            process.chdir(TMP);
        });
        afterEach(async () => {
            process.chdir(CWD);
            // await fs.rmdirSync(TMP, { recursive: true });
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
            await runTerrascript('*', 'pwd', []);
            await runTerrascript('*', 'init', []);
            await runTerrascript('*', 'validate', []);
            await runTerrascript('subproject/dev', 'apply', ['-auto-approve']);
        });
    });
});
