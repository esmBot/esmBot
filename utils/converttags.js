require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DB
});

(async () => {
  console.log("Migrating tags...");
  const guilds = (await pool.query("SELECT * FROM guilds")).rows;
  try {
    await pool.query("CREATE TABLE tags ( guild_id VARCHAR(30) NOT NULL, name text NOT NULL, content text NOT NULL, author VARCHAR(30) NOT NULL, UNIQUE(guild_id, name) )");
  } catch (e) {
    console.error(`Skipping table creation due to error: ${e}`);
  }
  for (const guild of guilds) {
    for (const [name, value] of Object.entries(guild.tags)) {
      if ((await pool.query("SELECT * FROM tags WHERE guild_id = $1 AND name = $2", [guild.guild_id, name])).rows.length !== 0) {
        await pool.query("UPDATE tags SET content = $1, author = $2 WHERE guild_id = $3 AND name = $4", [value.content, value.author, guild.guild_id, name]);
      } else {
        await pool.query("INSERT INTO tags (guild_id, name, content, author) VALUES ($1, $2, $3, $4)", [guild.guild_id, name, value.content, value.author]);
      }
      console.log(`Migrated tag ${name} in guild ${guild.guild_id}`);
    }
  }
  console.log("Done!");
  return process.exit(0);
})();