/**
 * A server running zju-jwb as a microservice using Koa.js.
 * 
 * To use this server, first you should build an .env file
 * in the root directory of the zju-jwb package according
 * to the sample.env file.
 * Second, for all available services, access them as follows:
 *
 * POST http://your_server_location:your_server_port/service_name
 * Content-Type: application/x-www-form-urlencoded
 * username=XXXXX&password=XXXXX
 *
 * Third, start the server with npm run serve.
 *
 * The services returns a JSON as response, in format as follows:
 * {
 *     action: <service_name>,
 *     error: false | true,
 *     errorMsg?: <message_of_error>,
 *     result?: <service_response>
 * }
 * Where errorMsg will only be available whtn error is true, and
 * result when error is false.
 * The value of result will be the JSON returned by the required
 * service.
 */

/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const log = require('debug')('zju-jwb/server');
const ZjuJwb = require('./index');

const app = new Koa();
const actions = ['getSyllabus'];
const port = parseInt(process.env.SERVER_PORT, 10);

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
