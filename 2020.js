
/*jshint esversion: 6 */
/*jslint browser: true */
/*global window */
/*global console */
/*global HBInit */


let room = HBInit({ noPlayer: true });
const DEV_NAME = "Anddy";
const DISCORD = "...";
const ADMIN_TEAM = {
    "Qk6eJltmZBTFAyR3Vw9c-I3Vj6f0wCaZbvrY8Hki3X8": "Anddy",
}

const TEAM = {
    spec: 0,
    red: 1,
    blue: 2,
};


class Players {
    constructor(inRoom, banned, muted, superAdmins) {
        this.inRoom = inRoom || {};
        this.banned = banned || {};
        this.muted = muted || {};
        this.superAdmins = superAdmins || {};
        this.idPlayer = 0;
    }

    autoAdmin(player) {
        room.setPlayerAdmin(Math.min(...this.getPlayerList().map(p => p = p.id)), true);
        if (player != null && this.superAdmins.hasOwnProperty(player.auth))
            room.setPlayerAdmin(player.id, true);
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

    updateAdminLastJoin(player) {
        if (this.superAdmins.hasOwnProperty(player.auth))
            this.superAdmins[player.auth].lastJoin = getDate();
    }
    addAdmin({ player, auth, name } = {}) {
        if (auth == null) {
            this.superAdmins[this.inRoom[player.id].auth] =
                { name: player.name, id: this.idPlayer++, date: getDate(), lastJoin: getDate() };
        }
        else {
            this.superAdmins[auth] =
                { name: name, id: this.idPlayer++, date: getDate(), lastJoin: getDate() };
        }
    }
    deleteAdmin(id) {
        let auth = Object.keys(this.superAdmins).
            find(auth => this.superAdmins[auth].id === id);
        if (auth != null) {
            let name = this.superAdmins[auth].name;
            delete this.superAdmins[auth];
            return name;
        }
    }

    removePlayer({ player, obj, id }) {
        if (player == null)
            return delete obj[id];

        return delete obj[player.id];
    }
    isSuperAdmin(player) {
        return this.superAdmins.hasOwnProperty(this.inRoom[player.id].auth);
    }

    initAdmins() {
        Object.entries(ADMIN_TEAM).forEach(([auth, name]) => {
            this.addAdmin({ auth: auth, name: name });
        })
    }
    reset(obj) {
        Object.keys(obj).forEach(k => delete obj[k]);
    }
    moveFirstPlayerTo(team, teamFunctionName) {
        let p = _room.players.getSpecs()[0];
        if (p != null) {
            _room.players[teamFunctionName]().forEach(p => room.setPlayerTeam(p.id, TEAM.spec));
            room.setPlayerTeam(p.id, team);
        }
        _room.controller.rr();
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

    unban(player) {
        room.sendAnnouncement(`This player has been unbanned `,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);

    }

    notAllowed(player) {
        room.sendAnnouncement(`You were not allowed to execute this command`,
            player.id, this.texts.colors.failed, this.texts.fonts.info, 0);
    }

    failed(player) {
        room.sendAnnouncement(`The command you tried to execute failed`,
            player.id, this.texts.colors.failed, this.texts.fonts.info, 0);
    }

    unbanAfterBan(player) {
        room.sendAnnouncement(`${player.name} has been unbanned `,
            null, this.texts.colors.resolved, this.texts.fonts.info, 0);
    }

    addAdmin(player, newAdmin) {
        room.sendAnnouncement(`${newAdmin.name} has been added as super admin `,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);
    }

    removeAdmin(player, name = "nobody") {
        room.sendAnnouncement(`${name} has been removed from super admin `,
            player.id, this.texts.colors.resolved, this.texts.fonts.info, 0);
    }

    adminList(player) {
        Object.entries(_room.players.superAdmins).forEach(([auth, p]) => {
            room.sendAnnouncement(`${p.name}: { id: ${p.id}, since: ${p.date}, last connexion: ${p.lastJoin} }`,
                player.id, this.texts.colors.info, this.texts.fonts.info, 0);
        })
    }
    banList(player) {
        Object.entries(_room.players.banned).forEach(([id, p]) => {
            room.sendAnnouncement(`${id}: ${p.name}`,
                player.id, this.texts.colors.info, this.texts.fonts.info, 0);
        })
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
            "add": this.addAdmin,
            "rm": this.removeAdmin,
            "admins": this.adminList,
            "bans": this.banList,
            "sb": this.firstSpecToBlue,
            "sr": this.firstSpecToRed,
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

    static getIdFromMessage(message, cmd) {
        return parseInt(message.substr(cmd.length + 1, message.length));
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
        if (player != null && !player.admin) {
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
        if (!_room.players.isSuperAdmin(player)) {
            _room.view.notAllowed(player);
        } else {
            room.clearBans();
            _room.players.reset(_room.players.banned);
            _room.view.clearBans(player);
        }
        return false;
    }
    unban(player, message) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            let id = Controller.getIdFromMessage(message, "!unban");
            if (!isNaN(id)) {
                room.clearBan(id);
                _room.players.removePlayer({ id: id, obj: _room.players.banned });
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
    addAdmin(player, message) {
        if (!_room.players.isSuperAdmin(player)) {
            _room.view.notAllowed(player);
        } else {
            let id = Controller.getIdFromMessage(message, "!add");
            let p;
            if (!isNaN(id) && (p = room.getPlayer(id)) != null) {
                _room.players.addAdmin({ player: p });
                _room.view.addAdmin(player, p);
            }
            else {
                room.view.failed(player);
            }
        }
        return false;
    }
    removeAdmin(player, message) {
        if (!_room.players.isSuperAdmin(player)) {
            _room.view.notAllowed(player);
        } else {
            let id = Controller.getIdFromMessage(message, "!rm");
            if (!isNaN(id)) {
                let name = _room.players.deleteAdmin(id);
                _room.view.removeAdmin(player, name);
            }
            else {
                _room.view.failed(player);
            }
        }
        return false;
    }
    adminList(player) {
        _room.view.adminList(player);
        return false;
    }
    banList(player) {
        _room.view.banList(player);
        return false;
    }

    firstSpecToRed(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            _room.players.moveFirstPlayerTo(TEAM.red, "getReds");
        }
    }
    firstSpecToBlue(player) {
        if (!player.admin) {
            _room.view.notAllowed(player);
        } else {
            _room.players.moveFirstPlayerTo(TEAM.blue, "getBlues");
        }
    }
}


class Room {
    constructor() {
        this.players = new Players();
        this.view = new View();
        this.controller = new Controller();
    }
    onPlayerJoin(player) {
        this.players.autoAdmin(player);
        this.players.addPlayer(player, this.players.inRoom);
        this.players.updateAdminLastJoin(player);
        this.view.join(player);
    }
    onPlayerLeave(player) {
        this.players.autoAdmin();
        this.players.removePlayer({ player: player, obj: this.players.inRoom });
    }
    onPlayerChat(player, message) {
        return this.controller.resolveCommand(player, message);
    }
    onPlayerKicked(player, message, ban, by) {
        if (by.id === 0) return;
        if (ban) {
            if (!this.players.superAdmins.hasOwnProperty(this.players.inRoom[by.id].auth)) {
                room.clearBan(player.id);
                room.kickPlayer(by.id, "You can't ban a player", true);
                this.view.unbanAfterBan(player);
                this.players.addPlayer(by, this.players.banned);
            }
            else {
                this.players.addPlayer(player, this.players.banned);
            }
        }
    }
    onRoomLink() {
        this.players.initAdmins();
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

room.onPlayerKicked = (player, message, ban, by) => {
    _room.onPlayerKicked(player, message, ban, by);
};

room.onRoomLink = () => {
    _room.onRoomLink();
};
