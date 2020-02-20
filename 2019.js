/*jshint esversion: 6 */
/*jslint browser: true */
/*global window */
/*global console */
/*global HBInit */

// TODO: MOTM
// red "🌿🔴[EFC Futsal] ◻️ discord.gg/jTn2ZDp"         "code": "eu", "lat": 48.1371535, "lon": 11.5761235};
// bleu "🌿🔵[EFC Futsal] ◻️ Sign up & Register"       "code": "eu", "lat": 48.1371545, "lon": 11.5761245};
// white "🌿⚪[EFC Futsal] ◻️ Play with friends"                "code": "eu", "lat": 48.1371540, "lon": 11.5761240};
// black "🌿⚫[EFC Futsal] ◻️ New Season 4"           "code": "eu", "lat": 48.1371540, "lon": 11.5761240};
// orange  🌿☢️[EFC Futsal] ◻️ Join us !"             "code": "eu", "lat": 48.1371550, "lon": 11.5761250};
var MAX_PLAYERS = 15;

let geo = { "code": "eu", "lat": 48.1371540, "lon": 11.5761240 };
var room = HBInit({
    roomName: "🌿⚫[EFC Futsal] ◻️ New Season 4",
    playerName: "Phoenix 🦅", maxPlayers: MAX_PLAYERS, public: false, geo
});

let first_stadium_loaded = false;
room.setDefaultStadium("Small");
room.setScoreLimit(3);
room.setTimeLimit(3);
room.setTeamsLock(true);




class Player {
    constructor(name) {
        this.name = name;
        /*************************************
        ************ Individual stats**********
        **************************************/
        this.goals = 0; /* Number of goals */
        this.assists = 0; /* Number of assists */
        this.cs = 0; /* Number of cleensheets */
        this.ownGoals = 0; /* Number of own goals */
        this.wins = 0; /* Number of wins */
        this.loses = 0; /* Number of loses */
        this.motm = 0; /* Number of time a player is the man of the match */
        this.playedGk = 0;

        this.badPasses = 0; /* Number of passes */
        this.goodPasses = 1; /* Number of passes that reached a team mate */
        this.passAcc = 0; /* Pass accuracy % */
        this.motmRatio = 0; /* Man of the match % */
        this.winsRatio = 0; /* Wins / Loses */
        this.csPG = 0; /* CS % per game */
        this.goalsPG = 0; /* Number of goals per game */
        this.assistsPG = 0; /* Number of assists per game */
        this.elo = 1000; /* ELO */

        this.secsPlayed = 0; /* Number of mins played */
        this.minsPlayed = 0; /* Number of mins played */
        this.currentStreak = 0; /* Number of current matches won in a row */
        this.bestStreak = 0; /* Number of maximum amount of wins in a row */
        this.statsString1 = "";
        this.statsString2 = "";
        this.statsString3 = "";
        /*************************************
        ************ Haxball manager**********
        **************************************/
        this.gameStarted = 0;
        this.price = 10;
        this.money = 100;
        this.currentBet = 0;
        this.winPred = 0;
        this.dreamTeam = { "gk": null, "dm": null, "am": null, "st": null };
        this.teamScore = 0;

        /*************************************
        ************ Revelant to the room*****
        **************************************/
        this.team = 0;
        this.gotKicked = 0; /* Number of time this player got kicked by another player */
        this.kickedSomeone = 0; /* Number of time this player kicked someone */
        this.id = 0; /* Current player's id on the room */
        this.pw = 0; /* Password for player's account */
        this.isTrustedAdmin = 0; /* Whether he's a trusted admin */
        this.logged = 1; /* 0 if the player is not in the room, 1 if he's */
        this.isBanned = 0; /* Whether a player is banned */
        this.isPermaBanned = 0; /* Whether a player is banned permanently*/
        this.isRegistered = 0; /* Whether a player is registered (e.g. his stats will count) */
        this.auth = 0; /* Player's last auth */
        this.conn = 0; /* Player's last conn */
        this.isMuted = 0; /* Whether a player is muted */
        this.isAFK = false;
    }


    updateGoals() {
        if (gameStats.scorers.hasOwnProperty(this.name))
            this.goals += gameStats.scorers[this.name];
    }
    updateAssists() {
        if (gameStats.assisters.hasOwnProperty(this.name))
            this.assists += gameStats.assisters[this.name];
    }
    updateCs() {
        let [team, idteam] = this.team === 1 ? ["blueScore", 1] : ["redScore", 2];
        this.cs += gameStats[team] === 0 &&
            this.name === gameStats.Gks[idteam - 1];
    }
    updateOG() {
        if (gameStats.ownScorers.hasOwnProperty(this.name))
            this.ownGoals += gameStats.ownScorers[this.name];
    }
    updatePlayedGk() {
        this.playedGk += gameStats.Gks.includes(this.name);
    }
    updateWins(winningTeam) {
        this.wins += this.team === winningTeam;
    }

    updateLoses(losingTeam) {
        this.loses += this.team === losingTeam;
    }
    updateWinRatio() {
        this.winsRatio = ((this.wins / (this.wins + this.loses)) * 100).toFixed(2) || 0;
    }
    updateGoalsPG() {
        this.goalsPG = (this.goals / (this.loses + this.wins)).toFixed(2) || 0;
    }
    updateAssistsPG() {
        this.assistsPG = (this.assists / (this.loses + this.wins)).toFixed(2) || 0;
    }
    updateCSPG() {
        this.csPG = ((this.cs / this.playedGk) * 100).toFixed(2) || 0;
    }
    updateCurrentStreak(won) {
        this.currentStreak = won === this.team ? this.currentStreak + 1 : 0;
    }

    updateBestStreak() {
        this.bestStreak = this.currentStreak >= this.bestStreak ?
            this.currentStreak : this.bestStreak;
    }
    updateSecsPlayed() {
        this.secsPlayed += Number(((this.team !== 0) / 60).toFixed(2));
    }
    updateMinsPlayed() {
        this.minsPlayed = Math.floor((this.secsPlayed / 60));
    }

    updatePassAccuracy() {
        this.passAcc = ((this.goodPasses / (this.goodPasses + this.badPasses)) * 100).toFixed(2);
    }
    updateKickedSomeone() {
        this.kickedSomeone += this.isTrustedAdmin === 0;
    }
    updatePassword(m) {
        this.pw = m;
    }
    updateMoney(won) {
        let diff = won == this.winPred ? this.currentBet : -1 * this.currentBet;
        this.money += diff;
        this.currentBet = 0;
        this.winPred = 0;
    }
    disconnect() {
        this.logged = 0;
        this.isTrustedAdmin = 0;
        this.price = 0;
    }

    statsToString() {
        this.statsString1 = " | Goals: " + this.goals + " | Assists: " + this.assists +
            " | Own goals: " + this.ownGoals + " | cs: " + this.cs +
            " | Wins: " + this.wins + " | Losses: " + this.loses;

        this.statsString2 = " | MOTM: " + "[Soon]" +
            " | MOTMR: " + "[Soon]" + " | W/L %: " + this.winsRatio +
            " | Pass acc %: " + this.passAcc + " | Elo: " + this.elo;

        this.statsString3 = " | GPG: " + this.goalsPG + " | APG: " + this.assistsPG +
            " | csPG %: " + this.csPG + " | Best streak: " + this.bestStreak +
            " | Mins: " + this.minsPlayed + "| EFCOINS: " + this.money;
    }
    displayStats(query_id) {
        this.statsToString();
        room.sendChat(this.statsString1, query_id);
        room.sendChat(this.statsString2, query_id);
        room.sendChat(this.statsString3, query_id);
        this.statsString1 = this.statsString2 = this.statsString3 = "";
    }
    updateEGStats() {
        let winners = gameStats.redScore > gameStats.blueScore ? 1 : 2;
        let losers = 1 + (winners === 1);
        this.updateGoals();
        this.updateAssists();
        this.updateOG();
        this.updateWins(winners);
        this.updateLoses(winners - 1);
        this.updatePlayedGk();


        this.updateWinRatio();
        this.updateGoalsPG();
        this.updateAssistsPG();
        this.updateCSPG();
        this.updatePassAccuracy();
        this.updateCurrentStreak(winners);
        this.updateBestStreak(winners);
        this.updateCs();
        this.updateMoney(winners);
    }
}




class GameStats {
    constructor() {
        this.redScore = 0; /* Number of goals red team scored this match */
        this.blueScore = 0; /* Number of goals blue team scored this match */
        this.Gks = ["", ""]; /* Name of the gks */
        this.scorers = {}; /* {name: number_of_goals_scored} */
        this.assisters = {};  /* {name: number_of_assists} */
        this.ownScorers = {};  /* {name: number_of_own_goals} */
        this.redTeam = [];  /* [name of the players in red team] */
        this.blueTeam = []; /* [name of the players in blue team] */
        this.matchsumup = [];
        this.isOvertime = false;
        this.hasStarted = false;
        this.rec = false;
    }
    updateScore(team) {
        this.redScore += team === 1;
        this.blueScore += team === 2;
    }

    updateGK() {
        var players = room.getPlayerList();
        var min = players[0];
        min.position = { x: room.getBallPosition().x + 60 };
        var max = min;

        for (var i = 1; i < players.length; i++) {
            if (players[i].position !== null) {
                if (min.position.x > players[i].position.x) min = players[i];
                if (max.position.x < players[i].position.x) max = players[i];
            }
        }
        this.Gks = [min.name, max.name];
    }
    updateScorers(p, team) {
        if (p !== undefined && p.team === team) updateObject(this.scorers, p);
    }
    updateAssisters(p, team) {
        if (p !== undefined && p.team === team) updateObject(this.assisters, p);
    }
    updateOwnScorers(p, team) {
        if (p.team !== team) updateObject(this.ownScorers, p);
    }

    updateRedTeam() {
        this.redTeam = room.getPlayerList().filter(player => player.team === 1);
    }
    updateBlueTeam() {
        this.blueTeam = room.getPlayerList().filter(player => player.team === 2);
    }
    updateOvertime() {
        this.isOvertime = true;
    }
    sumMatch(p) {
        if (lastMatchSumUp.length === 0) return;
        let last_match = lastMatchSumUp.length - 1;
        let last_match_length = lastMatchSumUp[last_match].length;
        for (var i = 0; i < last_match_length; i++) {
            room.sendChat(lastMatchSumUp[last_match][i], p.id);
        }
    }

}



class GameControl {
    constructor(radiusBall) {
        this.radiusBall = radiusBall || 10;
        this.triggerDistance = this.radiusBall + 15 + 0.1;
        this.currentBallOwner = "";
        this.lastBallOwners = ["", ""]; /* [name: name] */
        this.passesInARow = { "red": 0, "blue": 0 }; /* {team: max} */
        this.maxPassesInARow = 0;
        this.redPoss = 0;
        this.bluePoss = 0;
        this.smth = "";
    }
    resetBallOwner() {
        this.currentBallOwner = "";
        this.lastBallOwners = ["", ""];
    }
    updateBallOwner() {
        var ballPosition = room.getBallPosition();
        var players = room.getPlayerList();
        var distanceToBall;
        for (var i = 0; i < players.length; i++) {
            if (players[i].position != null) {
                distanceToBall = pointDistance(players[i].position, ballPosition);
                if (distanceToBall < this.triggerDistance) {
                    this.currentBallOwner = players[i].name;
                }
            }
        }
    }
    updateLastBallOwners() {
        if (this.currentBallOwner !== "" &&
            this.currentBallOwner !== this.lastBallOwners[0]) {

            this.lastBallOwners[1] = this.lastBallOwners[0];
            this.lastBallOwners[0] = this.currentBallOwner; // last player who touched the ball
        }
    }
    updatePassesInARow() {
        if (gameStats.redTeam.length !== gameStats.blueTeam.length ||
            gameStats.redTeam.length < 2) return;

        if (this.lastBallOwners[1] !== "" && this.smth !== this.currentBallOwner) {

            if (Stats[this.lastBallOwners[0]].team ===
                Stats[this.lastBallOwners[1]].team) {

                Stats[this.lastBallOwners[1]].goodPasses++;


                if (Stats[this.lastBallOwners[0]].team === 1) {
                    this.passesInARow.red += 1;
                    this.updateMaxPassesInARow("blue");
                    this.passesInARow.blue = 0;
                }
                else {
                    this.passesInARow.blue += 1;
                    this.updateMaxPassesInARow("red");
                    this.passesInARow.red = 0;

                }
            }
            else {
                Stats[this.lastBallOwners[1]].badPasses++;
            }

            this.smth = this.currentBallOwner;
        }
    }
    updateMaxPassesInARow(team) {
        this.maxPassesInARow = this.passesInARow[team] > this.maxPassesInARow ?
            this.passesInARow[team] : this.maxPassesInARow;
    }
}


