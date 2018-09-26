const getin = require('./getin');
const { getSyllabus } = require('./src/syllabus');

function ZjuJwb(username, password) {
    this.loggedIn = false;
    this.username = username;
    this.password = password;
}

ZjuJwb.prototype.login = async function() {
    this.session = await getin(this.username, this.password);
    this.logginIn = true;
}

ZjuJwb.prototype.getSyllabus = async function() {
    if (!this.logginIn) throw new Error("Not logged in!");
    return await getSyllabus(this.username, this.session);
}

module.exports = ZjuJwb;
