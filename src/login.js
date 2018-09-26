const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { parseCookies, serializeCookies } = require('./utils/cookie');
const encode = require('./utils/encode');

const startSession = async (context) => {
    const response = await fetch('https://zjuam.zju.edu.cn/cas/login?service=http://jwbinfosys.zju.edu.cn', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(response.headers)];
    console.log('Session with zjuam.zju.edu.cn started.');

    const text = await response.text();
    const $ = cheerio.load(text);
    const execution = $('input[name="execution"]').attr('value');
    return execution;
};

const calcRSA = async (context, password) => {
    const response = await fetch('https://zjuam.zju.edu.cn/cas/v2/getPubKey', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    const { modulus, exponent } = await response.json();
    const encoded = encode(password, modulus, exponent);
    context.cookies = [...context.cookies, ...parseCookies(response.headers)];
    console.log('RSA-ed password calculated.');
    return encoded;
};

const submitCredentials = async (context, username, encoded, execution) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', encoded);
    params.append('_eventId', 'submit');
    params.append('authcode', '');
    params.append('execution', execution);

    const { headers, status } = await fetch('https://zjuam.zju.edu.cn/cas/login?service=http://jwbinfosys.zju.edu.cn', {
        method: 'POST',
        headers: [['Cookie', serializeCookies(context.cookies)]],
        redirect: 'manual',
        body: params,
    });
    if (status !== 302) throw new Error('Cannot submit credentials!');
    context.cookies = [...context.cookies, ...parseCookies(headers)];
    console.log('Logged into zjuam.zju.edu.cn.');
    return headers.get('Location');
};

const login = async (username, password) => {
    const context = { cookies: [] };
    const execution = await startSession(context);
    const encoded = await calcRSA(context, password);
    const redirect = await submitCredentials(context, username, encoded, execution);
    const cookies = context.cookies.filter(({ name }) => name !== '_pm0' && name !== 'CASPRIVACY' && name !== 'JSESSIONID');

    console.log(`Redirecting to ${redirect}`);
    return { redirect, cookies };
};

module.exports = login;
