const getin = require('./src/getin');
const { getSyllabus } = require('./src/syllabus');

function ZjuJwb(username, password) {
    this.loggedIn = false;
    this.username = username;
    this.password = password;
}

/**
 * Login into jwbinfosys.zju.edu.cn system.
 * @throws If the login process failed with an error.
 */
ZjuJwb.prototype.login = async function login() {
    this.session = await getin(this.username, this.password);
    this.loggedIn = true;
};

/**
 * Get syllabus of the current school year.
 * This method should be called only after login() returned with
 * no error. this.loggedIn can be used to check whether the login
 * is successful.
 * @throws If the syllabus cannot be retrieved.
 */
ZjuJwb.prototype.getSyllabus = async function getS() {
    if (!this.loggedIn) throw new Error('Not logged in!');
    return getSyllabus(this.username, this.session);
};

module.exports = ZjuJwb;
