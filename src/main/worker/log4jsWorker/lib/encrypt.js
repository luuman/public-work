let crypto = require('crypto');
let pureAes = require('aes-js');
// const path = require('path');

// return a string through input array
function reverse(xs) {
    xs = Array.isArray(xs) ? xs : xs.split('');
    if (xs.length == 0) {
        return '';
    } else {
        return xs.reverse().join('');
    }
}
const joinSep = ')=> ';
let salt = 'empty';

// a string of type utf8 and return a data of type base64 encrypted by rsa
function encrypt(text, password) {
    let hash = crypto.createHash('sha256');
    hash.update(password || salt);
    let key128 = hash.digest().slice(0, 16);
    let textbytes = pureAes.utils.utf8.toBytes(text);
    let ctr = new pureAes.ModeOfOperation.ctr(key128);
    let outBytes = ctr.encrypt(textbytes);
    return Buffer.from(outBytes).toString('base64');
}

function encryptStr(str, password) {
    return '|+|' + reverse(encrypt(str, password));
}

module.exports = {encryptStr, joinSep};
