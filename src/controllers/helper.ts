import { default as Transaction } from '../models/Transaction';
import { WriteError } from 'mongodb';
import * as uuid from 'uuid';
import * as Rx from 'rxjs/Rx';
import { Observable, Observer } from 'rxjs/Rx';
import Payback  from '../Payback/payback';

/**
 * Create Observable/stream that checks if chosen referenceNo
 * can be found in the Mongo store
 * @param referenceNo {string} the chosen reference number
 */
export const checkUniqueReferenceNoStream = (referenceNo: string) => {
  return Rx.Observable.create((observer: Observer<any>) => {
    Transaction.findOne({ referenceNo }, (err, existingRecord) => {
      if (err) { observer.error({ status: 'failure', msg: 'database error' }); }
      if (existingRecord) {
        observer.next({ status: 'found', msg: 'record exists, choose another referenceNo' });
      } else {
        observer.next({ status: 'success', msg: 'safe to save with this referenceNo' });
      }
      observer.complete();
    });
  });
};

/**
 * Create Observable/stream that saves successful transaction
 * into MongoDB
 * @param transaction {any} object that stores all the necessary info for MongoDB
 * @param transactionInfo {any} object that is returned by Paypal/Braintree
 * @param referenceNo {string} the referenceNo generated
 */
export const saveTransactionToDbStream = (transaction: any, transactionInfo: any, referenceNo: string) => {
  let transactionId: string;
  transaction.type === 'BRAINTREE' ?
    transactionId = transactionInfo.transaction.id :
    transactionId = transactionInfo.TRANSACTIONID;

  return Rx.Observable.create((observer: Observer<any>) => {
    transaction.save((err: WriteError) => {
      if (err) {
        observer.error({ status: 'failure', msg: 'database error', result: err });
      }
      observer.next({ status: 'success', transactionId, transactionInfo, referenceNo });
      observer.complete();
    });
  })
  .retry(5);
};

/**
 * Create Observable/stream that saves successful transaction
 * into Redis
 * @param rawData {any} object that stores the data Redis needs
 * @param redisClient {any} the redis client for saving contents
 */
export const saveTransactionToCacheStream = (rawData: any, redisClient: any) => {
  console.log(rawData);
  return Rx.Observable.create((observer: Observer<any>) => {
    // redisClient.set(rawData.referenceNo, JSON.stringify(rawData), function(err: any, reply: any) {
    redisClient.set(rawData.referenceNo, JSON.stringify(rawData), 'EX', 300, function(err: any, reply: any) {
      if (err) {
        observer.next({ status: 'failure', msg: "can't save data into cache", result: err });
      }
      console.log('data saved into cache');
      console.log(reply);
      observer.next({
        status: 'success',
        msg: 'record saved to cache',
        referenceNo: rawData.referenceNo
      });
      observer.complete();
    });
  });
};

/**
 * Create Observable/stream that saves successful transaction
 * into Redis and MongoDb
 * @param transaction {any} object that stores all the necessary info for MongoDB
 * @param transactionInfo {any} object that is returned by Paypal/Braintree
 * @param rawData {any} object that stores the data Redis needs
 * @param referenceNo {string} the referenceNo generated
 * @param redisClient {any} the redis client for saving contents
 */
export const saveTransactionStream = (transaction: any, transactionInfo: any,
    rawData: any, referenceNo: string, redisClient: any) => {
  const stream = checkUniqueReferenceNoStream(referenceNo)
    .flatMap((result: any) => {
      if (result.status === 'found') {
        console.log('check referenceNo in Db failed, referenceNo found in Db');
        const newReferenceNo: string = uuid.v1();
        transaction.referenceNo = newReferenceNo;
        rawData.referenceNo = newReferenceNo;
        return saveTransactionStream(transaction, transactionInfo, rawData, newReferenceNo, redisClient);
      }
      if (result.status === 'success') {
        console.log('check referenceNo in Db success');
        const dbStream = saveTransactionToDbStream(transaction, transactionInfo, referenceNo)
          .flatMap(() => saveTransactionToCacheStream(rawData, redisClient));
        return dbStream;
      }
    });
  return stream;
};

