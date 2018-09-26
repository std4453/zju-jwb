const fetch = require('node-fetch');
const { parseCookies, serializeCookies } = require('./utils/cookie');
const login = require('./login');

const startSession = async (context) => {
    const { headers } = await fetch('http://jwbinfosys.zju.edu.cn/default2.aspx', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
    if (context.cookies.filter(({ name }) => name === 'ASP.NET_SessionId').length === 0) {
        throw new Error('Unable to start session with jwbinfosys.zju.edu.cn!');
    }
    console.log('Session with jwbinfosys.zju.edu.cn started.');
};

const followRedirect = async (context, redirect) => {
    const { headers } = await fetch(redirect, {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
    console.log(`Redirected to ${redirect}.`);
};

const getinDefault2 = async (context) => {
    const { headers } = await fetch('http://jwbinfosys.zju.edu.cn/default2.aspx', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
    console.log('Fetched default2.aspx and obtained system access.');
};

const getin = async (username, password) => {
    const context = { cookies: [] };
    await startSession(context);
    const { cookies, redirect } = await login('http://jwbinfosys.zju.edu.cn', username, password);
    context.cookies = [...context.cookies, ...cookies];
    await followRedirect(context, redirect);
    await getinDefault2(context);
    console.log('jwbinfosys.zju.edu.cn ready!');

    return context.cookies.filter(({ name }) => name === 'ASP.NET_SessionId');
};

module.exports = getin;
