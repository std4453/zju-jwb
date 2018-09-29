/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const log = require('debug')('zju-jwb/server');
const ZjuJwb = require('./index');

const app = new Koa();
const actions = ['getSyllabus'];
const port = parseInt(process.env.PORT, 10);

app.use(async (ctx, next) => {
    await next();
    log(`${ctx.method} ${ctx.url} ${ctx.status}`);
});

app.use(bodyParser());

for (const action of actions) {
    /* eslint-disable no-loop-func */
    app.use(async (ctx, next) => {
        if (ctx.path !== `/${action}`) await next();
        else if (ctx.method !== 'POST') {
            ctx.response.body = { action, error: true, errorMsg: 'Must use POST method!' };
            ctx.status = 405;
        } else {
            const { username, password } = ctx.request.body;
            if (typeof username === 'undefined' || typeof password === 'undefined') {
                ctx.response.body = { action, error: true, errorMsg: 'Credentials required!' };
                ctx.status = 403;
                return;
            }

            try {
                const jwb = new ZjuJwb(username, password);
                await jwb.login();
                const result = await ZjuJwb.prototype[action].call(jwb);
                ctx.response.body = { action, error: false, result };
            } catch (e) {
                log(e);
                ctx.response.body = { action, error: true, errorMsg: e.message };
                ctx.status = 403;
            }
        }
    });
    /* eslint-enable no-loop-func */
}

app.use(async (ctx) => {
    ctx.body = 'The requested resource is not found on this server.';
    ctx.status = 404;
});

app.listen(port);
log(`zju-jwb server listenening on port ${port}.`);

process.on('SIGINT', () => {
    log('zju-jwb server stopping...');
    process.exit(0);
});
