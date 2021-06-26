// wrapper for the database drivers in ./database/

module.exports = require(`./database/${process.env.DB ? process.env.DB.split("://")[0] : "dummy"}.js`);