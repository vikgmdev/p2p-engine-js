import P2PNetwork from './p2p-network';

const me = process.argv[2];
const peers = process.argv.slice(3);

const p2pNetwork = new P2PNetwork(me, peers);

p2pNetwork.on('connection', (socket, peerId) => {
  console.log('[a peer joined]:', peerId);
  socket.on('data', (data: Buffer) => {
    console.log(data.toString().trim());
  });
});

process.stdin.on('data', (data: string) => {
  p2pNetwork.connections.forEach((peer) => peer.write(data));
});
