const Jimp = require('jimp');
console.log('Type of Jimp:', typeof Jimp);
console.log('Jimp keys:', Object.keys(Jimp));
console.log('Is read a function?', typeof Jimp.read);
if (Jimp.default) {
    console.log('Has default export');
    console.log('Type of Jimp.default:', typeof Jimp.default);
    console.log('Is Jimp.default.read a function?', typeof Jimp.default.read);
}
