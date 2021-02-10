import fs from 'fs';
import path from 'path';
import { Terraform } from '../..';
import { Hash } from '../../interfaces/types';
import { popConfig, pushConfig } from '../../config/config';

const TMP = 'tmp';
const TMP_TERRAFORM = path.join(TMP, '.terraform');
const TMP_MAIN = path.join(TMP, 'main.tf.json');
const DEFAULT_MAIN = {
    terraform: {},
    variable: { content: { default: '' } },
    resource: {
        local_file: {
            file: {
                filename: '${terraform.workspace}.txt',
                content: '${var.content}',
            },
        },
    },
    output: {
        filename: {
            value: '${local_file.file.filename}',
        },
        content: {
            value: '${local_file.file.content}',
        },
    },
};

/**
 * @param obj
 */
async function writeMain(obj: Hash<any>) {
    await fs.writeFileSync(TMP_MAIN, JSON.stringify(obj, null, 2));
}

/**
 * @param filepath
 * @param exists
 */
async function expectFile(filepath: string, exists = true) {
    await expect(fs.existsSync(filepath)).toBe(exists);
}

describe('terraform', () => {
    const TEST_OPTIONS = { cwd: TMP };
    beforeAll(() => {
        jest.setTimeout(60000);
    });
    afterAll(() => {
        jest.setTimeout(5000);
    });
    describe('primary subcommands', () => {
        beforeAll(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            await writeMain(DEFAULT_MAIN);
        });
        afterAll(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
        });
        it('should should init', async () => {
            const tf = new Terraform(TEST_OPTIONS);
            expect(await fs.existsSync(TMP_TERRAFORM)).toBe(false);
            await tf.init();
            expect(await fs.existsSync(TMP_TERRAFORM)).toBe(true);
        });
        it('should should plan', async () => {
            const tf = new Terraform(TEST_OPTIONS);
            const plan = await tf.plan([], true);
            expect(plan.toString().includes('plan')).toBe(true);
        });
        it('should should apply', async () => {
            const tf = new Terraform(TEST_OPTIONS);
            await tf.apply('-auto-approve');
            await expectFile(path.join(TMP, 'default.txt'));
        });
        it('should should destroy', async () => {
            const tf = new Terraform(TEST_OPTIONS);
            await tf.destroy('-auto-approve');
            await expectFile(path.join(TMP, 'default.txt'), false);
        });
    });

    describe('secondary subcommands', () => {
        const tf = new Terraform(TEST_OPTIONS);
        beforeAll(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
            await fs.mkdirSync(TMP);
            await writeMain(DEFAULT_MAIN);
            await tf.init();
            await tf.apply('-auto-approve');
        });
        afterAll(async () => {
            if (await fs.existsSync(TMP)) {
                await fs.rmdirSync(TMP, { recursive: true });
            }
        });
        it('should get', async () => {
            await tf.get();
        });
        it('should graph', async () => {
            await tf.graph();
        });
        it('should output', async () => {
            const output = await tf.output([], true);
            const expected = 'content = \nfilename = default.txt\n';
            expect(output).toEqual(expected);
        });
        it('should output json', async () => {
            const output = await tf.getOutputJson();
            const expected = {
                content: {
                    sensitive: false,
                    type: 'string',
                    value: '',
                },
                filename: {
                    sensitive: false,
                    type: 'string',
                    value: 'default.txt',
                },
            };
            expect(output).toEqual(expected);
        });
        it('should state list', async () => {
            const output = await tf.stateList([], true);
            const expected = 'local_file.file\n';
            expect(output).toEqual(expected);
        });
        it('should get state list array', async () => {
            const output = await tf.getStateListArray();
            const expected = ['local_file.file'];
            expect(output).toEqual(expected);
        });
        it('should validate', async () => {
            await tf.validate();
        });
        it('should workspace list', async () => {
            const output = await tf.workspaceList([], true);
            const expected = '* default';
            expect(output.toString().includes(expected)).toBe(true);
        });
        it('should workspace new, list, show, select, delete', async () => {
            // workspace new
            await tf.workspaceNew('another');
            // workspace list
            const workspaceListOutput1 = await tf.workspaceList([], true);
            expect(workspaceListOutput1.toString().includes('default')).toBe(true);
            expect(workspaceListOutput1.toString().includes('* another')).toBe(true);
            // workspace show
            const workspaceShowOutput1 = await tf.workspaceShow([], true);
            expect(workspaceShowOutput1).toEqual('another\n');
            // workspace select
            await tf.workspaceSelect('default');
            const workspaceShowOutput2 = await tf.workspaceShow([], true);
            expect(workspaceShowOutput2).toEqual('default\n');
            // workspace delete
            await tf.workspaceDelete('another');
            const workspaceListOutput2 = await tf.workspaceList([], true);
            expect(workspaceListOutput2.toString().includes('* default')).toBe(true);
            expect(workspaceListOutput2.toString().includes('another')).toBe(false);
        });
    });

    describe('environment variables', () => {
        test('set_TF_LOG', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG('TRACE');
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('TRACE');
        });
        test('set_TF_LOG_TRACE', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_TRACE();
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('TRACE');
        });
        test('set_TF_LOG_DEBUG', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_DEBUG();
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('DEBUG');
        });
        test('set_TF_LOG_INFO', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_INFO();
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('INFO');
        });
        test('set_TF_LOG_WARN', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_WARN();
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('WARN');
        });
        test('set_TF_LOG_ERROR', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_ERROR();
            expect(await tf._execute('printf', '$TF_LOG')).toEqual('ERROR');
        });
        test('set_TF_LOG_PATH', async () => {
            const tf = new Terraform();
            tf.set_TF_LOG_PATH('asdf');
            expect(await tf._execute('printf', '$TF_LOG_PATH')).toEqual('asdf');
        });
        test('set_TF_INPUT', async () => {
            const tf = new Terraform();
            tf.set_TF_INPUT('true');
            expect(await tf._execute('printf', '$TF_INPUT')).toEqual('true');
        });
        test('set_TF_INPUT_ON', async () => {
            const tf = new Terraform();
            tf.set_TF_INPUT_ON();
            expect(await tf._execute('printf', '$TF_INPUT')).toEqual('true');
        });
        test('set_TF_INPUT_OFF', async () => {
            const tf = new Terraform();
            tf.set_TF_INPUT_OFF();
            expect(await tf._execute('printf', '$TF_INPUT')).toEqual('false');
        });
        test('set_TF_VAR_name', async () => {
            const tf = new Terraform();
            tf.set_TF_VAR_name('asdf', 'qwer');
            expect(await tf._execute('printf', '$TF_VAR_asdf')).toEqual('qwer');
        });
        test('set_TF_CLI_ARGS', async () => {
            const tf = new Terraform();
            tf.set_TF_CLI_ARGS('asdf');
            expect(await tf._execute('printf', '$TF_CLI_ARGS')).toEqual('asdf');
        });
        test('set_TF_CLI_ARGS_name', async () => {
            const tf = new Terraform();
            tf.set_TF_CLI_ARGS_name('plan', 'asdf');
            expect(await tf._execute('printf', '$TF_CLI_ARGS_plan')).toEqual('asdf');
        });
        test('set_TF_DATA_DIR', async () => {
            const tf = new Terraform();
            tf.set_TF_DATA_DIR('asdf');
            expect(await tf._execute('printf', '$TF_DATA_DIR')).toEqual('asdf');
        });
        test('set_TF_WORKSPACE', async () => {
            const tf = new Terraform();
            tf.set_TF_WORKSPACE('asdf');
            expect(await tf._execute('printf', '$TF_WORKSPACE')).toEqual('asdf');
        });
        test('set_TF_IN_AUTOMATION', async () => {
            const tf = new Terraform();
            tf.set_TF_IN_AUTOMATION('asdf');
            expect(await tf._execute('printf', '$TF_IN_AUTOMATION')).toEqual('asdf');
        });
        test('set_TF_IN_AUTOMATION_ON', async () => {
            const tf = new Terraform();
            tf.set_TF_IN_AUTOMATION_ON();
            expect(await tf._execute('printf', '$TF_IN_AUTOMATION')).toEqual('true');
        });
        test('set_TF_IN_AUTOMATION_OFF', async () => {
            const tf = new Terraform();
            tf.set_TF_IN_AUTOMATION_OFF();
            // eslint-disable-next-line no-template-curly-in-string
            expect(await tf._execute('printf', '"empty${TF_IN_AUTOMATION}"')).toEqual('empty');
        });
        test('set_TF_REGISTRY_DISCOVERY_RETRY', async () => {
            const tf = new Terraform();
            tf.set_TF_REGISTRY_DISCOVERY_RETRY('asdf');
            expect(await tf._execute('printf', '$TF_REGISTRY_DISCOVERY_RETRY')).toEqual('asdf');
        });
        test('set_TF_REGISTRY_CLIENT_TIMEOUT', async () => {
            const tf = new Terraform();
            tf.set_TF_REGISTRY_CLIENT_TIMEOUT('asdf');
            expect(await tf._execute('printf', '$TF_REGISTRY_CLIENT_TIMEOUT')).toEqual('asdf');
        });
        test('set_TF_CLI_CONFIG_FILE', async () => {
            const tf = new Terraform();
            tf.set_TF_CLI_CONFIG_FILE('asdf');
            expect(await tf._execute('printf', '$TF_CLI_CONFIG_FILE')).toEqual('asdf');
        });
        test('set_TF_IGNORE', async () => {
            const tf = new Terraform();
            tf.set_TF_IGNORE('asdf');
            expect(await tf._execute('printf', '$TF_IGNORE')).toEqual('asdf');
        });
        test('set_TF_IGNORE_ON', async () => {
            const tf = new Terraform();
            tf.set_TF_IGNORE_ON();
            expect(await tf._execute('printf', '$TF_IGNORE')).toEqual('TRACE');
        });
        test('set_TF_IGNORE_OFF', async () => {
            const tf = new Terraform();
            tf.set_TF_IGNORE_OFF();
            // eslint-disable-next-line no-template-curly-in-string
            expect(await tf._execute('printf', '"empty${TF_IGNORE}"')).toEqual('empty');
        });
    });

    describe('additional settings', () => {
        test('setAutoApprove apply', async () => {
            const tf = new Terraform();
            tf.setAutoApprove(true);
            const command = await tf.subcommand('apply', [], 'command');
            expect(command.toString()).toEqual('terraform apply -auto-approve');
        });
        test('setAutoApprove destroy', async () => {
            const tf = new Terraform();
            tf.setAutoApprove(true);
            const command = await tf.subcommand('destroy', [], 'command');
            expect(command.toString()).toEqual('terraform destroy -auto-approve');
        });
        test('setAutoApproveOn', async () => {
            const tf = new Terraform();
            tf.setAutoApproveOn();
            const command = await tf.subcommand('apply', [], 'command');
            expect(command.toString()).toEqual('terraform apply -auto-approve');
        });
        test('setAutoApproveOff', async () => {
            const tf = new Terraform();
            tf.setAutoApproveOn();
            tf.setAutoApproveOff();
            const command = await tf.subcommand('apply', [], 'command');
            expect(command.toString()).toEqual('terraform apply');
        });
        test('configureBackend', async () => {
            const tf = new Terraform();
            tf.configureBackend('asdf', 'qwer');
            const command = await tf.subcommand('init', [], 'command');
            expect(command.toString()).toEqual('terraform init -backend-config=asdf=qwer');
        });
        test('configureBackendFile', async () => {
            const tf = new Terraform();
            tf.configureBackendFile('asdf');
            const command = await tf.subcommand('init', [], 'command');
            expect(command.toString()).toEqual('terraform init -backend-config=asdf');
        });
    });

    describe('configuration', () => {
        test('tfVars plan', async () => {
            pushConfig({ tfVars: { asdf: 'qwer' } });
            const tf = new Terraform();
            const command = await tf.subcommand('plan', [], 'command');
            expect(command.toString()).toEqual('terraform plan -var=asdf=qwer');
            popConfig();
        });
        test('tfVarsFiles plan', async () => {
            pushConfig({ tfVarsFiles: ['asdf'] });
            const tf = new Terraform();
            const command = await tf.subcommand('plan', [], 'command');
            expect(command.toString()).toEqual('terraform plan -var-file=asdf');
            popConfig();
        });
        test('tfVars apply', async () => {
            pushConfig({ tfVars: { asdf: 'qwer' } });
            const tf = new Terraform();
            const command = await tf.subcommand('apply', [], 'command');
            expect(command.toString()).toEqual('terraform apply -var=asdf=qwer');
            popConfig();
        });
        test('tfVarsFiles apply', async () => {
            pushConfig({ tfVarsFiles: ['asdf'] });
            const tf = new Terraform();
            const command = await tf.subcommand('apply', [], 'command');
            expect(command.toString()).toEqual('terraform apply -var-file=asdf');
            popConfig();
        });
        test('tfVars destroy', async () => {
            pushConfig({ tfVars: { asdf: 'qwer' } });
            const tf = new Terraform();
            const command = await tf.subcommand('destroy', [], 'command');
            expect(command.toString()).toEqual('terraform destroy -var=asdf=qwer');
            popConfig();
        });
        test('tfVarsFiles destroy', async () => {
            pushConfig({ tfVarsFiles: ['asdf'] });
            const tf = new Terraform();
            const command = await tf.subcommand('destroy', [], 'command');
            expect(command.toString()).toEqual('terraform destroy -var-file=asdf');
            popConfig();
        });
    });
});
