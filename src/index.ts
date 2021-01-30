import { run } from './terrascript/run';

(async () => {
    await run();
})();

// import { Terraform } from './terraform/terraform';
//
// const tf = new Terraform({ cwd: 'tmp' });
//
// (async () => {
//     await tf.set_TF_VAR_name('filename', 'filename.txt');
//     // await tf.version();
//     // await tf.init();
//     // await tf.apply();
//     // await tf.destroy();
//     // console.log(await tf.getOutputJson());
//     // console.log(await tf.getShowJson());
//     // console.log(await tf.getStateListArray());
//     // await tf.graphSvg();
// })();
