import net from 'net';
import Peer from './peer';

export default class P2PNetwork extends Peer {
  constructor(me: string = '', peers: string[] = []) {
    super();

    this.me = me;

    const [, port] = me.split(':');

    // Start server
    if (this.me) this.listen(Number(port));

    // Connect to peers
    if (peers) peers.forEach(this.add);
  }

  listen = (port: number) => {
    this.server = net.createServer(this.onconnection);
    this.server.listen(port);
  };

  public get connections(): net.Socket[] {
    const peers = this.peers;
    return Object.keys(peers)
      .map((id) => peers[id].socket)
      .filter((socket) => socket);
  }

  add = (addr: string) => {
    if (addr === this.me) return;

    const [host, port] = addr.split(':');
    const peer = (this.peers[addr] = this.peers[addr] || { id: addr });

    peer.host = host;
    peer.port = Number(port);
    peer.retries = 0;
    peer.reconnectTimeout = peer.reconnectTimeout || null;
    peer.pendingSocket = peer.pendingSocket || null;
    peer.socket = peer.socket || null;

    this.connect(peer);
  };

  remove = (addr: string) => {
    if (addr === this.me) return;

    const peer = this.peers[addr];
    if (!peer) return;

    delete this.peers[addr];
    peer.host = null; // will stop reconnects
    if (peer.socket) peer.socket.destroy();
    if (peer.pendingSocket) peer.pendingSocket.destroy();
    clearTimeout(peer.reconnectTimeout);
  };

  destroy = () => {
    if (this.server) this.server.close();
    Object.keys(this.peers).forEach(this.remove);
  };
}
