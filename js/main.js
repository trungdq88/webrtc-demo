var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

var localStream;
var pc1;
var pc2;
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

var startTime;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

function gotStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
}

function gotRemoteStream(e) {
   remoteVideo.srcObject = e.stream;
}
function start() {
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
  var videoTracks = localStream.getVideoTracks();
  var audioTracks = localStream.getAudioTracks();

  var servers = null;
  pc1 = new RTCPeerConnection(servers);
  pc1.onicecandidate = function(e) {
    onIceCandidate(pc1, e);
  };

  pc2 = new RTCPeerConnection(servers);
  pc2.onicecandidate = function(e) {
    onIceCandidate(pc2, e);
  };

  // Create data channel
  sendChannel = pc1.createDataChannel('sendDataChannel');

  sendChannel.onopen = e => console.log('sendChannel open');
  sendChannel.onclose = e => console.log('sendChannel close');

  // Listen to new stream
  pc2.onaddstream = gotRemoteStream;

  // Listen to data channel
  pc2.ondatachannel = e => {
    receiveChannel = event.channel;
    receiveChannel.onmessage = e => dataChannelReceive.value = e.data;;
    receiveChannel.onopen = e => console.log('receiveChannel open');
    receiveChannel.onclose = e => console.log('receiveChannel close');
  };

  // Need to have a stream before sending offer
  pc1.addStream(localStream);

  pc1.createOffer(
    offerOptions
  ).then(
    onCreateOfferSuccess,
    onCreateSessionDescriptionError
  );

}

function sendData() {
  sendChannel.send(dataChannelSend.value);
}

function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}

function onCreateOfferSuccess(desc) {
  pc1.setLocalDescription(desc);
  pc2.setRemoteDescription(desc);

  pc2.createAnswer().then(
    onCreateAnswerSuccess,
    onCreateSessionDescriptionError
  );
}

function onCreateAnswerSuccess(desc) {
  pc2.setLocalDescription(desc);
  pc1.setRemoteDescription(desc);
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

function onIceCandidate(pc, event) {
  if (event.candidate) {
    getOtherPc(pc).addIceCandidate(
      new RTCIceCandidate(event.candidate)
    );
  }
}

function hangup() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
}
