# Containers

You can run the bot as well as its dependencies as a series of containers using Docker or Podman. This can allow for a slightly easier setup if you're able to run one of those two container runtimes; however, the manual setup is still recommended if you want more control over the bot.

To start, install [Docker](https://docs.docker.com/engine/install/#server) or [Podman](https://podman.io/docs/installation) on your system via the linked instructions. If using Podman, you'll also need to install [podman-compose](https://github.com/containers/podman-compose/blob/main/README.md#installation).

Once you've installed one of those, you should clone the esmBot repo:

```sh
cd ~
git clone --recurse-submodules https://github.com/esmBot/esmBot
cd esmBot
```

After this, [follow step 6 of the manual setup guide](https://docs.esmbot.net/setup/#6-configure-the-bot). Make sure to leave the `DB` variable set to the default.

You should then modify the `config/servers.json` file to change the IP addresses of the servers to match the containers. Example:

```json
{
  "lava": [{ "name": "localhost", "url": "lavalink:2333", "auth": "youshallnotpass" }]
  // ...
}
```

!!! warning "Docker only"

    On Docker, the `lavaplugins` volume is created owned by `root`, while Lavalink runs as the unprivileged `lavalink` user. Since Lavalink downloads its plugins into that volume on startup, it will fail to start with an error like this:

    ```
    Caused by: java.io.FileNotFoundException: ./plugins/lava-xm-plugin-0.2.8.jar (Permission denied)
    ```

    Podman handles volume ownership on its own, so you can skip this if you're using it.

Before starting the bot for the first time, run this command to create the plugin volume and give it to the `lavalink` user:

```sh
docker compose run --rm --user root --entrypoint chown lavalink -R lavalink:lavalink /opt/Lavalink/plugins
```

Finally, start the bot by running the following command (click to select your container runtime):

=== "Podman"

    ```sh
    podman-compose up -d
    ```

=== "Docker"

    ```sh
    docker compose up -d
    ```
