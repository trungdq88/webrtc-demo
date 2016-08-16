var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8080);

var io = socketIO.listen(app);

var alice;
var bobList= {};

io.sockets.on('connection', function(socket) {
  // Wait for Alice
  socket.on('i-am-alice', function () {
    alice = socket;
    console.log('Alice has come!');
  });

  // Wait for Bob(s)
  socket.on('i-am-bob-and-i-want-to-connect', function () {
    // Give Bob a name
    var bob = 'Bob-' + socket.id;
    bobList[socket.id] = socket;

    // Tell Alice bob is coming
    alice.emit('bob-is-coming', bob);

    console.log(bob, ' has come! Told Alice about that.');
  });

  socket.on('alice-offer-a-session', function (sessionDescription) {
    console.log('Alice sent an offer...');
    // Deliver the offer to all Bobs
    for (var i = 0; i < Object.keys(bobList).length; i++) {
      var bob = bobList[Object.keys(bobList)[i]];
      bob.emit('alice-offer-a-session', sessionDescription);
      console.log('...delivered the offer to Bob-', bob.id);
    }
  });

  socket.on('bob-answer-the-offer', function (sessionDescription) {
    // Deliver the answer to Alice
    var bob = 'Bob-' + socket.id;
    alice.emit('bob-answer-the-offer', {
      bobName: bob,
      sessionDescription: sessionDescription,
    });
    console.log(bob, ' answered the offer. Told Alice about that.');
  });

  socket.on('alice-sending-ice-candidate', function (candidate) {
    // Deliver the candidate to all Bobs
    console.log('Alice sent an ICE candidate...');
    for (var i = 0; i < Object.keys(bobList).length; i++) {
      var bob = bobList[Object.keys(bobList)[i]];
      bob.emit('alice-sending-ice-candidate', candidate);
      console.log('...delivered the ICE candidate to Bob-', bob.id);
    }
  });

  socket.on('bob-sending-ice-candidate', function (candidate) {
    // Deliver the candidate to Alice
    var bob = 'Bob-' + socket.id;
    alice.emit('bob-sending-ice-candidate', {
      bobName: bob,
      candidate: candidate,
    });
    console.log(bob, ' sent an ICE candidate. Delivered that to Alice.');
  });
});

io.sockets.on('connection', function(socket) {
  // Who has just disconnected?
  if (alice && socket.id === alice.id) {
    // Alice is tired, game over
    return;
  }

  if (bobList[socket.id]) {
    // Bob left, tell alice
    var bob = 'Bob-' + socket.id;
    alice.emit('bob-is-leaving', bob);
  }
});

console.log('Server is on, waiting for Alice and Bob(s)');
