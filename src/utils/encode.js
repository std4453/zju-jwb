const bigInt = require('big-integer');

const encode = (str, modulus, exponent) => {
    const buf = Buffer.from(str, 'utf8');
    const hex = buf.toString('hex');

    const N = bigInt(modulus, 16);
    const M = bigInt(hex, 16);
    const R = M.modPow(bigInt(exponent, 16), N);

    return R.toString(16);
};

module.exports = encode;
