### Setup
```shell
npm install
```

### How to run

Command:
```shell
node peer.js HOST:PORT [list of peers HOST:PORT]
```

### Sample

Node 1 (terminal 1):
```shell
node peer.js localhost:10001 localhost:10002 localhost:10003 localhost:10004
```

Node 2 (terminal 2):
```shell
node peer.js localhost:10002 localhost:10001 localhost:10003 localhost:10004
```

Node 3 (terminal 3):
```shell
node peer.js localhost:10003 localhost:10001 localhost:10002 localhost:10004
```

Node 4 (terminal 4):
```shell
node peer.js localhost:10004 localhost:10001 localhost:10002 localhost:10003
```