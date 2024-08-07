const chai = require('chai');
const sinon = require('sinon');
const DBClient = require('./dbClient');
const { MongoClient } = require('mongodb');

const { expect } = chai;

describe('DBClient', () => {
  let mockClient;

  before(() => {
    // Mock the MongoClient constructor and its methods
    mockClient = sinon.createStubInstance(MongoClient);
    sinon.stub(MongoClient, 'connect').resolves(mockClient);
  });

  after(() => {
    // Restore the original MongoClient constructor and its methods
    sinon.restore();
  });

  describe('isAlive', () => {
    it('should return true if the client is connected', async () => {
      mockClient.isConnected.returns(true);
      const dbClient = new DBClient();
      const alive = dbClient.isAlive();
      expect(alive).to.be.true;
    });

    it('should return false if the client is not connected', async () => {
      mockClient.isConnected.returns(false);
      const dbClient = new DBClient();
      const alive = dbClient.isAlive();
      expect(alive).to.be.false;
    });
  });

  describe('nbUsers', () => {
    it('should return the number of users from the database', async () => {
      const mockUsersCollection = {
        countDocuments: sinon.stub().resolves(42),
      };
      mockClient.db.returns({ collection: sinon.stub().withArgs('users').returns(mockUsersCollection) });

      const dbClient = new DBClient();
      const usersNum = await dbClient.nbUsers();
      expect(usersNum).to.equal(42);
    });
  });

  describe('nbFiles', () => {
    it('should return the number of files from the database', async () => {
      const mockFilesCollection = {
        countDocuments: sinon.stub().resolves(100),
      };
      mockClient.db.returns({ collection: sinon.stub().withArgs('files').returns(mockFilesCollection) });

      const dbClient = new DBClient();
      const filesNum = await dbClient.nbFiles();
      expect(filesNum).to.equal(100);
    });
  });
});
