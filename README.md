![image](https://cloud.githubusercontent.com/assets/4214509/17803892/54db9104-6623-11e6-8c20-7f3e127cbd32.png)

# Demo for WebRTC

- Alice: `alice.html`
- Bob: `bob.html`
- Signaling Server: `signaling-server.js`

# Technologies

- WebRTC (duh)
- [adapter.js](https://github.com/webrtc/adapter) for client `RTCPeerConncetion` and `getUserMedia`
- [NodeJS with Socket.IO](http://socket.io/) for Signaling Server
- [xirsys](http://xirsys.com) for STUN/TURN server service.

If you want to run this on your server, register an account at [xirsys](http://xirsys.com) and set the necessary variables to `.env` (see `.env.sample`).

    npm start
    
    
