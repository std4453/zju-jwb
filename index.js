require('dotenv').config();

const getin = require('./getin');
const { getSyllabus } = require('./src/syllabus');

const username = process.env.USER, password = process.env.PASSWORD;

(async () => {
    try {
        const session = await getin(username, password);
        const syllabus = await getSyllabus(username, session);
        console.log(syllabus);
    } catch (e) {
        console.error(e);
    }
})();
