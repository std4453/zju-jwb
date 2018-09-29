const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const log = require('debug')('zju-jwb/login');
const { parseCookies, serializeCookies } = require('./utils/cookie');
const encode = require('./utils/encode');

const startSession = async (context, service) => {
    const response = await fetch(`https://zjuam.zju.edu.cn/cas/login?service=${service}`, {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(response.headers)];
    if (context.cookies.filter(({ name }) => name === 'JSESSIONID').length === 0) {
        throw new Error('Unable to start session with zjuam.zju.edu.cn!');
    }
    log('Session with zjuam.zju.edu.cn started.');

    const text = await response.text();
    const $ = cheerio.load(text);
    const execution = $('input[name="execution"]').attr('value');
    if (typeof execution === 'undefined') throw new Error('Unable to obtain "execution" string!');
    log('Obtained "execution" string from fetched page.');

    return execution;
};

const calcRSA = async (context) => {
    const response = await fetch('https://zjuam.zju.edu.cn/cas/v2/getPubKey', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(response.headers)];

    const { modulus, exponent } = await response.json();
    log('Obtained RSA public key from server.');

    const encoded = encode(context.password, modulus, exponent);
    log('Encoded password with RSA public key.');
    return encoded;
};

const submitCredentials = async (context, service, encoded, execution) => {
    const params = new URLSearchParams();
    params.append('username', context.username);
    params.append('password', encoded);
    params.append('_eventId', 'submit');
    params.append('authcode', '');
    params.append('execution', execution);

    const { headers, status } = await fetch(`https://zjuam.zju.edu.cn/cas/login?service=${service}`, {
        method: 'POST',
        headers: [['Cookie', serializeCookies(context.cookies)]],
        redirect: 'manual',
        body: params,
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
    if (status !== 302) throw new Error('Submitted credentials rejected!');
    log('Logged into zjuam.zju.edu.cn.');

    return headers.get('Location');
};

const login = async (service, username, password) => {
    const context = { cookies: [], username, password };
    const execution = await startSession(context, service);
    const encoded = await calcRSA(context);
    const redirect = await submitCredentials(context, service, encoded, execution);
    const cookies = context.cookies.filter(({ name }) => name !== '_pm0' && name !== 'CASPRIVACY' && name !== 'JSESSIONID');

    if (typeof redirect === 'undefined') throw new Error('Unable to obtain redirect link!');
    log(`Redirecting to ${redirect}`);
    return { redirect, cookies };
};

module.exports = login;
