// wrapper for the database drivers in ./database/

export default await import(`./database/${process.env.DB ? process.env.DB.split("://")[0] : "dummy"}.js`);