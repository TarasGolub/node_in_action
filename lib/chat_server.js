const socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};


exports.listen = function(server) {
    io = socketio.listen(server);
    // io.set('log level', 1);
    io.sockets.on('connection', socket => {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');

        handleMessageBrooadcasting(socket);
        handleNameChangesAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', () => {
            socket.emit('rooms', io.of('/').adapter.rooms);
        });

        handleClientDisconection(socket, nickNames, namesUsed);
    });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    let name = `Guest${guestNumber}`;

    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    });

    namesUsed.push(name);

    return guestNumber + 1;
};

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;

    socket.emit('joinResult', {
        success: true,
        room: room
    });

    socket.broadcast.to(room).emit('message', {
        text: `${nickNames[socket.id]} has joined ${room}.`
    });

    var usersInRoom = io.of('/').in(room).connected;
console.log(usersInRoom);
    if (usersInRoom.length > 1) {
        var usersInRoomStr = Object.entries(usersInRoom)
            .filter(user => user[0] !== socket.id)
            .map(user => user[1])
            .join(',');

        socket.broadcast.to(room).emit('message', {
            text: `Users currently in room: ${usersInRoomStr}.`
        });
    }
};

function handleMessageBrooadcasting(socket) {
    socket.on('message', (message) => {
        console.log('message.room');
        console.log(message.room);
        socket.broadcast.to(message.room).emit('message', {
            text: `${nickNames[socket.id]}: ${message.text}`
        });
    });
};

function handleNameChangesAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', (name) => {
        if (name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Name cannot starts with "Guest"'
            });
        } else if (~namesUsed.indexOf(name)) {
            socket.emit('nameResult', {
                success: false,
                message: 'Name is already in use'
            });
        } else {
            let prevName = nickNames[socket.id];
            let nameIndex = namesUsed.indexOf(prevName);

            nickNames[socket.id] = name;
            namesUsed[nameIndex] = name;

            socket.emit('nameResult', {
                success: true,
                name: name
            });

            socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                test: `${prevName} is now known as ${name}`
            });
        }
    });
};

function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
};

function handleClientDisconection(socket, nickNames, namesUsed) {
    socket.on('disconect',() => {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);

        delete namesUsed[nameIndex];
        delete nickNames[socket.ID];
    });
};