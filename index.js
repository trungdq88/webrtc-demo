var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8080);

var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {

  socket.on('message', function (message) {
    socket.broadcast.emit('message', message);
  });
});
