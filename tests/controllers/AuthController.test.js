const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const AuthController = require('./authController');
const DBClient = require('../utils/db');
const RedisClient = require('../utils/redis');

const { expect } = chai;

chai.use(chaiHttp);

describe('AuthController', () => {
  describe('getConnect', () => {
    it('should return a token if valid credentials are provided', async () => {
      const request = {
        header: (headerName) => {
          if (headerName === 'Authorization') {
            return 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='; // Base64-encoded "username:password"
          }
          return null;
        },
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(200);
          return {
            send: (data) => {
              expect(data).to.have.property('token').to.be.a('string');
            },
          };
        },
      };

      // Mock DBClient methods
      sinon.stub(DBClient.db.collection('users'), 'findOne').resolves({ _id: 'user_id' });

      // Mock RedisClient methods
      sinon.stub(RedisClient, 'set').resolves('OK');

      await AuthController.getConnect(request, response);

      // Restore the original methods
      DBClient.db.collection('users').findOne.restore();
      RedisClient.set.restore();
    });

    it('should return an Unauthorized error if invalid credentials are provided', async () => {
      const request = {
        header: () => null,
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(401);
          return {
            send: (error) => {
              expect(error).to.have.property('error').to.equal('Unauthorized');
            },
          };
        },
      };

      await AuthController.getConnect(request, response);
    });
  });

  describe('getDisconnect', () => {
    it('should disconnect and return a 204 status if a valid token is provided', async () => {
      const request = {
        header: (headerName) => {
          if (headerName === 'X-Token') {
            return 'valid_token';
          }
          return null;
        },
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(204);
          return {
            send: () => {},
          };
        },
      };

      // Mock RedisClient methods
      sinon.stub(RedisClient, 'get').resolves('user_id');
      sinon.stub(RedisClient, 'del').resolves('OK');

      await AuthController.getDisconnect(request, response);

      // Restore the original methods
      RedisClient.get.restore();
      RedisClient.del.restore();
    });

    it('should return an Unauthorized error if an invalid token is provided', async () => {
      const request = {
        header: () => null,
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(401);
          return {
            send: (error) => {
              expect(error).to.have.property('error').to.equal('Unauthorized');
            },
          };
        },
      };

      await AuthController.getDisconnect(request, response);
    });
  });
});
