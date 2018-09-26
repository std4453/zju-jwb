const fetch = require('node-fetch');
const { parseCookies, serializeCookies } = require('./utils/cookie');
const login = require('./login');

const startSession = async (context) => {
    const { headers } = await fetch('http://jwbinfosys.zju.edu.cn/default2.aspx', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
};

const followRedirect = async (context, redirect) => {
    const { headers } = await fetch(redirect, {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
};

const getinDefault2 = async (context) => {
    const { headers } = await fetch('http://jwbinfosys.zju.edu.cn/default2.aspx', {
        headers: [['Cookie', serializeCookies(context.cookies)]],
    });
    context.cookies = [...context.cookies, ...parseCookies(headers)];
};

const getin = async (username, password) => {
    const context = { cookies: [] };
    await startSession(context);
    const { cookies, redirect } = await login(username, password);
    context.cookies = [...context.cookies, ...cookies];
    await followRedirect(context, redirect);
    await getinDefault2(context);

    return context.cookies.filter(({ name }) => name === 'ASP.NET_SessionId');
};

module.exports = getin;
