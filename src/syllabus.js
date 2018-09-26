const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');
const urlencode = require('urlencode');
const { serializeCookies } = require('./utils/cookie');

const shouldEncode = key => key === 'xqd' || key === 'xxms';
const encodeGBKForm = params => Array.from(params
    .entries())
    .map(([key, value]) => `${key}=${urlencode(value, shouldEncode(key) ? 'gbk' : 'utf8')}`)
    .join('&');

const parseState = (text, context) => {
    const $ = cheerio.load(text, { decodeEntities: false });

    context.viewState = $('input[name="__VIEWSTATE"]').attr('value');
    context.params.xxms = $('input[name="xxms"][checked="checked"]').attr('value');
    context.params.xnd = $('select[name="xnd"]').find('option[selected="selected"]').attr('value');
    context.params.xqd = $('select[name="xqd"]').find('option[selected="selected"]').attr('value');
};

const generateParams = (context) => {
    const params = new URLSearchParams();
    params.append('__EVENTARGUMENT', '');
    params.append('__VIEWSTATE', context.viewState);
    params.append('kcxx', '');
    for (const key in context.params) {
        if ({}.hasOwnProperty.call(context.params, key)) params.append(key, context.params[key]);
    }
    return params;
};

const startSyllabus = async (context) => {
    const response = await fetch(`http://jwbinfosys.zju.edu.cn/${context.action}.aspx?xh=${context.username}`, {
        headers: [['Cookie', serializeCookies(context.cookies)]],
        redirect: 'manual',
    });
    const text = await response.textConverted();
    parseState(text, context);
};

const changeField = async (context, event, field, value) => {
    const params = generateParams(context);
    params.append('__EVENTTARGET', event);
    params.set(field, value);

    const response = await fetch(`http://jwbinfosys.zju.edu.cn/${context.action}.aspx?xh=${context.username}`, {
        headers: [
            ['Cookie', serializeCookies(context.cookies)],
            ['Content-Type', 'application/x-www-form-urlencoded'],
        ],
        redirect: 'manual',
        method: 'POST',
        body: encodeGBKForm(params),
    });
    const text = await response.textConverted();
    parseState(text, context);

    return text;
};

const semesters = {
    autumn: '1|秋',
    winter: '1|冬',
    winterShort: '1|短',
    summerVacation: '1|暑',
    spring: '2|春',
    summer: '2|夏',
    summerShort: '2|短',
};

const parseSyllabus = (text, username) => {
    const $ = cheerio.load(text, { decodeEntities: false });

    const lectures = {};
    const table = new Array(15);
    for (let i = 0; i < 15; ++i) {
        table[i] = [];
        for (let j = 0; j < 14; ++j) table[i].push(false);
    }

    $('table#Table1').find('tr').each((y, line) => {
        if (y < 2) return;
        y -= 2;
        const nextX = (x) => { for (x += 1; table[y][x]; ++x) ; return x; };
        let x = -1;
        $(line).find('td[align="Center"]').each((_, td) => {
            x = nextX(x);
            if ($(td).find('A[href="#"]').length === 0) {
                table[y][x] = true;
                return;
            }

            const col = parseInt($(td).attr('colspan'), 10);
            const row = parseInt($(td).attr('rowspan'), 10);
            for (let i = 0; i < row; ++i) {
                for (let j = 0; j < col; ++j) table[y + i][x + j] = true;
            }

            const a = $(td).find('A[href="#"]');
            const onclick = a.attr('onclick');
            const lecture = new RegExp(`xsxjs\\.aspx\\?xkkh=([\\(\\)a-zA-Z0-9\\-]+)${username}`).exec(onclick)[1];

            const [name,, teacher, location] = a.html().split('<br>');
            if (typeof lectures[lecture] === 'undefined') {
                lectures[lecture] = { name, teacher, lessons: [] };
            }
            for (let i = x; i < x + col; ++i) {
                const weekDay = i / 2;
                const weekType = i % 2 === 0 ? 'even' : 'odd';
                lectures[lecture].lessons.push({
                    weekDay, weekType, start: y, end: y + row, location,
                });
            }
        });
    });

    const syllabus = [];
    for (const code in lectures) {
        if ({}.hasOwnProperty.call(lectures, code)) syllabus.push({ code, ...lectures[code] });
    }
    return syllabus;
};

const getSyllabus = async (username, session) => {
    const context = { cookies: session, username, action: 'xskbcx', params: {}, viewState: '' };
    await startSyllabus(context);
    const autumnText = await changeField(context, 'xxms_1', 'xxms', '表格');

    const syllabus = {};
    for (const key in semesters) {
        if ({}.hasOwnProperty.call(semesters, key)) {
            console.log(`Parsing syllabus for the ${key} semester...`);
            // eslint-disable-next-line no-await-in-loop
            const text = key === 'autumn' ? autumnText : await changeField(context, 'xqd', 'xqd', semesters[key]);
            syllabus[key] = parseSyllabus(text, username);
        }
    }

    return syllabus;
};

module.exports = { getSyllabus };