class Records {
    constructor() {
        this.bestPassesInARow = 0;
        this.bestAccuracy = "";
        this.bestStreak = {}; /*{[team]: score};*/
        this.fastestWin = 0;
        this.longestMatch = 0;
    }
    updateBestPassesInARow() {
        this.bestPassesInARow = this.maxPassesInARow > this.bestPassesInARow ?
            this.passesInARow : this.bestPassesInARow;

    }
}

class ELO {
    constructor() {
        this.redAverage = 0;
        this.blueAverage = 0;
        this.redChanceToWin = 0;
        this.blueChanceToWin = 0;
        this.redRating = 0;
        this.blueRating = 0;
    }
    getAverageRank(team) {
        let average = 0;
        for (var i = 0; i < team.length; i++) {
            average += Stats[team[i].name].elo;
        }
        return average / team.length;
    }
    updateTeamAverages() {
        this.redAverage = this.getAverageRank(gameStats.redTeam);
        this.blueAverage = this.getAverageRank(gameStats.blueTeam);
    }
    updateChancesToWin() {
        this.redChanceToWin = 1 / (1 + Math.pow(10, (this.blueAverage - this.redAverage) / 400));
        this.blueChanceToWin = 1 / (1 + Math.pow(10, (this.redAverage - this.blueAverage) / 400));
    }
    updateRating(rwin, bwin) {
        this.redRating = Math.round(32 * (rwin - this.redChanceToWin));
        this.blueRating = Math.round(32 * (bwin - this.blueChanceToWin));
    }
    handleEloCalc() {
        this.updateTeamAverages();
        this.updateChancesToWin();
    }
    updateElo() {
        if (gameStats.redTeam.length === gameStats.blueTeam.length) {
            let winners = gameStats.redScore > gameStats.blueScore;
            let pr, pb;
            this.updateRating(winners, !winners);
            for (var i = 0; i < gameStats.redTeam.length; i++) {
                pr = gameStats.redTeam[i].name;
                pb = gameStats.blueTeam[i].name;

                Stats[pr].elo += this.redRating;
                Stats[pb].elo += this.blueRating;
            }
        }
    }
}

/**************************************************************
* ************************** ADMINS    ************************
***************************************************************/

var headAdminsAuths = {
    "Et576Ip_llwpLQe7PAq-0x-Ont8-slyZM4wlbeCVcBg": "Mona1",
    "FD7dcGdmO0W4TdrP7T6m57xzcFtoDl05MOu5sxHdwx0": "Kang1",
    "xE5ePWxHAYRejeCWVln_H8ArK-ZsAXQlbYbo5pqcwZY": "Tidus"

};

var roomAdminsAuth = {
    "Et576Ip_llwpLQe7PAq-0x-Ont8-slyZM4wlbeCVcBg": "Mona1",
    "FD7dcGdmO0W4TdrP7T6m57xzcFtoDl05MOu5sxHdwx0": "Kang1",
    "xE5ePWxHAYRejeCWVln_H8ArK-ZsAXQlbYbo5pqcwZY": "Tidus",
    "dOKIGfR8z70iF3KxsXS5zNkvg1Xaj-fC4ocgX9JrtNQ": "Common",
    "D2BOPzz1QJg0KOco6LHgPVwgrbZdCMjDC3AsVxswaMM": "DbK1",
    "kF0mUASq7VGKC5zb2rth8Bs58rfQvmAbTfxjKqUWgBk": "Lethal1",
    "xsAMlZWedf3R0msP7PcPtgthtHfauaHUvthdGnxPJ3M": "Alexinhooooo1",
    "NzU6hY8_OxYfJq4az7V7WFE-1fWGXV0-C0qzf4IOtX4": "Kamikaze1",
    "P9kK4sqeLYHpv2J5VgKa8iP1mIK_X1rrbA_3_a6TVpE": "Ben Simmons1"

};

function lastPlace() {
    var players = room.getPlayerList();
    if (players.length == 15)
        room.setPassword("efc2040");

    if (players.length < 15)
        room.setPassword();

}

function kickFakeAdmin(player) {
    if (player.name === "Mona" && player.auth != "Et576Ip_llwpLQe7PAq-0x-Ont8-slyZM4wlbeCVcBg") {
        room.kickPlayer(player.id, "Fake! There is only one Mona", true);
    }
    if (player.name === "Kang" && player.auth != "FD7dcGdmO0W4TdrP7T6m57xzcFtoDl05MOu5sxHdwx0") {
        room.kickPlayer(player.id, "Fake! There is only one Kang", true);
    }

}

function doubleSpace(player) {
    thename = player.name
    if (thename.includes("  ")) {
        room.kickPlayer(player.id, "Take the spaces off your nickname", false);
        console.log("🚫🚫🚫 " + player.name + " has been kicked for double space in his name");
    }
}




/* PLAYER FUNCTIONS */

var teamRed;
var teamBlue;
var teamSpec;

function updateTeams(player) { // update the players' list and all the teams' list
    players = room.getPlayerList().filter((player) => player.id != 0);
    teamRed = players.filter(player => player.team === 1);
    teamBlue = players.filter(player => player.team === 2);
    teamSpec = players.filter(player => player.team === 0);
}

var Team = {
    SPECTATORS: 0,
    RED: 1,
    BLUE: 2
};

function chooseNumberRed(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) {
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) {
                if (!Number.isNaN(Number.parseInt(message[0]))) {
                    if (Number.parseInt(message[0]) > teamSpec.length || Number.parseInt(message[0]) < 1) {
                        room.sendChat("Invalid Number !", player.id);
                        return false;
                    }
                    else {
                        room.setPlayerTeam(teamSpec[Number.parseInt(message[0]) - 1].id, 1);
                        return false;
                    }
                }
            }
        }
    }
}

function chooseNumberBlue(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) {
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) {
                if (!Number.isNaN(Number.parseInt(message[0]))) {
                    if (Number.parseInt(message[0]) > teamSpec.length || Number.parseInt(message[0]) < 1) {
                        room.sendChat("Invalid number !", player.id);
                        return false;
                    }
                    else {
                        room.setPlayerTeam(teamSpec[Number.parseInt(message[0]) - 1].id, 2);
                        return false;
                    }
                }
            }
        }
    }
}




function startBig() {
    if (teamRed.length === 4 && teamBlue.length === 4) {
        room.setCustomStadium(maps.big);
        room.startGame();
    }
    if ((teamRed.length === 3 && teamBlue.length === 3) &&
        !(teamSpec.length > 2)) {
        room.setCustomStadium(maps.medium);
        room.startGame();
    }
    if ((teamRed.length === 2 && teamBlue.length === 2) &&
        !(teamSpec.length > 2)) {
        room.setCustomStadium(maps.small);
        room.startGame();
    }
    if ((teamRed.length === 1 && teamBlue.length === 1) &&
        !(teamSpec.length > 2)) {
        room.setCustomStadium(maps.small);
        room.startGame();
    }
}

function loadFirstMap() {
    var players = room.getPlayerList();
    if (players.length < 6) {
        room.setCustomStadium(maps.small);
    }
}


var redCaptainChoice = "";
var blueCaptainChoice = "";

