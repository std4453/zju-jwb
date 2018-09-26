const { splitCookiesString, parse } = require('set-cookie-parser');

const parseCookies = (headers) => {
    const combined = headers.get('set-cookie');
    const split = splitCookiesString(combined);
    const cookies = parse(split);

    return cookies.map(({ name, value }) => ({ name, value }));
};

const serializeCookies = (cookies) => {
    return cookies.map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join('; ');
};

module.exports = { parseCookies, serializeCookies };
