console.log('123');
require('../css/style.css');
var chat = require('./chat');
console.log(chat);

var socket = io.connect();

$(document).ready(function() {
    var chatApp = new chat.Chat(socket);

    socket.on('nameResult', function(result) {
        var message;

        if (result.success) {
            message = `You are now known as ${result.name}`;
        } else {
            message = `An error occurs: ${result.message}`;
        }

        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult', function(result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('Room changed.'));
    });

    socket.on('message', function(message) {
        $('#messages').append($('<div></div>').text(message.text));
    });

    socket.on('rooms', function(rooms) {
        $('#room-list').empty();

        for (var room in rooms) {
            if (room != '') {
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list').on('click', 'div', function() {
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        })
    });

    setInterval(function() {
        socket.emit('rooms');
    }, 1000);

    $('#send-message').focus();

    $('#send-form').on('submit', function() {
        processUserInput(chatApp, socket);
        return false;
    });
});

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;

    if (message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divEscapedContentElement(message));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
}