function chooseTopRed(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "top") {
                    room.setPlayerTeam(teamSpec[0].id, 1);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function chooseTopBlue(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "top") {
                    room.setPlayerTeam(teamSpec[0].id, 2);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function chooseTopRed2(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "Top") {
                    room.setPlayerTeam(teamSpec[0].id, 1);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function chooseTopBlue2(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "Top") {
                    room.setPlayerTeam(teamSpec[0].id, 2);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function chooseTopRed3(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "TOP") {
                    room.setPlayerTeam(teamSpec[0].id, 1);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function chooseTopBlue3(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "TOP") {
                    room.setPlayerTeam(teamSpec[0].id, 2);
                    redCaptainChoice = "top";
                    return false;
                }
            }
        }
    }
}

function getRandomInt2(max) { // returns a random number from 0 to max-1
    return Math.floor(Math.random() * Math.floor(3));
}

function chooseAutoRed(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "auto") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 1);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoBlue(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "auto") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 2);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoRed2(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "Auto") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 1);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoBlue2(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "Auto") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 2);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoRed3(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "random") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 1);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoBlue3(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "random") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 2);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoRed4(player, message) {
    if (teamRed.length !== 0 && teamBlue.length !== 0) {
        if (player.id == teamRed[0].id || player.id == teamBlue[0].id) { // we care if it's one of the captains choosing
            if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) { // we care if it's red turn && red cap talking
                if (message === "rand") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 1);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}

function chooseAutoBlue4(player, message) {
    if (teamBlue.length !== 0 && teamRed.length !== 0) {
        if (player.id == teamBlue[0].id || player.id == teamRed[0].id) { // we care if it's one of the captains choosing
            if (teamBlue.length <= teamRed.length && player.id == teamBlue[0].id) { // we care if it's red turn && red cap talking
                if (message === "rand") {
                    var r = getRandomInt2(teamSpec.length);
                    room.setPlayerTeam(teamSpec[r].id, 2);
                    redCaptainChoice = "random";
                    return false;
                }
            }
        }
    }
}





function moveSpec(winners) {

    if (winners == "red") {
        var blues = getBlueTeam();
        blues.reverse(); //reverse order of putting specs
        var i;
        for (i = 0; i < blues.length; i++) //loop on blue team and spec them
        {
            room.setPlayerTeam(blues[i].id, 0);
        }
        var specs = getSpectators();
        if (specs.length != 0)
            room.setPlayerTeam(specs[0].id, 2); //moving top spec to blue team
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
    } else if (winners == "blue") {
        var reds = getRedTeam();
        reds.reverse(); //reverse order of putting specs
        var i;
        for (i = 0; i < reds.length; i++) //loop on red team and spec them
        {
            room.setPlayerTeam(reds[i].id, 0);
        }
        var specs = getSpectators();
        if (specs.length != 0)
            room.setPlayerTeam(specs[0].id, 1); //moving top spec to red team
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
        room.sendChat("🚨CHOOSE🚨 Hey " + specs[0].name + " ! Type a player's position(1 ,2 ,3 ,4) or use top, auto ! 🚨CHOOSE🚨", specs[0].id);
    }
}

//returns list of players in blue team
function getBlueTeam() {
    var blueTeam = room.getPlayerList().filter((player) => player.team == 2);
    return blueTeam;
}

//returns list of players in red team
function getRedTeam() {
    var redTeam = room.getPlayerList().filter((player) => player.team == 1);
    return redTeam;
}

//returns list of players in spectators
function getSpectators() {
    var specs = room.getPlayerList().filter((player) => (player.team == 0 && player.id != 0)); //d
    return specs;
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


var adminSelect = ["goals", "assists", "cs", "wins", "elo", "bestStreak", "minsPlayed", "money"];


function updateAdmins() {
    var players = room.getPlayerList().filter((player) => player.id != 0);
    var admins = room.getPlayerList().filter((player) => player.id != 0 && player.admin == false);
    if (players.length == 0 || admins.length == 0 || players.length - admins.length >= 2) return;
    let select = adminSelect[getRandomInt(adminSelect.length - 1)];

    admins.sort(function (a, b) {
        return Stats[b.name][select] - Stats[a.name][select];
    });
    room.setPlayerAdmin(admins[0].id, true);

}

function updateSelectedAdmins() {
    var players = room.getPlayerList().filter((p) => p.id != 0 && p.admin === true);
    for (var i = 0; i < players.length; i++) {
        room.setPlayerAdmin(players[i].id,
            Stats[players[i].name].isTrustedAdmin >= 1);
    }
}


function superAdmin(p) {
    if (headAdminsAuths.hasOwnProperty(Stats[p.name].auth)) {
        var players = room.getPlayerList().filter((p) => p.admin === true);
        for (var i = 0; i < players.length; i++) {
            room.setPlayerAdmin(players[i].id,
                Stats[players[i].name].isTrustedAdmin >= 1);
        }
        room.setPlayerAdmin(p.id, true);
        Stats[p.name].isTrustedAdmin = 3;
        room.sendChat("You got level 3 admin ! ", p.id);
    }
    return false;
}

function getAdmin(p, m) {
    if (roomAdminsAuth.hasOwnProperty(Stats[p.name].auth)) {
        room.setPlayerAdmin(p.id, true);
        Stats[p.name].isTrustedAdmin = 1;
        room.sendChat("You got level 1 admin ! ", p.id);
    }
    return false;
}

function getAdmin2(p, m) {
    if (headAdminsAuths.hasOwnProperty(Stats[p.name].auth)) {
        room.setPlayerAdmin(p.id, true);
        Stats[p.name].isTrustedAdmin = 2;
        room.sendChat("You got level 2 admin ! ", p.id);
    }
    return false;
}

function addAdmin(p, m) {
    if (Stats[p.name].isTrustedAdmin >= 2) {
        m = m.substr("!addadmin".length + 1);
        roomAdminsAuth[Stats[m].auth] = m;
        room.sendChat("Succes.", p.id);
    }
    return false;
}


/**************************************************************
* ************************** ANTI SPAM ************************
* Function to call: handleSpam in room.onPlayerChat with
* lastWriters and player as argument.
* Purpose: This will kick a player after he talks 5 times
*   in a row.
* Based on: player's id.
* To change the number of chats allowed in a row, change the
*   const MAX_CHAT_IN_A_ROW to what you want.
* Global variables used:
*   lastWriters (array of int)
*   const int MAX_CHAT_IN_A_ROW
*   const string KICK_MESSAGE_SPAM
***************************************************************/
var lastWriters = [];
const MAX_CHAT_IN_A_ROW = 5;
const KICK_MESSAGE_SPAM = "Spam/Chat Pollution";

/**************************************************************
* Function returning how much time the last player who wrote
* in chat has previously written.
***************************************************************/

function checkSpam(lastWriters, p) {
    let c = 0;
    for (var i = 0; i < lastWriters.length; i++) {
        c += lastWriters[i] === p.id;
    }
    return c;
}

/**************************************************************
* Function updating the array by deleting the first element
* and adding the last player who talked.
***************************************************************/
function updateLastWriters(lastWriters, p) {
    lastWriters.splice(0, 1);
    lastWriters.push(p.id);

}

/**************************************************************
* Function updating the array and kicking a spammer with the
* message KICK_MESSAGE_SPAM.
* When the array's length is smaller than MAX_CHAT_IN_A_ROW
* (so at the beginning of a room) it doesnt check spam
* but simply fills it.
***************************************************************/


function handleSpam(lastWriters, p) {
    if (lastWriters.length === MAX_CHAT_IN_A_ROW) {
        updateLastWriters(lastWriters, p);
        let res = checkSpam(lastWriters, p);

        if (res === MAX_CHAT_IN_A_ROW) {
            Stats[p.name].isMuted = 1;
            room.sendChat("🔇🔇🔇 You have been muted for Spam or Chat pollution!", p.id);
            console.log("🔇🔇🔇 " + p.name + " has been muted for Spam or Chat pollution");
        }
    }
    else {
        lastWriters.push(p.id);
    }
}


/**************************************************************
* ************************** SWAP *****************************
* Function to call: swap
* If it's used as a command, the parameter has to be an admin player.
* Otherwise this function can just be called with no param to work.
* This function put the red (resp blue) team into blue (resp red).
* Global variable used: None.
***************************************************************/


function swap(player) {
    if (player === undefined || player.admin) {
        var p = room.getPlayerList().filter((player) => player.id != 0);
        for (let i = 0; i < p.length; i++) {
            if (p[i].team !== 0) {
                room.setPlayerTeam(p[i].id, 1 + (p[i].team === 1));
            }
        }
    }
}


/**************************************************************
* ************************** PM *******************************
* Function to call: sendPM.
* Use: @player [message]
* This function will send a private message to the player.
* Global variable used: None.
***************************************************************/

function sendPM(p, m) {
    if (m.startsWith("@") === true) {
        let spacePos = m.search(" ");
        let name = m.substr(1, spacePos !== -1 ? spacePos - 1 : m.length);
        let dest = room.getPlayerList().filter((p) => p.name === name);
        if (dest.length !== 0) {
            m = m.substr(spacePos, m.length);
            room.sendChat("PM from " + p.name + ": " + m, dest[0].id);
        }
        return false;
    }
    return true;
}

/**************************************************************
* ************************** Resets ****************************
* Functions to call: reset and resetWithSwap.
* If it's used as a command, the parameter has to be an admin player.
* Otherwise this function can just be called with no param to work.
* These functions allow to reset the game by typing !rr
* And to reset the game by switching teams by typing !rrs
* Global variables used: None
***************************************************************/

function reset(p) {
    if (p === undefined || p.admin === true) {
        room.stopGame();
        room.startGame();
    }
}

function resetWithSwap(p) {
    if (p === undefined || p.admin === true) {
        room.stopGame();
        swap();
        room.startGame();
    }
}
function resetWithTop(p) {
    if (p === undefined || p.admin === true) {
        room.stopGame();
        let specs = room.getPlayerList().filter((p) => p.id !== 0 && p.team === 0);
        if (specs.length !== 0) {
            room.setPlayerTeam(specs[0], p.team === 1 ? 2 : 1);
        }
        room.startGame();
    }
}

/**************************************************************
* ************************** ACCOUNT **************************
* Function to call: almost all of theses are commands.
* These functions will simulate a way to have an account in the room.
* To further details, read the documentation of each function.
* There can be only one account per nickname.
* Global variables used: Stats {name: p | p € class Player }
***************************************************************/
var Stats = {};
const saveStatsName = "Players_stats";
var saveStatsN = 0;
function loadStats() {
    if (localStorage.getItem(saveStatsName + saveStatsN)) {
        let all = JSON.parse(localStorage.getItem(saveStatsName + saveStatsN));
        let noms = Object.keys(all);
        for (let i = 0; i < noms.length; i++) {
            Stats[noms[i]] = new Player(noms[i]);
            Object.assign(Stats[noms[i]], all[noms[i]]);
        }
    }
}


function saveStatsFun() {
    var val = JSON.stringify(Stats);
    window.localStorage.setItem(saveStatsName + saveStatsN, val);
}


function deleteStatsFun() {
    saveStatsN++;
    Stats = {};
}


/**************************************************************
* Function creating a new account for the player if this nick
* never been to the room.
* Also logs him and get his current id.
***************************************************************/
function autoConnect(p) {
    if (Stats.hasOwnProperty(p.name) === false) {
        Stats[p.name] = new Player(p.name);
        Stats[p.name].auth = p.auth;
    }
    else {
        if (Stats[p.name].auth != 0 && p.auth !== Stats[p.name].auth) {
            Stats[p.name].price = 1;
            room.sendChat("Your stats won't count because this nick is already taken by someone with a different id", p.id);
        }
        else if (Stats[p.name].auth == 0) {
            Stats[p.name].auth = p.auth;
        }
    }
    Stats[p.name].logged = 1;
    Stats[p.name].id = p.id;
    Stats[p.name].conn = p.conn;
}



function stats(p, m) {
    m = m.substr("!stats".length + 1);
    if (Stats.hasOwnProperty(m)) {
        Stats[m].displayStats(p.id);
    }
    else {
        room.sendChat("This player is not in our database.", p.id);
    }
    return false;
}


var msg_to_command = {
    "goals": "goals",
    "assists": "assists",
    "og": "ownGoals",
    "cs": "cs",
    "wins": "wins",
    "losses": "loses",
    "wl": "winsRatio",
    "passacc": "passAcc",
    "elo": "elo",
    "gpg": "goalsPG",
    "apg": "assistsPG",
    "cspg": "csPG",
    "streak": "bestStreak",
    "mins": "minsPlayed",
    "efcoins": "money",
};




function bestRanks(message) {
    if (!msg_to_command.hasOwnProperty(message))
        return "This option does not exist (yet ?), sorry :(. See !rankhelp to further infos.";

    let cmd = msg_to_command[message];
    let names = Object.keys(Stats);
    let score;
    let string = "";
    let overall = [];
    for (var i = 0; i < names.length; i++) {
        if (!Stats.hasOwnProperty(names[i])) continue;
        score = Stats[names[i]][cmd];
        if (score === 1000 || score === 0 ||
            (Stats[names[i]].wins + Stats[names[i]].loses) < 10) continue;

        overall.push({ name: names[i], value: score });
    }
    overall.sort(function (a, b) {
        return b.value - a.value;
    });
    for (i = 0; i < overall.length; i++) {
        string += i + 1 + ") " + overall[i].name + ": " + overall[i].value + " | ";
    }
    return string;
}



function ranking(p, m) {
    let string = bestRanks(m.substr("!rank".length + 1));
    let line1 = string.substring(0, 120);
    let line2 = string.substring(120, 240);
    let line3 = string.substring(240, 360);
    room.sendChat(line1, p.id);
    room.sendChat(line2, p.id);
    room.sendChat(line3, p.id);
    return false;
}

/**************************************************************
* Function as a command: !bb
* Kicks the player from the room with disconnecting him
* (the disconnect thing is pretty useless since it is caught
* in the onPlayerLeave anyway).
***************************************************************/
function bb(p) {
    Stats[p.name].disconnect();
    room.kickPlayer(p.id, "rip !", false);
}


/**************************************************************
* ************************** MUTE ****************************
* Global variable used: None
***************************************************************/
function mute(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        m = m.substr("!mute".length + 1);
        if (Stats.hasOwnProperty(m)) {
            Stats[m].isMuted = 1;
            room.sendChat(m + " has been muted by " + p.name);
        }
    }
    return false;
}

function muteById(p, m) {
    m = idToName(m.substr("!muteid".length + 1));
    return mute(p, "!mute " + m);
}


function unmute(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        m = m.substr("!unmute".length + 1);
        if (Stats.hasOwnProperty(m)) {
            Stats[m].isMuted = 0;
            room.sendChat(m + " has been unmuted by " + p.name);
            room.sendChat(m + " has been unmuted by " + p.name, Stats[m].id);
        }
    }
    return false;
}

function unmuteById(p, m) {
    m = idToName(m.substr("!unmuteid".length + 1));
    return unmute(p, "!unmute " + m);
}

function muteAll(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        var players = room.getPlayerList().filter((pl) => pl.admin === false &&
            pl.team === 0);
        for (var i = 0; i < players.length; i++) {

            Stats[players[i].name].isMuted = 1;
        }
        room.sendChat("All non-admins specs have been muted");
    }
}

function resetMutes(p) {
    if (p === undefined || p.admin === true) {
        var players = room.getPlayerList();
        for (var i = 1; i < players.length; i++) {
            Stats[players[i].name].isMuted = 0;
        }
    }
    return false;
}

/**************************************************************
* ************************** BANS ****************************
* Function to call: almost all of theses are commands.
* These functions are set in order to ban toxic people.
* This includes simple bans, simple clearing bans but also
* permaban that can be only disabled by the vps owner.
* In order to make this last feature work, room.clearBans is
* never used.
* Global variables used: None.
***************************************************************/

function permaBan(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 2) {

        m = m.substr("!permaban".length + 1);
        if (Stats.hasOwnProperty(m) === true) {
            room.sendChat(m + " has been banned");
            Stats[m].isBanned = true;
            Stats[m].isPermaBanned = 1;
            room.kickPlayer(Stats[m].id, "You have been banned", 1);
        }
    }
    else {
        room.sendChat("PM from Host: Only trusted admin with the level 3 or higher are allowed to permaban.", p.id);
    }
    return false;

}


function idToName(m) {
    if (!isNaN(m)) {
        let player = room.getPlayer(m);
        if (player !== null)
            return player.name;
    }
    return m;
}

function permaBanById(p, m) {
    m = idToName(m.substr("!permabanid".length + 1));
    return permaBan(p, "!permaban " + m);
}


function unbanAll(player) {
    if (player === undefined || Stats[player.name].isTrustedAdmin >= 1) {
        for (var p in Stats) {
            if (Stats.hasOwnProperty(p) && Stats[p].isBanned === true &&
                Stats[p].isPermaBanned === 0) {

                room.clearBan(Stats[p].id);
                Stats[p].isBanned = 0;
            }
        }
        room.sendChat("PM from Host: Bans have been cleared.");
    }
    return false;
}

