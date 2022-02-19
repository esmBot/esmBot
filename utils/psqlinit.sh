#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL PRIMARY KEY, prefix VARCHAR(15) NOT NULL, disabled text ARRAY NOT NULL, disabled_commands text ARRAY NOT NULL, accessed timestamp );
    CREATE TABLE counts ( command VARCHAR NOT NULL PRIMARY KEY, count integer NOT NULL );
    CREATE TABLE tags ( guild_id VARCHAR(30) NOT NULL, name text NOT NULL, content text NOT NULL, author VARCHAR(30) NOT NULL, UNIQUE(guild_id, name) );

    CREATE TABLE settings ( id smallint PRIMARY KEY, version integer NOT NULL, CHECK(id = 1) );
    INSERT INTO settings (id, version) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;
EOSQL
