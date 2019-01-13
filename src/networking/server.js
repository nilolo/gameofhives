const GameInstance = require('../game/GameInstance');
const playerCodes = require('../game/playerCodes');

const io = require('socket.io')();
// number of rows, number of columns, keep a ratio of 9:16
const dim = [9,16];
// time per tick in ms
const tickLength = 4000;
// list of possible square states. define a css class for each of these in the frontend
const classes = ["", "red", "blue"];

const port = 8000;

var clientCount = 0;

var gameInstance = new GameInstance(dim[0], dim[1]);

// array containing the client-ids of the clients currently playing  
var isPlaying = [];

var data = {
  // 2d-array of square states
  boardData: [ 
  ],
  tickLength: tickLength,
};

for(let i = 0; i < dim[0]; i++) {
    data.boardData.push(Array());
    for(let j = 0; j < dim[1]; j++) {
        data.boardData[i].push("");
    }
}

io.on('connection', (client) => {
    console.log('client ' + client.id + ' has connected');
    // assign client a playerCode
    if(clientCount === 0) {
        client.playerCode = playerCodes.PLAYER_1
    } else {
        client.playerCode = playerCodes.PLAYER_2
    }
    clientCount++; //use isPlaying array instead
    client.on('clickEvent', function(data){
        console.log('client ' + client.id + ' clicked on ' + data.rowIndex + '|' + data.columnIndex);
        gameInstance.setField(data.columnIndex, data.rowIndex, client.playerCode);
    });
    client.on('join', (data) => {
        isPlaying.push(client.id);
        console.log('client ' + client.id + ' joined the game');
    });
});

setInterval(() => {
    // this is the entry point for the game logic
    gameInstance.updateField();
    data.boardData = gameInstance.getFieldClasses();
    // send data to every client
    isPlaying.forEach((clientId) => {
        io.to(clientId).emit('dataBroadcast', data);
    });
    io.sockets.emit('broadcast', data);
}, tickLength);




io.listen(port);
console.log('listening on port ', port);