function unbanPlayer(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        m = m.substr("!unban".length + 1);
        if (Stats.hasOwnProperty(m) === true) {
            room.clearBan(Stats[m].id);
            room.sendChat(m + " is free now !", p.id);
            Stats[m].isBanned = 0;
        }
    }
    return false;
}


var ragequitAuth = {};

function preventPlaying(p) {
    if (Stats[p.name].kickedSomeone > 0 && p.team != 0) {
        room.sendChat("🛑🕒 " + p.name + " must wait " +
            Stats[p.name].kickedSomeone + " more mins to play because he has left his last game before it ends 🕒🛑");
        room.setPlayerTeam(p.id, 0);
        console.log("🛑🕒 " + p.name + " must wait ! Check Point");
    }
}

function decreaseRqTime() {
    let players = room.getPlayerList().filter((p) => Stats[p.name].kickedSomeone != 0);
    for (var i = 0; i < players.length; i++) {
        Stats[players[i].name].kickedSomeone--;
    }
}


/**************************************************************
* ******************* FORCE SAME NAME ****************************

***************************************************************/
const auths = {};
const conns = {};


function forceSameName(player) {
    const oldName = auths[player.auth] !== undefined ? auths[player.auth] :
        conns[player.conn] !== undefined ? conns[player.conn] : player.name;

    if (oldName !== player.name) {
        room.kickPlayer(player.id,
            `You can change your nickname only tomorrow, use ${oldName}`);
        console.log("🔐🔐🔐 " + player.name + " has been kicked trying a new nickname");

        return false;
    }

    auths[player.auth] = player.name;
    conns[player.conn] = player.name;
}

function onPersistHandler() {
    return { auths, conns };
}

function onRestoreHandler(data) {
    if (data === undefined) return;

    Object.assign(auths, data.auths || {});
    Object.assign(conns, data.conns || {});
}





/**************************************************************
* ********************* MISC COMMANDS *************************
* Miscellaneous functions related to some pretty commands.
* Global variable used: None.
***************************************************************/

/**************************************************************
* Function displaying help in 2 lines in pm to the player.
***************************************************************/
function helpFun(p) {
    var help_string1 = "| !stats [nickname] | !rank [arg] | !rankhelp | !bethelp";
    var help_string2 = "| !bb | !swap | !rr | !rrs | !msup | @nickname pm | !discord | !disp";
    room.sendChat(help_string1, p.id);
    room.sendChat(help_string2, p.id);
    return false;
}


function rankHelp(p) {
    room.sendChat("Type rank + one options among: ", p.id);
    room.sendChat(Object.keys(msg_to_command).join(" | "), p.id);
    return false;
}

function betHelp(p) {
    room.sendChat("💰💰 You can win HAXCOINS by betting on a team ! 💰💰", p.id);
    room.sendChat("💰💰 use !betwin [team] [haxcoins], Ex: !betwin r 20 or !betwin b 20 💰💰", p.id);
    room.sendChat("💰💰 You can only bet when a match started and before it reaches 20s. 💰💰", p.id);
    room.sendChat("💰💰 If your bet is correct, you earn the same ammount of efcoins you've bet, Otherwise, you lose it 💰💰", p.id);
    return false;
}


/**************************************************************
* Function displaying the sum up of the last match in pm.
***************************************************************/
function sumMatchCommand(p) {
    gameStats.sumMatch(p);
    return false;
}


function givesDiscord(p) {
    room.sendChat("https://discord.gg/jTn2ZDp", p.id);
}


let display = {
    "admin": ["isTrustedAdmin", 1],
    "mute": ["isMuted", true]
};

function displayHere(p, m) {
    m = m.substr("!disp".length + 1);
    if (display.hasOwnProperty(m)) {
        let players = room.getPlayerList().filter((player) => player.id != 0);
        let string = "PM from Host: ";
        for (var i = 0; i < players.length; i++) {
            if (Stats[players[i].name][m[0]] >= m[1])
                string += players[i].name + " | ";
        }
        room.sendChat(string, p.id);
    }
    else {
        room.sendChat("PM from Host: This arg does not exist, maps: " +
            Object.keys(display).join(" | "), p.id);
    }
    return false;

}


function disconnectAll() {
    for (let e in Stats) {
        if (Stats.hasOwnProperty(e) && Stats[e].logged != 0) {
            Stats[e].logged = 0;
            Stats[e].isTrustedAdmin = 0;
        }
    }


}

function addPassword(p, m) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        m = m.substr("!addpw".length + 1);
        room.setPassword(m);
        room.sendChat(m + " is the new pw of the room", p.id);
    }
    return false;
}

function rmPassword(p) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        room.setPassword();
        room.sendChat("The password have been cleared", p.id);
    }
    return false;
}


function changeMaps(p, m) {
    if (p === undefined || p.admin === true) {
        m = m.substr("!map".length + 1);
        if (maps.hasOwnProperty(m)) {
            room.setCustomStadium(maps[m]);
            return false;
        }
        room.sendChat("PM from Host: This map does not exist, maps: " +
            Object.keys(maps).join(" | "), p.id);
    }
}

function downloadBlob(fileName) {
    let mimeType = 'application/octet-stream';
    let data = room.stopRecording();
    let blob = new Blob([data], { type: mimeType });
    let url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(function () {
        return window.URL.revokeObjectURL(url);
    }, 1000);
}

function downloadURL(data, fileName) {
    let elem = document.createElement('elem');
    elem.href = data;
    elem.download = fileName;
    document.body.appendChild(elem);
    elem.style = 'display: none';
    elem.click();
    elem.remove();
}

function recGameFun(player) {
    if (gameStats.rec === true) {
        room.sendChat("Last game has already been recorded by someone." +
            "Contact us to get a copy of it", player.id);
    }
    else {
        let date = new Date();
        let month = (date.getMonth + 1);
        let recname = "haxrec_" + date.getDate() + "_" +
            "_" + date.getFullYear() + "_" + date.getHours() + "H" +
            date.getMinutes() + "m.hbr2";

        downloadBlob(recname);
        room.sendChat("Game saved as " + recname +
            " . Contact us on Discord to get a copy.", player.id);
        gameStats.rec = true;
    }
}

var Alts = {}; //{conn: [name1, ..., nameN]}

function getAlts(p, m) {
    if (roomAdminsAuth.hasOwnProperty(Stats[p.name].auth)) {
        m = m.substr("!getname".length + 1);
        if (Stats.hasOwnProperty(m))
            room.sendChat("PM from Host: Alts: " + Alts[Stats[m].conn].join(" | "), p.id);
        return false;
    }
}

function stringBet(p, team, bet, team_msg) {
    Stats[p.name].winPred = team;
    Stats[p.name].currentBet = Number(bet);
    room.sendChat("PM from Host: You've bet " + bet + " EFCOINS on " +
        team_msg + " team ! ", p.id);
}

function betOnTeam(p, m) {
    m = m.substr("!betwin".length + 1);
    let bet = m.substr(2);
    m = m.substr(0, 1);
    let score = room.getScores();
    let team = ["r", "b"];
    if (!isNaN(bet) && bet >= 0 && bet <= Stats[p.name].money &&
        Stats[p.name].currentBet === 0 && team.includes(m) &&
        score != null && score.time < 20 && p.team === 0 &&
        gameStats.redTeam.length >= 3 && gameStats.blueTeam.length >= 3) {

        stringBet(p, 1 * (m == "r") || 1 + (m == "b"), bet, m == "r" ? "red" : "blue");
    }
    else {
        room.sendChat("PM from Host: You have to put this specific format: ", p.id);
        room.sendChat("PM from Host: !betwin r X or !betwin b X", p.id);
        room.sendChat("PM from Host: where r and b are the team X is the ammount of haxcoins you want to bet. ", p.id);
    }
    return false;
}


function checkFake(p, m) {
    m = m.substr("!check".length + 1);
    if (Stats.hasOwnProperty(m)) {
        m = Stats[m].price ? "❌❌❌ This player is the fake " + Stats[m].name + "." : "✔️✔️✔️ This player is the real " + Stats[m].name + ".";
        room.sendChat("📡 Authentication...Processing...Done... " + m);
    }
}

var commands = {
    "!swag": swap,
    "!rr": reset,
    "!rrz": resetWithSwap,
    //"!rrt": resetWithTop,
    "!bb": bb,
    "!msup": sumMatchCommand,
    "!discord": givesDiscord,
    "!help": helpFun,
    "!rankhelp": rankHelp,
    "!disp": displayHere,
    "!stats": stats,
    "!rank": ranking,
    //"!changepw": changePW,

    "!mute": mute,
    "!muteid": muteById,
    "!muteall": muteAll,
    "!unmute": unmute,
    "!unmuteid": unmuteById,
    "!unmuteall": resetMutes,
    "!unban": unbanPlayer,
    "!unbanall": unbanAll,
    "!permaban": permaBan,
    "!permabanid": permaBanById,
    "!e": superAdmin,
    "!1": getAdmin,
    "!admin2": getAdmin2,
    "!addadmin": addAdmin,
    "!map": changeMaps,
    "!addpw": addPassword,
    "!rmpw": rmPassword,
    "!getname": getAlts,
    "!rec": recGameFun,
    "!betwin": betOnTeam,
    "!bethelp": betHelp,
    "!banall": banall,
    "!check": checkFake,
};


function handleCommands(p, m) {
    let spacePos = m.search(" ");
    let command = m.substr(0, spacePos !== -1 ? spacePos : m.length);
    if (commands.hasOwnProperty(command) === true) return commands[command](p, m);
    if (m.startsWith("!") === true) {
        room.sendChat("PM from Host: This is not an existing command, write !help if needed !", p.id);
        return false;
    }
    return true;
}


function handleStart() {
    gameStats.updateRedTeam();
    gameStats.updateBlueTeam();
    handleTeams();
    elo.handleEloCalc();
    room.stopRecording();
    room.startRecording();
    room.sendChat("💰💰 Who will win this game ? You have 20s to place your bet and get rich 💰💰! See !bethelp for more info.");
}


function handleTimePlayed() {
    var players = room.getPlayerList();
    for (var i = 1; i < players.length; i++) {
        Stats[players[i].name].updateSecsPlayed();
        Stats[players[i].name].updateMinsPlayed();
    }
}



function handleGoals(team) {
    var time = room.getScores().time;
    var m = Math.trunc(time / 60);
    var s = Math.trunc(time % 60);
    let string;
    let assister = "";

    time = m + ":" + (s < 10 ? "0" + s : s); // MM:SS format
    gameStats.updateScore(team);

    gameStats.updateScorers(Stats[gameControl.currentBallOwner], team);
    gameStats.updateOwnScorers(Stats[gameControl.currentBallOwner], team);
    gameStats.updateAssisters(Stats[gameControl.lastBallOwners[1]], team);

    if (Stats.hasOwnProperty(gameControl.lastBallOwners[1]) &&
        (Stats[gameControl.lastBallOwners[1]].team ===
            Stats[gameControl.lastBallOwners[0]].team)) {

        assister = gameControl.lastBallOwners[1];
    }


    if (team === Stats[gameControl.currentBallOwner].team) {
        string = "⚽ Scorer: " + gameControl.lastBallOwners[0] + "| Assister: " +
            assister + "| at " + time;
        room.sendChat(string);
    }
    else {
        string = "Own goal from: " + gameControl.lastBallOwners[0] + "| at " + time;
        room.sendChat(string);
    }
    gameStats.matchsumup.push(string);
    gameControl.resetBallOwner();

}

function handleTeams() {
    var p = room.getPlayerList();
    for (var i = 1; i < p.length; i++) {
        Stats[p[i].name].team = p[i].team;
    }
}

function handleGk() {
    if (gameStats.hasStarted === false) {
        if (room.getScores().time !== 0) {
            gameStats.hasStarted = true;
            gameStats.updateGK();
            room.sendChat("Red GK: " + gameStats.Gks[0] + ", Blue GK: " + gameStats.Gks[1]);
        }
    }
}

function handleEndGame() {
    var players = room.getPlayerList().filter((p) => p.id != 0);
    records.updateBestPassesInARow();
    elo.updateElo();
    for (var i = 0; i < players.length; i++) {
        if (Stats[players[i].name].price !== 1) {
            Stats[players[i].name].updateEGStats();
        }
    }
}

