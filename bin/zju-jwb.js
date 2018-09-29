#!/usr/bin/env node

/**
 * A executive running zju-jwb as a microservice using Koa.js.
 *
 * You should accesss services provided by this server as follows:
 *
 * POST http://your_server_location:your_server_port/service_name
 * Content-Type: application/x-www-form-urlencoded
 * username=XXXXX&password=XXXXX
 *
 * zju-jwb.js is meant to be used as an executable, through npm i -g,
 * npm run serve, or npx zju-jwb. In the meanwhile, the package
 * should be used as a CLI as follows:
 *
 * <run zju-jwb> [-p port] [service_1 [service_2 ...]]
 *
 * Where port is the port on which the server is to run, by default
 * 3000, and service_n is the names of the services that should be
 * available on this server. Be default, all services are available.
 *
 * For a list of possible service names, see index.js for methods of
 * ZjuJwb.prototype except login().
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

const parseArgs = require('minimist');
const serve = require('../server');

const defaults = {
    _: ['getSyllabus'],
    p: 3000,
};
const argv = parseArgs(process.argv.slice(2));
const combined = { ...defaults, ...argv };

serve(combined.p, combined._);
