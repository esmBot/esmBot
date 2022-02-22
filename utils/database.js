// wrapper for the database drivers in ./database/
import { config } from "dotenv";
config();

export default await import(`./database/${process.env.DB ? process.env.DB.split("://")[0] : "dummy"}.js`);