function handleOvertime() {
    let scores = room.getScores();
    if (scores !== null && scores.timeLimit !== 0 &&
        scores.time >= scores.timeLimit) {

        handleEndGame();
    }
}



function handleBans2(kicked, message, ban, by) {
    if (by.id !== 0) {
        if (Stats[by.name].isTrustedAdmin === 0) {
            room.kickPlayer(by.id, "You are not allowed to kick/ban players !", ban);
            room.clearBan(kicked.id);
        }
    }
}



function handleRefresh(p) {


    if (Stats.hasOwnProperty(p.name) && Stats[p.name].logged !== 0) {
        if (Stats[p.name].auth === p.auth) {
            room.kickPlayer(Stats[p.name].id, "You just refreshed.", 0);
        }
        else {
            room.kickPlayer(p.id, "This nickname is already taken in the room.", 0);
        }
    }
}
function kickDoubleConn(p) {
    let players = room.getPlayerList();
    for (var i = 0; i < players.length; i++) {
        if (Stats[players[i].name].conn === p.conn && Stats[players[i].name].id !== p.id) {
            room.kickPlayer(p.id, "Multi Accounting", 0);
        }
    }
}


function updateSanction(p) {
    if (room.getPlayerList().filter((pl) => pl.name === p.name &&
        pl.team === p.team).length === 0) {

        let score = gameStats.redScore - gameStats.blueScore;
        Stats[p.name].kickedSomeone += p.team === 1 && score > 0;
        Stats[p.name].kickedSomeone += p.team === 2 && score < 0;

        Stats[p.name].kickedSomeone += 3 * (p.team === 1 && score < 0);
        Stats[p.name].kickedSomeone += 3 * (p.team === 2 && score > 0);

        Stats[p.name].kickedSomeone += 2 * (score === 0);

        if (p.team != 0)
            Stats[p.name].kickedSomeone *= 3;


    }

}

function handleSanction(p) {
    if (room.getScores() != null && p.team !== 0) {
        setTimeout(updateSanction, 1000 * 120, p);
    }
}

function leaveInGame(p) {
    if (room.getScores() != null && p.team !== 0) {
        room.pauseGame(true);
    }
}

function handleCSMessage() {
    let str = "";
    if (gameStats.redScore === 0)
        str = [gameStats.Gks[1] + " kept a cs for his team"].join();
    if (gameStats.blueScore === 0)
        str = [gameStats.Gks[0] + " kept a cs for his team"].join();
    return str;
}


function handleMode() {
    mode = room.getScores().timeLimit === 7;
}



function handleAlts(p) {
    if (Alts.hasOwnProperty(p.conn)) {
        if (!Alts[p.conn].includes(p.name))
            Alts[p.conn].push(p.name);
    }
    else {
        Alts[p.conn] = [p.name];
    }
}

function handleBans(p) {
    if (Stats[p.name].isBanned != 0)
        room.kickPlayer(p.id, "You're banned!", 1);
}

function resetBettings() {
    let players = room.getPlayerList();
    for (var i = 0; i < players.length; i++) {
        Stats[players[i].name].currentBet = 0;
        Stats[players[i].name].winPred = 0;
    }
    room.sendChat("Since the game was stopped, all bets are reseted !");
}


function handleStadiumChange(name, by) {
    if (first_stadium_loaded === true) {
        if (by.id != 0) {
            room.kickPlayer(by.id, "Please use !map [stadium] next time !", false);
            room.setCustomStadium(maps.big);
        }
    }
    else first_stadium_loaded = true;
}

function updateStreak(winners) {
    winStreak.score = (winStreak.team == "red" && winners) ||
        !(winStreak.team == "red" || winners) ? winStreak.score + 1 : 1;
    winStreak.team = winners ? "red" : "blue";

    room.sendChat("The current streak is held by " + winStreak.team +
        " with " + winStreak.score + " wins ! ");
}


function banall(p) {
    if (p === undefined || Stats[p.name].isTrustedAdmin >= 1) {
        let players = room.getPlayerList().filter((p) => p.id != 0);
        if (players.length != 0) {
            for (var i = 0; i < players.length; i++) {
                room.kickPlayer(players[i].id, "Be active next time :-)", 0);
            }
        }
    }
    return false;
}

function checkfdps() {
    if (active.length == 0 && room.getPlayerList().length >= 6) {
        banall();
    }
    active = [];
}


function getBestRanks() {
    let string;
    for (var rank in msg_to_command) {
        if (msg_to_command.hasOwnProperty(rank)) {
            string = bestRanks(rank);
            console.log(rank + ": " + string.substring(0, 400));
        }
    }
}

function resetAuth(name) {
    if (Stats.hasOwnProperty(name))
        Stats[name].auth = 0;
}

function kickLastPlayer(p) {
    if (room.getPlayerList().length === (MAX_PLAYERS + 1) &&
        !roomAdminsAuth.hasOwnProperty(p.auth) &&
        !headAdminsAuths.hasOwnProperty(p.auth)) {

        room.kickPlayer(p.id, "Sorry, this last slot is reserved for EFC staff !", 0);

    }
}


function putTeamColor() {
    room.setTeamColors(1, 45, 0xFFA41C, [0x7A1602, 0x7A1602, 0x571002]);
    room.setTeamColors(2, 135, 0xFFA41C, [0x1A164A, 0x1A164A, 0x110E30]);
}

function spamcolors(team, color) {
    room.setTeamColors(team, 45, color, [color, color, color]);
}


function warn4def(team) {

    room.sendChat("🚫🛑 4 DEFENSE IS FORBIDDEN. PLEASE ONE LEAVE THE AREA 🛑🚫");
    spamcolors(team, 0xFFA41C);
}

function check4def() {
    if (room.getScores() == null) return;
    let red4def = room.getPlayerList().filter((p) =>
        p.team == 1 && p.position.x < -401).length;

    let blue4def = room.getPlayerList().filter((p) =>
        p.team == 2 && p.position.x > 401).length;

    if (red4def == 4 || blue4def == 4) {
        warn4def(1 + (blue4def == 4));
    }
    else putTeamColor();
}

var captainsCommands = {
    "top": putTopToPlayerTeam,
    "auto": putTopToPlayerTeam,
    "random": putRandomToPlayerTeam,
    "rand": putRandomToPlayerTeam,
};

function handleCaptaincy(p, m) {
    if (isAllowedToPick(p)) {
        if (captainsCommands.hasOwnProperty(m.toLowerCase()))
            captainsCommands[m](p);

        else if (!isNaN(m))
            pickPlayerWithNumber(p, m);

        else
            pickPlayerWithName(p, m);

    }
}

function isAllowedToPick(p) {
    return room.getScores() == null &&
        p.team == (1 + (gameStats.redScore > gameStats.blueScore));
}


function putTopToPlayerTeam(p) {
    let numberOfSpecs = room.getPlayerList().filter((a) => a.team == 0 && a.id != 0).length;
    let numberOfPlayersInMyTeam = room.getPlayerList().filter((a) => a.team == p.team).length;
    let numberOfPlayersNotInMyTeam = room.getPlayerList().filter((a) => a.team != p.team && a.team != 0).length;

    let i = 0;
    while (numberOfPlayersNotInMyTeam >= numberOfPlayersInMyTeam &&
        numberOfPlayersInMyTeam < 4 && numberOfSpecs != 0) {

        room.setPlayerTeam(room.getPlayerList().filter((a) => a.team == 0 && a.id != 0)[i].id, p.team);
        i++; numberOfSpecs--; numberOfPlayersInMyTeam++;
    }
}

function putRandomToPlayerTeam(p) {
    let numberOfSpecs = room.getPlayerList().filter((a) => a.team == 0 && a.id != 0).length;
    let numberOfPlayersInMyTeam = room.getPlayerList().filter((a) => a.team == p.team).length;
    let numberOfPlayersNotInMyTeam = room.getPlayerList().filter((a) => a.team != p.team && a.team != 0).length;
    const MAX_RANDOM = numberOfSpecs;
    let random;
    let doublons = [];

    let i = 0;
    while (numberOfPlayersNotInMyTeam >= numberOfPlayersInMyTeam &&
        numberOfPlayersInMyTeam < 4 && numberOfSpecs != 0) {

        do {
            random = getRandomInt(MAX_RANDOM);
        } while (doublons.includes(random));
        doublons.push(random);

        room.setPlayerTeam(room.getPlayerList()
            .filter((a) => a.team == 0 && a.id != 0)[random].id, p.team);

        i++; numberOfSpecs--; numberOfPlayersInMyTeam++;
    }
}


function pickPlayerWithNumber(p, m) {
    let players = room.getPlayerList().filter((a) => a.team == 0 && a.id != 0);
    if (m < players.length && m >= 0)
        room.setPlayerTeam(players[m].id, p.team);

}


function pickPlayerWithName(p, m) {
    let players = room.getPlayerList().filter((a) => a.team == 0 && a.id != 0);
    for (var i = 0; i < players.length; i++) {
        if (players[i].name.includes(m)) {
            room.setPlayerTeam(players[i].id, p.team);
            break;
        }
    }
}

function putWholeTeamToSpec() {
    let players = room.getPlayerList().filter((a) =>
        a.team == (1 + (gameStats.redScore > gameStats.blueScore)));

    for (var i = 0; i < players.length; i++) {
        room.setPlayerTeam(players[i].id, 0);
    }
}

function pickNewCaptain() {
    let players = room.getPlayerList().filter((a) => a.team == 0 && a.id != 0);
    if (players.length != 0) {
        room.setPlayerAdmin(players[0].id, true);
        room.setPlayerTeam(players[0].id, 1 + (gameStats.redScore > gameStats.blueScore));
        return players[0].id;
    }
    return 0;
}


/**************************************************************
* ************************** EVENTS ****************************
***************************************************************/
var gameStats = new GameStats();
var gameControl = new GameControl(5.9);
var records = new Records();
var elo;
var mode = false;
var lastMatchSumUp = [];
var active = [];

var currentCaptain = [];

var winStreak = { "team": "", "score": 1 };

setInterval(saveStatsFun, 300000);
setInterval(checkfdps, 1000 * 60 * 4);
setInterval(deleteStatsFun, 1000 * 60 * 60 * 24 * 7);
setInterval(updateSelectedAdmins, 1000 * 60 * 4);

setInterval(function () {
    room.sendChat("🚨🏆 More than 1200 players are already on discord ! 👉 http://discord.gg/jTn2ZDp 👈 You should join too");
    room.sendChat("🚨🤙 Watch our league live commentated on Twitch! Join the biggest European Haxball community! 🏆");
}, 1000 * 60 * 2);

setInterval(check4def, 1000);
setInterval(decreaseRqTime, 1000 * 60);


room.onPlayerChat = function (p, m) {
    console.log(p.name + "#" + p.id + " : " + m);
    if (Stats[p.name].isMuted) return false;
    if (handleCommands(p, m) === false) return false;
    if (sendPM(p, m) === false) return false;
    kickWord(p, m);
    handleCaptaincy(p, m);
    handleSpam(lastWriters, p);

};


room.onPlayerTeamChange = function (p, by) {
    console.log("♻️♻️♻️ " + p.name + " has been moved to a team");
    updateTeams(p);
    startBig();
    preventPlaying(p);
    if (p.id === 0 && p.team != 0) {
        room.setPlayerTeam(p.id, 0);
        room.sendChat("😬 Woah, hang on! I'm only a bot, you really think I'm coded to play? 😬");
    }
    handleTeams();
};




room.onPlayerJoin = function (player, maps) {
    console.log("👋👋👋 " + player.name + " # " + player.id + " Joined - " + player.auth + " conn : " + player.conn);
    loadFirstMap();
    //forceSameName(player);
    kickFakeAdmin(player);
    lastPlace();
    doubleSpace(player);
    banConn(player);
    handleRefresh(player);
    autoConnect(player);
    handleBans(player);
    handleAlts(player);
    //kickDoubleConn(player);
    updateTeams(player);
    updateAdmins();
    room.sendChat("👋 Hey " + player.name + " ! 📣📣 https://discord.gg/jTn2ZDp ! Our new season has started! Join and play with us! ", player.id);

    if (!active.includes(Stats[player.name].conn)) {
        active.push(Stats[player.name].conn);
    }
};

