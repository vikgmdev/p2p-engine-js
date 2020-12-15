import net from 'net';
import lpmessage from './lpmessage';

function attachCleanup(self, peer, socket) {
    socket.on('close', function() {
        if (peer.socket === socket) peer.socket = null;
        if (peer.pendingSocket === socket) peer.pendingSocket = null;
        if (peer.socket) return;

        if (!peer.host) return delete self.peers[peer.id];

        var reconnect = function() {
            connect(self, peer);
        };

        peer.retries++;
        peer.reconnectTimeout = setTimeout(reconnect, (1 << peer.retries) * 250);
        self.emit('reconnect', peer.id, peer.retries);
    });
};

function errorHandle(self, socket) {
    socket.on('error', function() {
        socket.destroy();
    });

    socket.setTimeout(15000, function() { // 15s to do the handshake
        socket.destroy();
    });
};

function onready(self, peer, socket) {
    socket.setTimeout(0); // reset timeout
    var oldSocket = peer.socket;
    peer.retries = 0;
    peer.socket = socket;
    peer.pendingSocket = null;
    if (oldSocket) oldSocket.destroy();
    self.emit('connection', peer.socket, peer.id);
};

export function onconnection(self, socket) {
    errorHandle(self, socket);
    lpmessage.read(socket, function(from) {
        from = from.toString();

        var peer = self.peers[from] = self.peers[from] || {id:from};
        if (from > self.me) return connect(self, peer, socket);

        lpmessage.write(socket, self.me);
        attachCleanup(self, peer, socket);
        onready(self, peer, socket);
    });
};

export function connect(self, peer, socket) {
    if (peer.socket || peer.pendingSocket) return socket && socket.destroy();
    if (peer.reconnectTimeout) clearTimeout(peer.reconnectTimeout);

    if (!socket) socket = net.connect(peer.port, peer.host);
    lpmessage.write(socket, self.me);
    peer.pendingSocket = socket;

    if (self.me > peer.id) return onconnection(self, socket);

    errorHandle(self, socket);
    attachCleanup(self, peer, socket);

    lpmessage.read(socket, function() {
        onready(self, peer, socket);
    });
};
