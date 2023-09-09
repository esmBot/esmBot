// wrapper for the database drivers in ./database/
import "dotenv/config";

let db = null;

if (process.env.DB) {
  const dbtype = process.env.DB.split("://")[0];
  try {
    db = await import(`./database/${dbtype}.js`);
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.error(`DB config option has unknown database type '${dbtype}'`);
      process.exit(1);
    }
    throw error;
  }
}

export default db;