room.onPlayerLeave = function (player) {
    console.log("😢😢😢 " + player.name + " has left the room");
    lastPlace();
    updateAdmins();
    updateTeams(player);
    leaveInGame(player);
    handleSanction(player);
    Stats[player.name].disconnect();

};

room.onPersist = function () {
    onPersistHandler();
};

room.onRestore = function (data) {
    onRestoreHandler(data);
};




room.onPlayerKicked = function (kicked, message, ban, by) {
    handleBans2(kicked, message, ban, by);
};


room.onGameStart = function (p) {
    console.log("🎮🎲🎮 Game has started !");
    updateTeams(p);
    putTeamColor();
    gameStats = new GameStats();
    gameControl = new GameControl(5.9);
    elo = new ELO();
    handleStart();
    handleMode();
    room.setPlayerAdmin(currentCaptain[0], false);

};


room.onTeamGoal = function (team) {
    handleGoals(team);
};


room.onGameStop = function (p) {
    console.log("🎮🎲🎮 Game has ended !");
    updateTeams(p);
    resetMutes();
    gameControl.resetBallOwner();

};



room.onGameTick = function () {
    gameControl.updateBallOwner();
    gameControl.updateLastBallOwners();
    gameControl.updatePassesInARow();
    handleGk();
    handleTimePlayed();
    if (mode === true) setInterval(handleOvertime, 5000);
};

room.onPlayerBallKick = function (player) {
    gameControl.currentBallOwner = player.name;
};


room.onTeamVictory = function (player) {
    console.log("🎮🎉🎮 Game has ended on a Victory ! 🎉");
    updateTeams(player);
    if (mode === false) handleEndGame();
    gameStats.matchsumup.push(handleCSMessage());
    lastMatchSumUp.push(gameStats.matchsumup);
    updateStreak(gameStats.redScore > gameStats.blueScore);
    room.stopGame();
    putWholeTeamToSpec();
    currentCaptain = [pickNewCaptain(), false];



};

room.onPlayerAdminChange = function (p, by) {
    if (by != null && Stats[p.name].isTrustedAdmin > Stats[by.name].isTrustedAdmin) {
        room.kickPlayer(by.id, "Don't try this at home, kid.", false);
        room.setPlayerAdmin(p.id, true);
    }
    updateAdmins();
};

room.onRoomLink = function () {
    let vide = "";
    vide.name = "";
    loadStats();
    disconnectAll();
    autoConnect(room.getPlayer(0));
    autoConnect(vide);
};


room.onStadiumChange = function (name, by) {
    handleStadiumChange(name, by);
};




room.onPlayerActivity = function (p) {
    if (!active.includes(Stats[p.name].conn)) {
        active.push(Stats[p.name].conn);
    }
};

/* EOF */


/* Python-like update dict method having at least an empty object */
function updateObject(object, p) {
    if (object.hasOwnProperty(p.name)) {
        object[p.name]++;
    }
    else {
        object[p.name] = 1;
    }
}


// Gives the last player who touched the ball, works only if the ball has the same
// size than in classics maps.
// Calculate the distance between 2 points
function pointDistance(p1, p2) {
    var d1 = p1.x - p2.x;
    var d2 = p1.y - p2.y;
    return Math.sqrt(d1 * d1 + d2 * d2);
}









var bigmap = `{

    "name" : "[EFC][Big] Mona & Kang",

    "width" : 800,

    "height" : 350,

    "spawnDistance" : 350,

    "bg" : { "type" : "hockey", "width" : 0, "height" : 0, "kickOffRadius" : 80, "cornerRadius" : 0 },

    "vertexes" : [
        /* 0 */ { "x" : -700, "y" : 320, "trait" : "ballArea" },
        /* 1 */ { "x" : -700, "y" : -320, "trait" : "ballArea" },
        /* 2 */ { "x" : 700, "y" : 320, "trait" : "ballArea" },
        /* 3 */ { "x" : 700, "y" : -320, "trait" : "ballArea" },

        /* 4 */ { "x" : 0, "y" : 350, "trait" : "kickOffBarrier" },
        /* 5 */ { "x" : 0, "y" : 80, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 6 */ { "x" : 0, "y" : -80, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 7 */ { "x" : 0, "y" : -350, "trait" : "kickOffBarrier" },

        /* 8 */ { "x" : -700, "y" : -85, "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B" },
        /* 9 */ { "x" : -741, "y" : -85, "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "bCoef" : 0.8 },
        /* 10 */ { "x" : -741, "y" : 85, "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "bCoef" : 0.8 },
        /* 11 */ { "x" : -700, "y" : 85, "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B" },
        /* 12 */ { "x" : 700, "y" : -85, "trait" : "goalNet", "curve" : 0, "color" : "3377ae" },
        /* 13 */ { "x" : 743, "y" : -85, "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "bCoef" : 0.8 },
        /* 14 */ { "x" : 743, "y" : 84, "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "bCoef" : 0.8 },
        /* 15 */ { "x" : 700, "y" : 85, "trait" : "goalNet", "curve" : 0, "color" : "3377ae" },

        /* 16 */ { "x" : -700, "y" : 85, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 17 */ { "x" : -700, "y" : 320, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 18 */ { "x" : -700, "y" : -85, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 19 */ { "x" : -700, "y" : -320, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 20 */ { "x" : -700, "y" : 320, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 21 */ { "x" : 700, "y" : 320, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 22 */ { "x" : 700, "y" : 85, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 23 */ { "x" : 700, "y" : 320, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 24 */ { "x" : 700, "y" : -320, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 25 */ { "x" : 700, "y" : -85, "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 26 */ { "x" : 700, "y" : -320, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 27 */ { "x" : 700, "y" : -320, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 28 */ { "x" : -700.0350255928246, "y" : -319.76086191288704, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 29 */ { "x" : 699.9648932977058, "y" : -320.237418842872, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },

        /* 30 */ { "x" : 0, "y" : -318, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573", "_selected" : "segment" },
        /* 31 */ { "x" : 0, "y" : -81, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573", "_selected" : "segment" },
        /* 32 */ { "x" : 0, "y" : 82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 33 */ { "x" : 0, "y" : 318, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 34 */ { "x" : 0, "y" : -82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 35 */ { "x" : 0, "y" : 82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 36 */ { "x" : 0, "y" : -150, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
        /* 37 */ { "x" : 0, "y" : 82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 38 */ { "x" : 0, "y" : -82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 39 */ { "x" : 0, "y" : 82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : 0 },

        /* 40 */ { "x" : -707.5, "y" : 85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
        /* 41 */ { "x" : -707.5, "y" : -344, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 42 */ { "x" : -707.5, "y" : -85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 43 */ { "x" : 697, "y" : -85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 44 */ { "x" : 697, "y" : -87, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 45 */ { "x" : 696, "y" : 84, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },

        /* 46 */ { "x" : -700, "y" : -86, "bCoef" : 0.1, "cMask" : ["blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 47 */ { "x" : -700, "y" : 81, "bCoef" : 0.1, "cMask" : ["blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 48 */ { "x" : 700, "y" : -83, "bCoef" : 0.1, "cMask" : ["red" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 49 */ { "x" : 700, "y" : 84, "bCoef" : 0.1, "cMask" : ["red" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },

        /* 50 */ { "x" : -385.5, "y" : 318, "bCoef" : 0, "cMask" : ["wall" ], "color" : "737573" },
        /* 51 */ { "x" : -385.5, "y" : -318, "bCoef" : 0, "cMask" : ["wall" ], "color" : "737573" },
        /* 52 */ { "x" : 385.5, "y" : 318, "bCoef" : 0, "cMask" : ["wall" ], "color" : "737573" },
        /* 53 */ { "x" : 385.5, "y" : -318, "bCoef" : 0, "cMask" : ["wall" ], "color" : "737573" },
        /* 54 */ { "x" : -385.5, "y" : -130, "cMask" : ["wall" ], "curve" : 90, "color" : "737573" },
        /* 55 */ { "x" : -385.5, "y" : 130, "cMask" : ["wall" ], "curve" : 90, "color" : "737573" },
        /* 56 */ { "x" : 385.5, "y" : -130, "cMask" : ["wall" ], "curve" : -90, "color" : "737573" },
        /* 57 */ { "x" : 385.5, "y" : 130, "cMask" : ["wall" ], "curve" : -90, "color" : "737573" },
        /* 58 */ { "x" : -620, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 59 */ { "x" : -698, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 60 */ { "x" : -620, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 61 */ { "x" : -698, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 62 */ { "x" : -620, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 63 */ { "x" : -620, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 64 */ { "x" : 620, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 65 */ { "x" : 698, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 66 */ { "x" : 620, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 67 */ { "x" : 698, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 68 */ { "x" : 620, "y" : -115, "cMask" : ["wall" ], "color" : "737573" },
        /* 69 */ { "x" : 620, "y" : 115, "cMask" : ["wall" ], "color" : "737573" },
        /* 70 */ { "x" : 500, "y" : -2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 71 */ { "x" : 500, "y" : 2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 72 */ { "x" : 500, "y" : -2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },
        /* 73 */ { "x" : 500, "y" : 2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },
        /* 74 */ { "x" : -500, "y" : -2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 75 */ { "x" : -500, "y" : 2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 76 */ { "x" : -500, "y" : -2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },
        /* 77 */ { "x" : -500, "y" : 2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },
        /* 78 */ { "x" : 0, "y" : -2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 79 */ { "x" : 0, "y" : 2, "cMask" : ["wall" ], "curve" : 180, "color" : "737573" },
        /* 80 */ { "x" : 0, "y" : -2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },
        /* 81 */ { "x" : 0, "y" : 2, "cMask" : ["wall" ], "curve" : -180, "color" : "737573" },

        /* 82 */ { "x" : -707.5, "y" : 344, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 83 */ { "x" : -707.5, "y" : 85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 84 */ { "x" : 707.5, "y" : 344, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 85 */ { "x" : 707.5, "y" : 85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 86 */ { "x" : 707.5, "y" : -344, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 87 */ { "x" : 707.5, "y" : -85, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 }

    ],

    "segments" : [
        { "v0" : 8, "v1" : 9, "curve" : 0, "color" : "DA4D4B", "trait" : "goalNet" },
        { "v0" : 9, "v1" : 10, "curve" : -23, "color" : "DA4D4B", "trait" : "goalNet", "bCoef" : 0.8 },
        { "v0" : 10, "v1" : 11, "curve" : 0, "color" : "DA4D4B", "trait" : "goalNet" },
        { "v0" : 12, "v1" : 13, "curve" : 0, "color" : "3377ae", "trait" : "goalNet" },
        { "v0" : 13, "v1" : 14, "curve" : 23, "color" : "3377ae", "trait" : "goalNet", "bCoef" : 0.8 },
        { "v0" : 14, "v1" : 15, "curve" : 0, "color" : "3377ae", "trait" : "goalNet" },

        { "v0" : 4, "v1" : 5, "trait" : "kickOffBarrier" },
        { "v0" : 5, "v1" : 6, "curve" : 180, "vis" : true, "color" : "DA4D4B", "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 5, "v1" : 6, "curve" : -180, "vis" : true, "color" : "3377ae", "cGroup" : ["redKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 6, "v1" : 7, "trait" : "kickOffBarrier" },

        { "v0" : 16, "v1" : 17, "vis" : true, "color" : "1e252a", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 18, "v1" : 19, "vis" : true, "color" : "1e252a", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 20, "v1" : 21, "vis" : true, "color" : "1e252a", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 22, "v1" : 23, "vis" : true, "color" : "1e252a", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 24, "v1" : 25, "vis" : true, "color" : "1e252a", "bCoef" : 1.25, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 26, "v1" : 27, "vis" : true, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        { "v0" : 28, "v1" : 29, "vis" : true, "color" : "1e252a", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea" },

        { "v0" : 30, "v1" : 31, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "_selected" : true },
        { "v0" : 32, "v1" : 33, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },

        { "v0" : 41, "v1" : 42, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -707.5 },

        { "v0" : 46, "v1" : 47, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "x" : -700 },
        { "v0" : 48, "v1" : 49, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "x" : 700 },

        { "v0" : 50, "v1" : 51, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["wall" ], "trait" : "goalNet" },
        { "v0" : 52, "v1" : 53, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["wall" ], "trait" : "goalNet", "x" : 385.5 },

        { "v0" : 54, "v1" : 55, "curve" : 90, "vis" : true, "color" : "737573", "cMask" : ["wall" ] },
        { "v0" : 56, "v1" : 57, "curve" : -90, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : 385.5 },
        { "v0" : 58, "v1" : 59, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ] },
        { "v0" : 60, "v1" : 61, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "y" : 115 },
        { "v0" : 62, "v1" : 63, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ] },
        { "v0" : 64, "v1" : 65, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "y" : 215 },
        { "v0" : 66, "v1" : 67, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "y" : -115 },
        { "v0" : 68, "v1" : 69, "curve" : 0, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : 620 },
        { "v0" : 70, "v1" : 71, "curve" : 180, "vis" : true, "color" : "737573", "cMask" : ["wall" ] },
        { "v0" : 72, "v1" : 73, "curve" : -180, "vis" : true, "color" : "737573", "cMask" : ["wall" ] },
        { "v0" : 74, "v1" : 75, "curve" : 180, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : -500 },
        { "v0" : 76, "v1" : 77, "curve" : -180, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : -500 },
        { "v0" : 78, "v1" : 79, "curve" : 180, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : 0 },
        { "v0" : 80, "v1" : 81, "curve" : -180, "vis" : true, "color" : "737573", "cMask" : ["wall" ], "x" : 0 },

        { "v0" : 82, "v1" : 83, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -707.5 },
        { "v0" : 84, "v1" : 85, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 707.5 },
        { "v0" : 86, "v1" : 87, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 707.5 }

    ],

    "goals" : [
        { "p0" : [-706,91 ], "p1" : [-706,-79 ], "team" : "red" },
        { "p0" : [706,91 ], "p1" : [706,-79 ], "team" : "blue" }

    ],

    "discs" : [
        { "radius" : 5.4, "pos" : [-700,85 ], "color" : "ce9e9e", "trait" : "goalPost" },
        { "radius" : 5.4, "pos" : [-700,-85 ], "color" : "ce9e9e", "trait" : "goalPost" },
        { "radius" : 5.4, "pos" : [699,85 ], "color" : "9eafce", "trait" : "goalPost" },
        { "radius" : 5.4, "pos" : [699,-84 ], "color" : "9eafce", "trait" : "goalPost" }

    ],

    "planes" : [
        { "normal" : [0,1 ], "dist" : -320, "trait" : "ballArea", "vis" : false, "curve" : 0 },
        { "normal" : [0,-1 ], "dist" : -320, "trait" : "ballArea" },

        { "normal" : [0,1 ], "dist" : -350, "bCoef" : 0.1 },
        { "normal" : [0,-1 ], "dist" : -352, "bCoef" : 0.1 },
        { "normal" : [1,0 ], "dist" : -800, "bCoef" : 0.1 },
        { "normal" : [-1,0 ], "dist" : -800, "bCoef" : 0.1 },

        { "bCoef" : 0.8, "cMask" : ["ball" ], "trait" : "goalNet", "dist" : -754, "normal" : [-1,0 ] },
        { "bCoef" : 0.8, "cMask" : ["ball" ], "trait" : "goalNet", "dist" : -753.006773306292, "normal" : [0.9999309835650598,0.011748536360424984 ] }

    ],

    "traits" : {
        "ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
        "goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
        "goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },
        "kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] }

    },

    "playerPhysics" : {
        "bCoef" : 0,
        "acceleration" : 0.11,
        "kickingAcceleration" : 0.083,
        "kickStrength" : 4.545

    },

    "ballPhysics" : {
        "radius" : 5.8,
        "bCoef" : 0.412,
        "invMass" : 1.5,
        "damping" : 0.99,
        "color" : "ffd133"

    }
}`;

