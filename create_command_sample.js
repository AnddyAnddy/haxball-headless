/**
 * Write "!echo" on chat will trigger the following command
 * It will send the message written by the player back to his PMs.
 */

const COMMAND_NAME = "echo";

// display of the result of the command
_room.view[COMMAND_NAME] = function (player, message) {
    room.sendAnnouncement(message, player.id);
}

_room.controller.commands[COMMAND_NAME] = {
    // The command is enabled
    enabled: true,

    // The message sent by the player is displayed
    displayed: true,

    // This command doesn't need any special argument
    argc: 0,

    // This command can be used by any player 
    // [0: everyone, 1: admin, 2: super admins]
    adminLevel: 0,

    // function definition
    fun:
        function (player, message) {
            _room.view[COMMAND_NAME](player, message);
        }
};