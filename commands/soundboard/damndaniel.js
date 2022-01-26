import { play } from "../../utils/soundplayer.js";
import MusicCommand from "../../classes/musicCommand.js";

class DamnDanielCommand extends MusicCommand {
    async run() {
        return await play(this.client, "./assets/audio/damndaniel.ogg", this.message);
    }

    static description = "Plays the \"damn daniel\" sound effect";
    static aliases = ["daniel", "damn"];
}

export default DamnDanielCommand;
