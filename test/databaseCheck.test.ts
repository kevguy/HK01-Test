import {} from 'jest';
// import * as supertest from "supertest";

import * as redis from 'redis';
import * as mongo from 'connect-mongo';
import * as mongoose from 'mongoose';
import * as uuid from 'uuid';
import * as Rx from 'rxjs/Rx';
import { default as Transaction } from '../src/models/Transaction';
import * as controllerHelper from "../src/controllers/helper";

describe("Database and Cache", () => {
  let redisClient;
  const mockReferenceNo = uuid();
  const mockName = 'john doe';
  let checkUniqueReferenceNospy;
  let checkSaveTransactionToDbSpy;
  let checkSaveTransactionToCacheSpy;

  // create mock data
  const data = {
    name: mockName,
    phone: '12345678',
    currency: 'HKD',
    price: '8.88',
    type: 'PAYPAL',
    transactionId: '12345678',
    creditCardNo: '123456789012',
    referenceNo: mockReferenceNo
  };
  const transaction: any = new Transaction(data);
  const mockTransactionInfo = {
    transaction: { id: '12345678' },
    TRANSACTIONID: '12345678'
  };

  // setting up spies
  beforeEach(() => {
    checkUniqueReferenceNospy = jest.spyOn(controllerHelper, 'checkUniqueReferenceNoStream');
    checkSaveTransactionToDbSpy = jest.spyOn(controllerHelper, 'saveTransactionToDbStream');
    checkSaveTransactionToCacheSpy = jest.spyOn(controllerHelper, 'saveTransactionToCacheStream');
  });

  // setting up cache database connection
  beforeAll(() => {
    redisClient = redis.createClient(18736,
                                  'redis-18736.c14.us-east-1-3.ec2.cloud.redislabs.com'
                                  , {no_ready_check: true});
    mongoose.connect('mongodb://kevlai:123456@ds231205.mlab.com:31205/hk01-test');
  });

  it("should be able to save transcaction", (done) => {
    const stream = controllerHelper.saveTransactionStream(
        transaction, mockTransactionInfo, data, mockReferenceNo, redisClient);

    stream.subscribe(
      (result: any) => {
        expect(result).toEqual(expect.objectContaining({
          status: expect.any(String)
        }));
      },
      (err: Error) => { throw err; },
      () => {
        expect(checkUniqueReferenceNospy).toHaveBeenCalled();
        expect(checkSaveTransactionToDbSpy).toHaveBeenCalled();
        expect(checkSaveTransactionToCacheSpy).toHaveBeenCalled();
        done();
      }
    );
  });

  it("should be able to query transaction", (done) => {
    const stream = controllerHelper.createFindRecordFromRedisStream(
      mockName, mockReferenceNo, redisClient);
    stream.subscribe(
      (result: any) => {
        expect(result).toEqual(expect.objectContaining({
          status: expect.any(String)
        }));
        expect(result.result).toEqual(expect.objectContaining({
          referenceNo: expect.any(String),
          name: expect.any(String)
        }));
        expect(result.result.referenceNo).toBe(mockReferenceNo);
        expect(result.result.name).toBe(mockName.toLowerCase());
      },
      (err: Error) => { throw err; },
      () => {
        done();
      }
    );
  });

  afterEach(() => {
    checkUniqueReferenceNospy.mockClear();
    checkSaveTransactionToDbSpy.mockClear();
    checkSaveTransactionToCacheSpy.mockClear();
  });

  afterAll(() => {
    // delete the record with the associated referenceNo
    redisClient.del(mockReferenceNo);
    Transaction.remove({ referenceNo: mockReferenceNo }, (err) => {
      throw err;
    });
  });
});
