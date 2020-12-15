import { Readable, Writable } from 'stream';
import varint from 'varint';

const POOL_SIZE = 100000;
const MINIMUM_POOL_LENGTH = 100;
let pool = Buffer.alloc(POOL_SIZE);

export function read(stream: Readable, cb) {
  let msglen = 0;
  let prev: Buffer | null = null;
  let lock = false;

  const unlock = () => lock = false;

  const readable = () => {
    if (lock) return;
    lock = true;

    if (!msglen) {
      let buf = stream.read();
      if (!buf) return unlock();
      if (prev) {
        buf = Buffer.concat([prev, buf]);
        prev = null;
      }

      for (var i = 0; i < buf.length; i++) {
        if (!(buf[i] & 0x80)) {
          msglen = varint.decode(buf);
          break;
        }
      }
      if (!msglen) {
        prev = buf;
        return unlock();
      }
      buf = buf.slice(varint.decode.bytes);
      stream.unshift(buf);
    }

    const chunk = stream.read(msglen);
    if (!chunk) return unlock();

    stream.removeListener('readable', readable);
    cb(chunk)
  };

  stream.on('readable', readable);
  readable();
};

export function write(stream: Writable, msg: Buffer) {
  if (typeof msg === 'string') msg = Buffer.from(msg);
  varint.encode(msg.length, pool);
  var lenBuf = pool.slice(0, varint.encode.bytes);
  pool = pool.slice(varint.encode.bytes);
  if (pool.length < MINIMUM_POOL_LENGTH) pool = Buffer.alloc(POOL_SIZE);

  stream.write(lenBuf);
  stream.write(msg);
};