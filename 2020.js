/*jshint esversion: 6 */
/*jslint browser: true */
/*global window */
/*global console */
/*global HBInit */


let room = HBInit({ noPlayer: true });
const DEV_NAME = "Anddy";
const DISCORD = "...";

const TEAM = {
    spec: 0,
    red: 1,
    blue: 2,
};


class Players {
    constructor() {
        this.playersInRoom = {};
        this.bannedPlayers = {};
        this.mutedPlayers = {};
        this.superAdmins = {};
    }

    autoAdmin() {
        room.setPlayerAdmin(Math.min(...this.getPlayerList().map(p => p = p.id)), true);
    }
    getPlayerList() {
        return room.getPlayerList().filter(p => p.id !== 0);
    }

    getTeamWithId(id) {
        if (id < 0 || id > 2)
            throw "Id given must be between 0 and 2 (included).";
        return this.getPlayerList().filter(p => p.team === id);
    }

    getReds() {
        return this.getTeamWithId(TEAM.red);
    }
    getBlues() {
        return this.getTeamWithId(TEAM.blue);
    }
    getSpecs() {
        return this.getTeamWithId(TEAM.spec);
    }
    getNonSpecs() {
        return this.getReds().concat(this.getBlues());
    }
    getAdmins() {
        return this.getPlayerList().filter(p => p.admin);
    }

    addPlayer(player, obj) {
        if (player == null)
            throw "Player can't be null";
        obj[player.id] = {
            auth: player.auth,
            conn: player.conn,
            name: player.name,
            date: getDate()
        };
    }

    removePlayer(player) {
        if (player == null)
            throw "Player can't be null";

        delete this.playersInRoom[player.id];
    }
}


class View {
    constructor() {
        this.texts = {
            colors: {
                resolved: 0x6fff56,
                failed: 0xf04444,
                info: 0x324e4e,
            },
            fonts: {
                info: "small-italic",
                announce: "bold",
                normal: "normal",
            },
        };
    }
    join(player) {
        room.sendAnnouncement(`Welcome ${player.name} #${player.id} at ${getDate()}, by ${DEV_NAME}.`,
            player.id, this.texts.colors.info, this.texts.fonts.info, 0);
    }

    help(player) {
        room.sendAnnouncement(`Commands: !help.`,
            player.id, this.texts.colors.info, this.texts.fonts.info, 0);
    }

    swap(player) {
        room.sendAnnouncement(`Team swapped !`,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);
    }

    clearBans(player) {
        room.sendAnnouncement(`Bans have been cleared`,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);
    }

    // TODO: store in banned players object to get the player name with banned[id]
    unban(player) {
        room.sendAnnouncement(`This player has been unbanned `,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);

    }


    notAllowed(player) {
        room.sendAnnouncement(`You were not allowed to execute this command`,
            player.id, this.texts.colors.failed, this.texts.fonts.info, 0);
    }

}

class Controller {

    constructor() {
        this.commands = {
            "help": this.help,
            "swap": this.swap,
            "s": this.swap,
            "rr": this.rr,
            "rrs": this.rrs,
            "k": this.k,
            "bb": this.bb,
            "clear": this.clear,
            "unban": this.unban,
            "fs": this.fs,
            "1": this.oneVs,
        };
    }


    isACommand(message) {
        return message.startsWith("!");
    }
    extractCommand(message) {
        let spacePos = message.search(" ");
        return message.substr(1, spacePos !== -1 ? spacePos - 1 : message.length);
    }
    resolveCommand(player, message) {
        if (!this.isACommand(message))
            return true;

        let cmd = this.extractCommand(message);
        if (this.commands.hasOwnProperty(cmd)) {
            return this.commands[cmd](player, message);
        }
        return true;
    }


    help(player) {
        _room.view.help(player);
        return false;
    }
    swap(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            _room.players.getNonSpecs().forEach(p => {
                room.setPlayerTeam(p.id, TEAM.red + (p.team === TEAM.red));
            });
            _room.view.swap(player);
        }
        return true;
    }

    rr(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            room.stopGame();
            room.startGame();
        }
        return true;
    }
    rrs(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            room.stopGame();
            this.swap(player);
            room.startGame();
        }
        return true;
    }
    k() {
        room.setKickRateLimit(6, 0, 0);
        return false;
    }

    bb(player) {
        room.kickPlayer(player.id, "bye !", false);
        return false;
    }
    clear(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            room.clearBans();
            _room.view.clearBans(player);
        }
        return false;
    }
    unban(player, message) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            let id = parseInt(message.substr("!unban ".length, message.length));
            if (!isNaN(id)) {
                room.clearBan(id);
                _room.view.unban(player);
            }
        }
        return false;
    }

    fs(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            room.setTimeLimit(7);
            room.setScoreLimit(0);
            room.setDefaultStadium("Big");
            this.k();
        }
        return false;
    }
    oneVs(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            room.setTimeLimit(3);
            room.setScoreLimit(3);
            room.setDefaultStadium("Classic");
            this.k();
        }
        return false;
    }


}



class Room {
    constructor() {
        this.players = new Players();
        this.view = new View();
        this.controller = new Controller();
    }
    onPlayerJoin(player) {
        this.players.autoAdmin();
        this.players.addPlayer(player, this.players.playersInRoom);
        this.view.join(player);
    }
    onPlayerLeave(player) {
        this.players.autoAdmin();
        this.players.removePlayer(player);
    }
    onPlayerChat(player, message) {
        return this.controller.resolveCommand(player, message);
    }

}

function getDate() {
    /* https://stackoverflow.com/a/4929629 */
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    var hh = today.getHours();
    var minu = today.getMinutes();
    var ss = today.getSeconds();

    return `${mm}/${dd}/${yyyy} at ${hh}:${minu}:${ss}`;
}


let _room = new Room();
room.onPlayerJoin = (player) => {
    _room.onPlayerJoin(player);
};

room.onPlayerLeave = (player) => {
    _room.onPlayerLeave(player);
};

room.onPlayerChat = (player, message) => {
    return _room.onPlayerChat(player, message);
};