var mediummap = `{

    "name" : "[EFC][Medium] by Kang",

    "width" : 648,

    "height" : 270,

    "spawnDistance" : 350,

    "bg" : { "type" : "hockey" },

    "vertexes" : [
        /* 0 */ { "x" : 550, "y" : 240, "trait" : "ballArea" },
        /* 1 */ { "x" : 550, "y" : -240, "trait" : "ballArea" },

        /* 2 */ { "x" : 0, "y" : 270, "trait" : "kickOffBarrier" },
        /* 3 */ { "x" : 0, "y" : 80, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 4 */ { "x" : 0, "y" : -80, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 5 */ { "x" : 0, "y" : -270, "trait" : "kickOffBarrier" },

        /* 6 */ { "x" : -550, "y" : -80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B", "pos" : [-700,-80 ] },
        /* 7 */ { "x" : -590, "y" : -80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "pos" : [-700,-80 ], "bCoef" : 0.8 },
        /* 8 */ { "x" : -590, "y" : 80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "pos" : [-700,80 ], "bCoef" : 0.8 },
        /* 9 */ { "x" : -550, "y" : 80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B", "pos" : [-700,80 ] },
        /* 10 */ { "x" : 550, "y" : -80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "3377ae", "pos" : [700,-80 ] },
        /* 11 */ { "x" : 590, "y" : -80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "pos" : [700,-80 ], "bCoef" : 0.8 },
        /* 12 */ { "x" : 590, "y" : 80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "pos" : [700,80 ], "bCoef" : 0.8 },
        /* 13 */ { "x" : 550, "y" : 80, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "3377ae", "pos" : [700,80 ] },

        /* 14 */ { "x" : -550, "y" : 80, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "231017", "pos" : [-700,80 ] },
        /* 15 */ { "x" : -550, "y" : 240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "231017" },
        /* 16 */ { "x" : -550, "y" : -80, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a", "pos" : [-700,-80 ] },
        /* 17 */ { "x" : -550, "y" : -240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 18 */ { "x" : -550, "y" : 240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 19 */ { "x" : 550, "y" : 240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 20 */ { "x" : 550, "y" : 80, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "pos" : [700,80 ], "color" : "1e252a" },
        /* 21 */ { "x" : 550, "y" : 240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 22 */ { "x" : 550, "y" : -240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 23 */ { "x" : 550, "y" : -80, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a", "pos" : [700,-80 ] },
        /* 24 */ { "x" : 550, "y" : -240, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 25 */ { "x" : 550, "y" : -240, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 26 */ { "x" : -550, "y" : -240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "1e252a" },
        /* 27 */ { "x" : 550, "y" : -240, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "1e252a" },

        /* 28 */ { "x" : 0, "y" : -240, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 29 */ { "x" : 0, "y" : -82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 30 */ { "x" : 0, "y" : 82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 31 */ { "x" : 0, "y" : 240, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 32 */ { "x" : 0, "y" : -82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 33 */ { "x" : 0, "y" : 82, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 34 */ { "x" : 0, "y" : 82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 35 */ { "x" : 0, "y" : -82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 36 */ { "x" : 0, "y" : 82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : 0 },
        /* 37 */ { "x" : 0, "y" : -82, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : 0 },

        /* 38 */ { "x" : -557.5, "y" : 80, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [-700,80 ] },
        /* 39 */ { "x" : -557.5, "y" : 240, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
        /* 40 */ { "x" : -557.5, "y" : -240, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 41 */ { "x" : -557.5, "y" : -80, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [-700,-80 ] },
        /* 42 */ { "x" : 557.5, "y" : -240, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 43 */ { "x" : 557.5, "y" : -80, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [700,-80 ] },
        /* 44 */ { "x" : 557.5, "y" : 80, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [700,80 ] },
        /* 45 */ { "x" : 557.5, "y" : 240, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },

        /* 46 */ { "x" : 0, "y" : 82, "bCoef" : 0.1, "trait" : "line", "color" : "afa370" },
        /* 47 */ { "x" : -550, "y" : -80, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 48 */ { "x" : -550, "y" : 80, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 49 */ { "x" : 550, "y" : -80, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 50 */ { "x" : 550, "y" : 80, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 51 */ { "x" : -548, "y" : 160, "bCoef" : 0.1, "trait" : "line", "color" : "737573", "curve" : -180 },
        /* 52 */ { "x" : -548, "y" : -160, "bCoef" : 0.1, "trait" : "line", "color" : "737573", "curve" : -180 },
        /* 53 */ { "x" : 548, "y" : 160, "bCoef" : 0.1, "trait" : "line", "color" : "737573", "curve" : 180 },
        /* 54 */ { "x" : 548, "y" : -160, "bCoef" : 0.1, "trait" : "line", "color" : "737573", "curve" : 180 },
        /* 55 */ { "x" : 0, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 56 */ { "x" : 0, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 57 */ { "x" : 0, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 58 */ { "x" : 0, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 59 */ { "x" : 480, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 60 */ { "x" : 480, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 61 */ { "x" : 480, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 62 */ { "x" : 480, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 63 */ { "x" : -480, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 64 */ { "x" : -480, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 65 */ { "x" : -480, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 66 */ { "x" : -480, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" }

    ],

    "segments" : [
        { "v0" : 6, "v1" : 7, "curve" : 0, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,-80 ], "y" : -80 },
        { "v0" : 7, "v1" : 8, "curve" : -23, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "x" : -590, "bCoef" : 0.8 },
        { "v0" : 8, "v1" : 9, "curve" : 0, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,80 ], "y" : 80 },
        { "v0" : 10, "v1" : 11, "curve" : 0, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,-80 ], "y" : -80 },
        { "v0" : 11, "v1" : 12, "curve" : 23, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "x" : 590, "bCoef" : 0.8 },
        { "v0" : 12, "v1" : 13, "curve" : 0, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,80 ], "y" : 80 },

        { "v0" : 2, "v1" : 3, "trait" : "kickOffBarrier" },
        { "v0" : 3, "v1" : 4, "curve" : 180, "vis" : true, "color" : "DA4D4B", "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 3, "v1" : 4, "curve" : -180, "vis" : true, "color" : "3377ae", "cGroup" : ["redKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 4, "v1" : 5, "trait" : "kickOffBarrier" },

        { "v0" : 14, "v1" : 15, "vis" : true, "color" : "231017", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -550 },
        { "v0" : 16, "v1" : 17, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -550 },
        { "v0" : 18, "v1" : 19, "curve" : 0, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : 240 },
        { "v0" : 20, "v1" : 21, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550 },
        { "v0" : 22, "v1" : 23, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550 },
        { "v0" : 24, "v1" : 25, "vis" : true, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 550, "y" : -240 },
        { "v0" : 26, "v1" : 27, "curve" : 0, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : -240 },

        { "v0" : 28, "v1" : 29, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 30, "v1" : 31, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },

        { "v0" : 38, "v1" : 39, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -557.5 },
        { "v0" : 40, "v1" : 41, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -557.5 },
        { "v0" : 42, "v1" : 43, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 557.5 },
        { "v0" : 44, "v1" : 45, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 557.5 },

        { "v0" : 47, "v1" : 48, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -550 },
        { "v0" : 49, "v1" : 50, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 550 },
        { "v0" : 51, "v1" : 52, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 53, "v1" : 54, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 548 },
        { "v0" : 55, "v1" : 56, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 57, "v1" : 58, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 59, "v1" : 60, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 480 },
        { "v0" : 61, "v1" : 62, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 480 },
        { "v0" : 63, "v1" : 64, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -480 },
        { "v0" : 65, "v1" : 66, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -480 }

    ],

    "goals" : [
        { "p0" : [-556.3,-80 ], "p1" : [-556.3,80 ], "team" : "red" },
        { "p0" : [556.3,80 ], "p1" : [556.3,-80 ], "team" : "blue" }

    ],

    "discs" : [
        { "radius" : 5, "pos" : [-550,80 ], "color" : "ce9e9e", "trait" : "goalPost", "y" : 80 },
        { "radius" : 5, "pos" : [-550,-80 ], "color" : "ce9e9e", "trait" : "goalPost", "y" : -80, "x" : -560 },
        { "radius" : 5, "pos" : [550,80 ], "color" : "9eafce", "trait" : "goalPost", "y" : 80 },
        { "radius" : 5, "pos" : [550,-80 ], "color" : "9eafce", "trait" : "goalPost", "y" : -80 }

    ],

    "planes" : [
        { "normal" : [0,1 ], "dist" : -240, "bCoef" : 1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
        { "normal" : [0,-1 ], "dist" : -240, "bCoef" : 1, "trait" : "ballArea" },

        { "normal" : [0,1 ], "dist" : -270, "bCoef" : 0.1 },
        { "normal" : [0,-1 ], "dist" : -270, "bCoef" : 0.1 },
        { "normal" : [1,0 ], "dist" : -642, "bCoef" : 0.1 },
        { "normal" : [-1,0 ], "dist" : -644, "bCoef" : 0.1 },

        { "normal" : [1,0 ], "dist" : -642, "bCoef" : 0.1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
        { "normal" : [-1,0 ], "dist" : -643, "bCoef" : 0.1, "trait" : "ballArea", "vis" : false, "curve" : 0 }

    ],

    "traits" : {
        "ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
        "goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
        "goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },
        "line" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["" ] },
        "kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] }

    },

    "playerPhysics" : {
        "bCoef" : 0,
        "acceleration" : 0.11,
        "kickingAcceleration" : 0.083,
        "kickStrength" : 4.2

    },

    "ballPhysics" : {
        "radius" : 5.8,
        "bCoef" : 0.412,
        "invMass" : 1.5,
        "damping" : 0.99,
        "color" : "ffd133"

    }
}`;


