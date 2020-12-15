import { EventEmitter } from 'events';
import net from 'net';
import * as lpmessage from './lpmessage';

interface PeerNode {
  id: string;
  host?: string;
  port?: number;
  retries?: number;
  reconnectTimeout?: NodeJS.Timeout;
  pendingSocket?: net.Socket;
  socket?: net.Socket;
}

interface Peers {
  [peer: string]: PeerNode;
}

export default class Peer extends EventEmitter {
  me: string | Buffer;
  peers: Peers = {};

  server?: net.Server;

  onconnection = (socket: net.Socket) => {
    this.errorHandle(socket);

    lpmessage.read(socket, (from) => {
      from = from.toString();

      const peer = (this.peers[from] = this.peers[from] || { id: from });
      if (from > this.me) return this.connect(peer, socket);

      lpmessage.write(socket, this.me as Buffer);
      this.attachCleanup(peer, socket);
      this.onready(peer, socket);
    });
  };

  connect = (peer: PeerNode, socket?: net.Socket) => {
    if (peer.socket || peer.pendingSocket) return socket && socket.destroy();
    if (peer.reconnectTimeout) clearTimeout(peer.reconnectTimeout);

    if (!socket) socket = net.connect(peer.port, peer.host);
    lpmessage.write(socket, this.me as Buffer);
    peer.pendingSocket = socket;

    if (this.me > peer.id) return this.onconnection(socket);

    this.errorHandle(socket);
    this.attachCleanup(peer, socket);

    lpmessage.read(socket, () => this.onready(peer, socket));
  };

  private onready = (peer, socket: net.Socket) => {
    socket.setTimeout(0); // reset timeout
    const oldSocket = peer.socket;
    peer.retries = 0;
    peer.socket = socket;
    peer.pendingSocket = null;
    if (oldSocket) oldSocket.destroy();
    this.emit('connection', peer.socket, peer.id);
  };

  private attachCleanup = (peer, socket: net.Socket) => {
    socket.on('close', () => {
      if (peer.socket === socket) peer.socket = null;
      if (peer.pendingSocket === socket) peer.pendingSocket = null;
      if (peer.socket) return;

      if (!peer.host) return delete this.peers[peer.id];

      const reconnect = () => this.connect(peer);

      peer.retries++;
      peer.reconnectTimeout = setTimeout(reconnect, (1 << peer.retries) * 250);
      this.emit('reconnect', peer.id, peer.retries);
    });
  };

  private errorHandle = (socket: net.Socket) => {
    socket.on('error', () => socket.destroy());

    socket.setTimeout(15000, () => socket.destroy()); // 15s to do the handshake
  };
}
