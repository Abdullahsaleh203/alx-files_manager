import RedisClient from '../utils/redis';
import DBClient from '../utils/db';

class AppController {
  static getStatus (request, response) {
    const status = {
      redis: RedisClient.isAlive(),
      db: DBClient.isAlive()
    };
    return response.status(200).send(status);
  }

  static async getStats (request, response) {
    const stats = {
      users: await DBClient.nbUsers(),
      files: await DBClient.nbFiles()
    };
    return response.status(200).send(stats);
  }
}

module.exports = AppController;