var smallmap = `{

    "name" : "[EFC][Small] by Kang",

    "width" : 497,

    "height" : 220,

    "spawnDistance" : 350,

    "bg" : { "type" : "hockey" },

    "vertexes" : [
        /* 0 */ { "x" : 400, "y" : 190, "trait" : "ballArea" },
        /* 1 */ { "x" : 400, "y" : -190, "trait" : "ballArea" },

        /* 2 */ { "x" : 0, "y" : 220, "trait" : "kickOffBarrier" },
        /* 3 */ { "x" : 0, "y" : 60, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 4 */ { "x" : 0, "y" : -60, "trait" : "kickOffBarrier", "color" : "3377ae", "vis" : true, "curve" : 180 },
        /* 5 */ { "x" : 0, "y" : -220, "trait" : "kickOffBarrier" },

        /* 6 */ { "x" : -400, "y" : -70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B", "pos" : [-700,-80 ] },
        /* 7 */ { "x" : -440, "y" : -70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "pos" : [-700,-80 ], "bCoef" : 0.8 },
        /* 8 */ { "x" : -440, "y" : 70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : -23, "color" : "DA4D4B", "pos" : [-700,80 ], "bCoef" : 0.8 },
        /* 9 */ { "x" : -400, "y" : 70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "DA4D4B", "pos" : [-700,80 ] },
        /* 10 */ { "x" : 400, "y" : -70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "3377ae", "pos" : [700,-80 ] },
        /* 11 */ { "x" : 440, "y" : -70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "pos" : [700,-80 ], "bCoef" : 0.8 },
        /* 12 */ { "x" : 440, "y" : 70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 23, "color" : "3377ae", "pos" : [700,80 ], "bCoef" : 0.8 },
        /* 13 */ { "x" : 400, "y" : 70, "cMask" : ["ball" ], "trait" : "goalNet", "curve" : 0, "color" : "3377ae", "pos" : [700,80 ] },

        /* 14 */ { "x" : -400, "y" : 70, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a", "pos" : [-700,80 ] },
        /* 15 */ { "x" : -400, "y" : 190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 16 */ { "x" : -400, "y" : -70, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a", "pos" : [-700,-80 ] },
        /* 17 */ { "x" : -400, "y" : -190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 18 */ { "x" : -400, "y" : 190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 19 */ { "x" : 400, "y" : 190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 20 */ { "x" : 400, "y" : 70, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "pos" : [700,80 ], "color" : "1e252a" },
        /* 21 */ { "x" : 400, "y" : 190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 22 */ { "x" : 400, "y" : -190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a" },
        /* 23 */ { "x" : 400, "y" : -70, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "color" : "1e252a", "pos" : [700,-80 ] },
        /* 24 */ { "x" : 400, "y" : -190, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 25 */ { "x" : 400, "y" : -190, "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea" },
        /* 26 */ { "x" : -400, "y" : -190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "1e252a" },
        /* 27 */ { "x" : 400, "y" : -190, "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "color" : "1e252a" },

        /* 28 */ { "x" : 0, "y" : -190, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 29 */ { "x" : 0, "y" : -62, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 30 */ { "x" : 0, "y" : 62, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 31 */ { "x" : 0, "y" : 190, "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier", "color" : "737573" },
        /* 32 */ { "x" : 0, "y" : -62, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 33 */ { "x" : 0, "y" : 62, "bCoef" : 0.1, "cMask" : ["red","blue" ], "trait" : "kickOffBarrier", "vis" : true, "color" : "F8F8F8" },
        /* 34 */ { "x" : 0, "y" : 62, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 35 */ { "x" : 0, "y" : -62, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : -180 },
        /* 36 */ { "x" : 0, "y" : 62, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : 0 },
        /* 37 */ { "x" : 0, "y" : -62, "trait" : "kickOffBarrier", "color" : "F8F8F8", "vis" : true, "curve" : 0 },

        /* 38 */ { "x" : -407.5, "y" : 70, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [-700,80 ] },
        /* 39 */ { "x" : -407.5, "y" : 190, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },
        /* 40 */ { "x" : -407.5, "y" : -190, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 41 */ { "x" : -407.5, "y" : -70, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [-700,-80 ] },
        /* 42 */ { "x" : 407.5, "y" : -190, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        /* 43 */ { "x" : 407.5, "y" : -70, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0, "pos" : [700,-80 ] },
        /* 44 */ { "x" : 407.5, "y" : 70, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false, "pos" : [700,80 ] },
        /* 45 */ { "x" : 407.5, "y" : 190, "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "curve" : 0, "vis" : false },

        /* 46 */ { "x" : 0, "y" : 62, "bCoef" : 0.1, "trait" : "line", "color" : "afa370" },
        /* 47 */ { "x" : -400, "y" : -70, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 48 */ { "x" : -400, "y" : 70, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 49 */ { "x" : 400, "y" : -70, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 50 */ { "x" : 400, "y" : 70, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 51 */ { "x" : 0, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 52 */ { "x" : 0, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 53 */ { "x" : 0, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 54 */ { "x" : 0, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 55 */ { "x" : -398, "y" : -130, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 56 */ { "x" : -398, "y" : 130, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 57 */ { "x" : 398, "y" : -130, "bCoef" : 0.1, "trait" : "line", "curve" : -180, "color" : "737573" },
        /* 58 */ { "x" : 398, "y" : 130, "bCoef" : 0.1, "trait" : "line", "curve" : -180, "color" : "737573" },
        /* 59 */ { "x" : 350, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 60 */ { "x" : 350, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 61 */ { "x" : 350, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 62 */ { "x" : 350, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 63 */ { "x" : -350, "y" : -2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 64 */ { "x" : -350, "y" : 2, "bCoef" : 0.1, "trait" : "line", "color" : "737573" },
        /* 65 */ { "x" : -350, "y" : -2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" },
        /* 66 */ { "x" : -350, "y" : 2, "bCoef" : 0.1, "trait" : "line", "curve" : 180, "color" : "737573" }

    ],

    "segments" : [
        { "v0" : 6, "v1" : 7, "curve" : 0, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,-80 ], "y" : -70 },
        { "v0" : 7, "v1" : 8, "curve" : -23, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "x" : -440, "bCoef" : 0.8 },
        { "v0" : 8, "v1" : 9, "curve" : 0, "color" : "DA4D4B", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [-700,80 ], "y" : 70 },
        { "v0" : 10, "v1" : 11, "curve" : 0, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,-80 ], "y" : -70 },
        { "v0" : 11, "v1" : 12, "curve" : 23, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "x" : 440, "bCoef" : 0.8 },
        { "v0" : 12, "v1" : 13, "curve" : 0, "color" : "3377ae", "cMask" : ["ball" ], "trait" : "goalNet", "pos" : [700,80 ], "y" : 70 },

        { "v0" : 2, "v1" : 3, "trait" : "kickOffBarrier" },
        { "v0" : 3, "v1" : 4, "curve" : 180, "vis" : true, "color" : "DA4D4B", "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 3, "v1" : 4, "curve" : -180, "vis" : true, "color" : "3377ae", "cGroup" : ["redKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 4, "v1" : 5, "trait" : "kickOffBarrier" },

        { "v0" : 14, "v1" : 15, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -400 },
        { "v0" : 16, "v1" : 17, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -400 },
        { "v0" : 18, "v1" : 19, "curve" : 0, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : 190 },
        { "v0" : 20, "v1" : 21, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 400 },
        { "v0" : 22, "v1" : 23, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 400 },
        { "v0" : 24, "v1" : 25, "vis" : true, "color" : "F8F8F8", "bCoef" : 0, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 400, "y" : -190 },
        { "v0" : 26, "v1" : 27, "curve" : 0, "vis" : true, "color" : "1e252a", "bCoef" : 1, "cMask" : ["ball" ], "trait" : "ballArea", "y" : -190 },

        { "v0" : 28, "v1" : 29, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },
        { "v0" : 30, "v1" : 31, "vis" : true, "color" : "737573", "bCoef" : 0.1, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "trait" : "kickOffBarrier" },

        { "v0" : 38, "v1" : 39, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -407.5 },
        { "v0" : 40, "v1" : 41, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : -407.5 },
        { "v0" : 42, "v1" : 43, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 407.5 },
        { "v0" : 44, "v1" : 45, "curve" : 0, "vis" : false, "color" : "F8F8F8", "bCoef" : 2, "cMask" : ["ball" ], "trait" : "ballArea", "x" : 407.5 },

        { "v0" : 47, "v1" : 48, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -400 },
        { "v0" : 49, "v1" : 50, "curve" : 0, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 400 },
        { "v0" : 51, "v1" : 52, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 53, "v1" : 54, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 55, "v1" : 56, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line" },
        { "v0" : 57, "v1" : 58, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 400 },
        { "v0" : 59, "v1" : 60, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 350 },
        { "v0" : 61, "v1" : 62, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : 350 },
        { "v0" : 63, "v1" : 64, "curve" : -180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -350 },
        { "v0" : 65, "v1" : 66, "curve" : 180, "vis" : true, "color" : "737573", "bCoef" : 0.1, "trait" : "line", "x" : -350 }

    ],

    "goals" : [
        { "p0" : [-406.3,-70 ], "p1" : [-406.3,70 ], "team" : "red" },
        { "p0" : [406.3,70 ], "p1" : [406.3,-70 ], "team" : "blue" }

    ],

    "discs" : [
        { "radius" : 5, "pos" : [-400,70 ], "color" : "ce9e9e", "trait" : "goalPost", "y" : 80 },
        { "radius" : 5, "pos" : [-400,-70 ], "color" : "ce9e9e", "trait" : "goalPost", "y" : -80, "x" : -560 },
        { "radius" : 5, "pos" : [400,70 ], "color" : "9eafce", "trait" : "goalPost", "y" : 80 },
        { "radius" : 5, "pos" : [400,-70 ], "color" : "9eafce", "trait" : "goalPost", "y" : -80 }

    ],

    "planes" : [
        { "normal" : [0,1 ], "dist" : -190, "bCoef" : 1, "trait" : "ballArea", "vis" : false, "curve" : 0 },
        { "normal" : [0,-1 ], "dist" : -190, "bCoef" : 1, "trait" : "ballArea" },

        { "normal" : [0,1 ], "dist" : -220, "bCoef" : 0.1 },
        { "normal" : [0,-1 ], "dist" : -220, "bCoef" : 0.1 },
        { "normal" : [1,0 ], "dist" : -492, "bCoef" : 0.1 },
        { "normal" : [-1,0 ], "dist" : -492, "bCoef" : 0.1 },

        { "normal" : [1,0 ], "dist" : -490, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 },
        { "normal" : [-1,0 ], "dist" : -490, "bCoef" : 0.1, "cMask" : ["ball" ], "trait" : "ballArea", "vis" : false, "curve" : 0 }

    ],

    "traits" : {
        "ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },
        "goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
        "goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },
        "line" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["" ] },
        "kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] }

    },

    "playerPhysics" : {
        "bCoef" : 0,
        "acceleration" : 0.11,
        "kickingAcceleration" : 0.083,
        "kickStrength" : 4.2

    },

    "ballPhysics" : {
        "radius" : 5.8,
        "bCoef" : 0.412,
        "invMass" : 1.5,
        "damping" : 0.99,
        "color" : "ffd133"

    }
}`;


var maps = {
    "big": bigmap,
    "medium": mediummap,
    "small": smallmap
};