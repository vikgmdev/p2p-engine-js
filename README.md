# P2P Engine JS

A sample p2p implementation made with Typescript and NodeJS

### Setup

```shell
npm install
```

### How to run

Command:

```shell
npm run serve HOST:PORT [list of peers HOST:PORT]
```

### Sample

Node 1 (terminal 1):

```shell
npm run serve localhost:10001 localhost:10002 localhost:10003 localhost:10004
```

Node 2 (terminal 2):

```shell
npm run serve localhost:10002 localhost:10001 localhost:10003 localhost:10004
```

Node 3 (terminal 3):

```shell
npm run serve localhost:10003 localhost:10001 localhost:10002 localhost:10004
```

Node 4 (terminal 4):

```shell
npm run serve localhost:10004 localhost:10001 localhost:10002 localhost:10003
```

### Broadcast a message:

Write a message in any of the terminals and it should be broadcasted to all the connected peers.
