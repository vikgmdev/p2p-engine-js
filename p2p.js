var net = require('net');
var { EventEmitter } = require('events');
const {
    onconnection,
    connect
} = require('./p2p-events')

class P2P extends EventEmitter {
    
    constructor(me, peers) {
        super();
        
        this.me = me || '';
        this.peers = {};
        this.server = null;

        const [, port ] = me.split(':');
        
        if (this.me) this.listen(Number(port));

        if (peers) peers.forEach(this.add.bind(this));
    }

    get connections() {
        var peers = this.peers;
        return Object.keys(peers)
            .map(function(id) {
                return peers[id].socket;
            })
            .filter(function(socket) {
                return socket;
            });
    }

    peer(addr) {
        return (this.peers[addr] && this.peers[addr].socket) || null;
    }

    listen(port) {
        const self = this;      
        this.server = net.createServer(function(socket) {
            onconnection(self, socket);
        });
        
        this.server.listen(port);
    }

    add(addr) {
        if (addr === this.me) return;
        
        const [ host, port ] = addr.split(':');
        const peer = this.peers[addr] = this.peers[addr] || {id:addr};
        
        peer.host = host;
        peer.port = Number(port);
        peer.retries = 0;
        peer.reconnectTimeout = peer.reconnectTimeout || null;
        peer.pendingSocket = peer.pendingSocket || null;
        peer.socket = peer.socket || null;
        
        connect(this, peer);
    }
    
    remove(addr) {
        if (addr === this.me) return;
        
        var peer = this.peers[addr];
        if (!peer) return;
        
        delete this.peers[addr];
        peer.host = null; // will stop reconnects
        if (peer.socket) peer.socket.destroy();
        if (peer.pendingSocket) peer.pendingSocket.destroy();
        clearTimeout(peer.reconnectTimeout);
    }
    
    destroy() {
        if (this.server) this.server.close();
        Object.keys(this.peers).forEach(this.remove.bind(this));
    }
}

module.exports = P2P;