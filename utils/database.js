// wrapper for the database drivers in ./database/

module.exports = require(`./database/${process.env.DB_DRIVER}.js`);