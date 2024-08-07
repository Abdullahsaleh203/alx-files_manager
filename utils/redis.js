import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor () {
    this.myClient = createClient();
    this.myClient.on('error', (error) => console.log(error));
  }

  isAlive () {
    return this.myClient.connected;
  }

  async get (key) {
    const getAsync = promisify(this.myClient.GET).bind(this.myClient);
    return getAsync(key);
  }

  async set (key, val, time) {
    const setAsync = promisify(this.myClient.SET).bind(this.myClient);
    return setAsync(key, val, 'EX', time);
  }

  async del (key) {
    const delAsync = promisify(this.myClient.DEL).bind(this.myClient);
    return delAsync(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
