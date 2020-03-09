const P2P = require('./p2p.js');
const me = process.argv[2];
const peers = process.argv.slice(3);

const friends = {}

const swarm = new P2P(me, peers);

swarm.on('connection', (socket, peerId) => {
    console.log('[a friend joined]:', peerId)
    friends[peerId] = socket;
    socket.on('data', data => {
        console.log(data.toString().trim());
    })
})

process.stdin.on('data', data => {
    Object.values(friends).forEach(friend => {
        friend.write(data)
    })
});

