var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
var fetch = require('node-fetch');
require('dotenv').config({silent: true}); // Load config from .env file

// Serve client static files
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8080);

var io = socketIO.listen(app);

// Alice socket object
var alice;

// List of Bobs {key: value}
// - key: string of bob name (socket id)
// - value: Socket
var bobList = {};

// STUN/TURN servers for Alice and Bobs
var getStunTurnServers = function () {
  return fetch('https://service.xirsys.com/ice?' +
    'ident' + '=' + process.env.XIRSYS_IDENTITY +
    '&secret' + '=' + process.env.XIRSYS_SECRET +
    '&domain' + '=' + process.env.XIRSYS_DOMAIN +
    '&application' + '=' + process.env.XIRSYS_APPLICATION +
    '&room' + '=' + process.env.XIRSYS_ROOM +
    '&secure' + '=' + process.env.XIRSYS_SECURE
  )
    .then(function (r) { return r.json() })
    .then(function (response) {
      if (response.s === 200) {
        console.log('STUN/TURN servers are ready.')
        return response.d;
      } else {
        console.log('Could not get STUN/TURN servers :-(')
        return null;
      }
    });
}

io.sockets.on('connection', function(socket) {

  // Send STUN/TURN servers info to who ever just connected, saying hello
  getStunTurnServers().then(function (servers) {
      socket.emit('hello-here-are-your-stun-turn-servers', servers)
  });

  // 1. Alice come
  socket.on('i-am-alice', function () {
    if (!alice) {
      alice = socket;

      console.log('Alice has come!');
    } else {
      console.log('New alice has come but ignored because already had one.');
    }
  });

  // 2. Bob come
  socket.on('i-am-bob-and-i-want-to-connect', function () {
    // Give Bob a name
    var bob = 'Bob-' + socket.id;

    bobList[bob] = socket;

    // Say sorry if there is no Alice
    if (!alice) {
      console.log(bob, ' come but Alice is not around :-(');
      socket.emit('sorry-alice-is-not-here');
      return;
    }

    // Tell Alice bob is coming
    alice.emit('bob-is-coming', bob);

    console.log(bob, ' has come! Told Alice about that.');
  });

  // 3. Alice send Bob an offer
  socket.on('alice-offer-a-session', function (data) {
    console.log('Alice sent an offer to ', data.bobName);
    bobList[data.bobName].emit('alice-offer-a-session', data.sessionDescription);
  });

  // 4. Bob answer the offer
  socket.on('bob-answer-the-offer', function (sessionDescription) {
    // Deliver the answer to Alice
    var bob = 'Bob-' + socket.id;
    alice.emit('bob-answer-the-offer', {
      bobName: bob,
      sessionDescription: sessionDescription,
    });
    console.log(bob, ' answered the offer. Told Alice about that.');
  });

  // 5. Alice send ICE candidate info
  socket.on('alice-sending-ice-candidate', function (data) {
    // Deliver the candidate to all Bobs
    console.log('Alice sent an ICE candidate to ', data.bobName);
    bobList[data.bobName].emit('alice-sending-ice-candidate', data.candidate);
  });

  // 6. Bob send ICE candidate info
  socket.on('bob-sending-ice-candidate', function (candidate) {
    // Deliver the candidate to Alice
    var bob = 'Bob-' + socket.id;
    alice.emit('bob-sending-ice-candidate', {
      bobName: bob,
      candidate: candidate,
    });
    console.log(bob, ' sent an ICE candidate. Delivered that to Alice.');
  });

  // 7. FIN
  socket.on('disconnect', function () {
    // Who has just disconnected?
    if (alice && socket.id === alice.id) {
      // Alice left :-(
      alice = null;
      io.emit('alice-left');
      console.log('Alice left :-(')
      return;
    }

    var bob = 'Bob-' + socket.id;
    if (bobList[bob]) {
      // Bob left, tell Alice (if Alice is there)
      alice && alice.emit('bob-is-leaving', bob);
      console.log(bob, ' left :-(')
    }
  });
});

console.log('Signalling Server is on, waiting for Alice and Bob(s)');