/**
 * Create Observable/stream that handles Braintree transaction
 * and if transaction is successful, transaciton info will be saved into
 * MongoDB
 * @param clientData {any} object that contains all the data the client sends
 */
export const createHandleBraintreeSaleRequestStream = ({
  name, phone, currency, amount, cardNumber, ccv, expireMonth, expireYear
}: {
  name: string, phone: string, currency: string, amount: string,
  cardNumber: string, ccv: string, expireMonth: string, expireYear: string
}, redisClient: any) => {
  const paybackInit = {
    braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY
  };
  const payback = new Payback(paybackInit);

  const braintreeSaleRequest = {
    amount,
    creditCard: {
      number: cardNumber,
      cvv: ccv,
      expirationDate: expireMonth + '/' + expireYear
    },
    options: {
      submitForSettlement: true
    }
  };

  return payback.createBraintreePaymentStream(braintreeSaleRequest, currency)
    .flatMap((transactionInfo: any) => {
      console.log(`The fuckin transaction id is: ${transactionInfo.transaction.id}`);
      const referenceNo: string = uuid.v1();
      const data = {
        name: name.toLowerCase(),
        phone,
        currency,
        price: amount,
        type: 'BRAINTREE',
        transactionId: transactionInfo.transaction.id,
        creditCardNo: cardNumber,
        referenceNo
      };
      const transaction: any = new Transaction(data);
      // return saveTransactionToDbStream(transaction, transactionInfo, referenceNo);
      return saveTransactionStream(transaction, transactionInfo, data, referenceNo, redisClient);
    });
};

/**
 * Create Observable/stream that handles Paypal transaction
 * and if transaction is successful, transaciton info will be saved into
 * MongoDB
 * @param clientData {any} object that contains all the data the client sends
 */
export const createHandlePaypalSaleRequestStream = ({
  name, phone, currency, amount, cardNumber, ccv,
  expireMonth, expireYear
}: {
  name: string,
  phone: string,
  currency: string,
  amount: string,
  cardNumber: string,
  ccv: string,
  expireMonth: string,
  expireYear: string
}, redisClient: any) => {
  const paybackInit = {
    braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY
  };
  const payback = new Payback(paybackInit);

  const paypalSaleRequest = {
    name,
    amount,
    creditCardNo: cardNumber,
    expireMonth,
    expireYear,
    ccv,
    currency
  };

  return payback.createPaypalPaymentStream(paypalSaleRequest)
    .flatMap((transactionInfo: any) => {
      console.log(`The fuckin transaction id is: ${transactionInfo.result.TRANSACTIONID}`);
      const referenceNo: string = uuid.v1();
      const data = {
        name: name.toLowerCase(),
        phone,
        currency,
        price: amount,
        type: 'PAYPAL',
        transactionId: transactionInfo.result.TRANSACTIONID,
        creditCardNo: cardNumber,
        referenceNo
      };
      const transaction: any = new Transaction(data);
      return saveTransactionStream(transaction, transactionInfo, data, referenceNo, redisClient);
    });
};

/**
 * Query record from the MongoDb database with name and referenceNo
 * If success, pass along the record
 * If fail, pass an error message
 * @param name {string} client name
 * @param referenceNo {string} referenceNo of the transaction
 */
export const createFindRecordFromMongoStream = (name: string, referenceNo: string) => {
  return Rx.Observable.create((observer: Observer<any>) => {
    Transaction.findOne(
      { name: name.toLowerCase(), referenceNo },
      // { referenceNo },
      (err, existingRecord) => {
        if (err) {
          observer.next({ status: 'failure', msg: 'database error' });
        }
        if (existingRecord) {
          observer.next({ status: 'success', result: existingRecord });
        } else {
          observer.next({ status: 'failure', msg: 'record not found' });
        }
        observer.complete();
      }
    );
  });
};

