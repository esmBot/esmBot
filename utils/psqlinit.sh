#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL, tags json NOT NULL, prefix VARCHAR(15) NOT NULL, disabled text ARRAY NOT NULL, tags_disabled boolean NOT NULL );
    CREATE TABLE counts ( command VARCHAR NOT NULL, count integer NOT NULL );
EOSQL