# Containers
You can run the bot as well as its dependencies as a series of containers using Docker or Podman. This can allow for a slightly easier setup if you're able to run one of those two container runtimes; however, the manual setup is still recommended if you want more control over the bot.

To start, install [Docker](https://docs.docker.com/engine/install/#server) or [Podman](https://podman.io/docs/installation) on your system via the linked instructions. If using Podman, you'll also need to install [podman-compose](https://github.com/containers/podman-compose/blob/main/README.md#installation).

Once you've installed one of those, you should clone the esmBot repo:
```sh
cd ~
git clone --recurse-submodules https://github.com/esmBot/esmBot
cd esmBot
```
Modify the `.env` file as described in step 6 of the manual setup. Make sure to change the `DB` option to this, however:
```
DB=postgresql://esmbot:verycoolpass100@postgres:5432/esmbot
```
You should then modify the `config/servers.json` file to change the IP addresses of the servers to match the containers. Example:
```json
{
  "lava": [
    { "name": "localhost", "url": "lavalink:2333", "auth": "youshallnotpass" }
  ],
  "image": [
    { "server": "api", "auth": "verycoolpass100", "tls": false }
  ]
}
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