/**
 * Query record from the Redis store with referenceNo
 * If success, check if the name also matches
 *  If yes, pass along the record
 *  If no, delete the record and  pass an error message
 * If fail, check if the record can be found in MongoDb store
 *  If yes, save the record into the cache and pass along the record
 *  If no, pass an error message
 * @param name {string} client name
 * @param referenceNo {string} referenceNo of the transaction
 * @param redisClient {any} the redis client that handles different operaions
 */
export const createFindRecordFromRedisStream = (name: string, referenceNo: string, redisClient: any) => {
  return Rx.Observable.create((observer: Observer<any>) => {
    redisClient.get(referenceNo, (err: any, reply: any) => {
      if (err) {
        observer.next({ status: `failure`, msg: `redis cache error` });
      } else if (reply) {
        // transaction exists in cache
        const result = JSON.parse(reply);
        if (result.name.toLowerCase() !== name.toLowerCase()) {
          redisClient.del(referenceNo);
          observer.next({ status: `failure`, msg: `no such transaction` });
        } else {
          observer.next({ status: `success`, result });
        }
      } else {
        // transaction doesn't exist in cache --> query mongo
        console.log(`query database for data`);
        observer.next({ status: `TBD`, msg: `query database for data` });
      }
      observer.complete();
    });
  })
  .flatMap((result: any) => {
    console.log(`after checking cache`);
    console.log(result);
    if (result.status === 'TBD') {
      return createFindRecordFromMongoStream(name, referenceNo)
        .flatMap((result: any) => {
          console.log(`after TBD, record is found in mongo`);
          console.log(result);
          if (result.status === 'success') {
            // save the transaction to cache
            return Rx.Observable.create((observer: Observer<any>) => {
              // set 1 minute expiration
              redisClient.set(referenceNo, JSON.stringify(result.result), 'EX', 300, function(err: any, reply: any) {
              // redisClient.set(referenceNo, JSON.stringify(result.result), function(err: any, reply: any) {
                console.log('just saved cache into redis');
                console.log(reply);
                observer.next(result);
                observer.complete();
              });
            });
          }
          return Rx.Observable.of(result);
        });
    }
    return Rx.Observable.of(result);
  });
};

/**
 * Query record from Braintree with transaction Id
 * If success, pass along the record
 * If fail, delte the record in MongoDb
 * @param transactionId {string} the transaction id
 */
export const createQueryRecordFromBrainTreeStream = (transactionId: string) => {
  const paybackInit = {
    braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY
  };

  // check with Braintree to update the record
  const payback = new Payback(paybackInit);
  const stream = payback.createBraintreeQueryTransactionStream(transactionId)
    .catch((result: any) => {
      return Rx.Observable.create((observer: Observer<any>) => {

        Transaction.remove({ transactionId }, (err) => {
          if (err) {
            console.log('record is not in Braintree, and database error');
            observer.next({
              status: 'failure',
              msg: 'record is not in Braintree, and database error'
            });
          }
          console.log('record is not in Braintree, delete record in Mongo');
          observer.next({
            status: 'success',
            msg: 'record is not in Braintree, delete record in Mongo'
          });
          observer.complete();
        });

      });
    });
  return stream;
};

/**
 * Query record from Paypal with transaction Id and chosen currency
 * If success, pass along the record
 * If fail, delte the record in MongoDb
 * @param transactionId {string} the transaction id
 * @param currency {string} the chosen currency
 */
export const createQueryRecordFromPaypalStream = (transactionId: string, currency: string) => {
  const paybackInit = {
    braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
    braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
    braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY
  };

  // check with Braintree to update the record
  const payback = new Payback(paybackInit);
  const stream = payback.createPaypalQueryTransactionStream(transactionId, currency)
    .catch((result: any) => {
      return Rx.Observable.create((observer: Observer<any>) => {

        Transaction.remove({ transactionId }, (err) => {
          if (err) {
            console.log('record is not in Paypal, and database error');
            observer.next({
              status: 'failure',
              msg: 'record is not in Paypal, and database error'
            });
          }
          console.log('record is not in Paypal, delete record in Mongo');
          observer.next({
            status: 'success',
            msg: 'record is not in Paypal, delete record in Mongo'
          });
          observer.complete();
        });

      });
    });
  return stream;
};
