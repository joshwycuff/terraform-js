// import fs from 'fs';
// import path from 'path';
// import { inDir } from '../../utils/in-dir';
//
// const TMP = 'tmp';
//
// describe('inDir', () => {
//     beforeAll(async () => {
//         if (!(await fs.existsSync(TMP))) {
//             await fs.mkdirSync(TMP);
//         }
//     });
//     afterAll(async () => {
//         await fs.rmdirSync(TMP, { recursive: true });
//     });
//     it('should change into and out of dir', async () => {
//         const cwd = process.cwd();
//         await inDir(TMP, async () => {
//             expect(process.cwd()).toEqual(path.join(cwd, TMP));
//         });
//         expect(process.cwd()).toEqual(cwd);
//     });
// });
