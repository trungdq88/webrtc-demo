var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

var startTime;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

function gotStream(stream) {
  localVideo.srcObject = stream;
  // Add localStream to global scope so it's accessible from the browser console
  window.localStream = localStream = stream;
  callButton.disabled = false;
}

function start() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    console.log(e);
    alert('getUserMedia() error: ' + e.name);
  });
}

function call() {
}

function hangup() {
}
