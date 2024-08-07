const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const UsersController = require('./usersController');
const DBClient = require('../utils/db');
const RedisClient = require('../utils/redis');

const { expect } = chai;

chai.use(chaiHttp);

describe('UsersController', () => {
  describe('postNew', () => {
    it('should create a new user and return user information', async () => {
      const request = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(201);
          return {
            send: (data) => {
              expect(data).to.have.property('id').to.be.a('string');
              expect(data).to.have.property('email').to.equal('test@example.com');
            },
          };
        },
      };

      // Mock DBClient methods
      sinon.stub(DBClient.db.collection('users'), 'findOne').resolves(null);
      sinon.stub(DBClient.db.collection('users'), 'insertOne').resolves({ insertedId: 'user_id' });

      await UsersController.postNew(request, response);

      // Restore the original methods
      DBClient.db.collection('users').findOne.restore();
      DBClient.db.collection('users').insertOne.restore();
    });

    it('should return an error if email already exists', async () => {
      const request = {
        body: {
          email: 'existing@example.com',
          password: 'password123',
        },
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(400);
          return {
            send: (error) => {
              expect(error).to.have.property('error').to.equal('Already exist');
            },
          };
        },
      };

      // Mock DBClient methods
      sinon.stub(DBClient.db.collection('users'), 'findOne').resolves({ email: 'existing@example.com' });

      await UsersController.postNew(request, response);

      // Restore the original methods
      DBClient.db.collection('users').findOne.restore();
    });

    it('should return an error if email or password is missing', async () => {
      const request = {
        body: {},
      };
      const response = {
        status: (statusCode) => {
          expect(statusCode).to.equal(400);
          return {
            send: (error) => {
              expect(error).to.have.property('error');
            },
          };
        },
      };

      await UsersController.postNew(request, response);
    });
  });

  describe('getMe', () => {
    it('should return user information if a valid token is provided', async () => {
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
          expect(statusCode).to.equal(200);
          return {
            send: (data) => {
              expect(data).to.have.property('id').to.be.a('string');
              expect(data).to.have.property('email').to.equal('test@example.com');
            },
          };
        },
      };

      // Mock RedisClient methods
      sinon.stub(RedisClient, 'get').resolves('user_id');

      // Mock DBClient methods
      sinon.stub(DBClient.db.collection('users'), 'findOne').resolves({ _id: 'user_id', email: 'test@example.com' });

      await UsersController.getMe(request, response);

      // Restore the original methods
      RedisClient.get.restore();
      DBClient.db.collection('users').findOne.restore();
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

      await UsersController.getMe(request, response);
    });
  });
});
