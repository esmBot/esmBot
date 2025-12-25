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

!!! warning

    If using Docker, you will need to run the following command to correct directory permissions:
    ```sh
    # mkdir -p lavaplugins && chown -R 322:322 lavaplugins
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
