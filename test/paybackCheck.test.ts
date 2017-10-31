import {} from 'jest';
import * as supertest from "supertest";
import * as dotenv from 'dotenv';
import Payback  from '../src/Payback/payback';
import { Observable, Observer } from 'rxjs/Rx';
import * as Rx from 'rxjs/Rx';

dotenv.config({path: '../.env.example' });

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

const paybackInit = {
  braintreeMerchantId: 'fxgzypcccjvx275z',
  braintreePublicKey: 'xtm82c5npz2ykwwp',
  braintreePrivateKey: '2ca4c091cf4d59185b7abdb3a191b3b3'
};

const fakeSuccessfulBraintreeSaleRequest = {
  amount: getRandomInt(1,10),
  creditCard: {
    number: '36259600000004',
    cvv: '000',
    expirationDate: '10/22'
  },
  options: {
    submitForSettlement: true
  }
};

const fakeFailBraintreeSaleRequest = {
  amount: getRandomInt(1,10),
  creditCard: {
    number: '36259600000004',
    cvv: '0000',
    expirationDate: '10/22'
  },
  options: {
    submitForSettlement: true
  }
};

const paypalSuccessfulSaleRequest = {
  name: 'John Doe',
  amount: getRandomInt(1,10),
  creditCardNo: '4239531276072989',
  expireMonth: '10',
  expireYear: '22',
  ccv: '000',
  currency: 'AUD'
};

const paypalFailSaleRequest = {
  name: 'John Doe',
  amount: getRandomInt(1,10),
  creditCardNo: '4239531276072989',
  expireMonth: '10',
  expireYear: '22',
  ccv: '1234',
  currency: 'USD'
};

const payback = new Payback(paybackInit);

beforeAll(() => {

});

describe("Paypack (mock)", () => {
  let Mock;

  beforeAll(() => {
    // const Mock = jest.fn<ICommunicator<IEmail>>(() => ({
    //   send: jest.fn(),
    // }));
    // const mock = new Mock();
    // const instance = new EmailService(mock);
    // instance.send(new Email("to@foo.com", "from@foo.com", "oh hai", "Some foo email..."));
    //
    // expect(mock.send).toHaveBeenCalled();
    Mock = jest.fn(() => ({
        braintreeGateway: undefined,
        connectBraintree() { this.braintreeGateway = { status: 'connected' }; },
        createBraintreePaymentStream() { return Rx.Observable.of({ status: 'success' }); },
        createBraintreeQueryTransactionStream() { return Rx.Observable.of({ status: 'success' }); },
        createPaypalPaymentStream() { return Rx.Observable.of({ status: 'success' }); },
        createPaypalQueryTransactionStream() { return Rx.Observable.of({ status: 'success' }); }
      })
    );
  });

  it("should connect to Braintree's gateway", () => {
    const mock = new Mock();
    mock.connectBraintree();
    expect(mock.braintreeGateway.status).toBe('connected');
  });
});

describe("Payback (Braintree)", () => {
  let braintreeTransactionId = '';

  it("should be able to handle payment", (done) => {
    const stream = payback.createBraintreePaymentStream(fakeSuccessfulBraintreeSaleRequest, "HKD");
    stream.subscribe(
      (result: any) => {
        expect(result.transaction).toEqual(expect.objectContaining({
          id: expect.any(String)
        }));
        braintreeTransactionId = result.transaction.id;
      },
      (err: Error) => { throw err; },
      () => { done(); }
    );
  });

  it("should be able to query payment", (done) => {
    const stream = payback.createBraintreeQueryTransactionStream(braintreeTransactionId);
    stream.subscribe(
      (result: any) => {
        expect(result.transaction).toEqual(expect.objectContaining({
          id: expect.any(String)
        }));
        expect(result.transaction.id).toBe(braintreeTransactionId);
      },
      (err: Error) => { throw err; },
      () => { done(); }
    );
  });

  it("should not be able to handle invalid CCV", (done) => {
    // this.timeout(15000);
    const stream = payback.createBraintreePaymentStream(fakeFailBraintreeSaleRequest, "HKD")
      .catch((err: any) => { return Rx.Observable.of(err); });
    stream.subscribe(
      (result: any) => {
        expect(result).toEqual(expect.objectContaining({
          success: expect.any(Boolean)
        }));
        expect(result.success).toBe(false);
        // console.log(result);
      },
      (err: any) => {},
      () => { done(); }
    );
  });
});


describe("Payback (Paypal)", () => {
  let paypalTransactionId = '';

  it("should be able to handle payment", (done) => {

    const stream = payback.createPaypalPaymentStream(paypalSuccessfulSaleRequest);
    stream.subscribe(
      (result: any) => {
        expect(result.result).toEqual(expect.objectContaining({
          TRANSACTIONID: expect.any(String),
          ACK: expect.any(String)
        }));
        paypalTransactionId = result.result.TRANSACTIONID;
      },
      (err: Error) => { console.log('fuck error'); console.log(err); done(); },
      () => { done(); }
    );
  });

  it("should be able to query payment", (done) => {

    const stream = payback.createPaypalQueryTransactionStream(paypalTransactionId, "AUD");
    stream.subscribe(
      (result: any) => {
        expect(result.status).toBe('success');
        expect(result.result).toEqual(expect.objectContaining({
          TRANSACTIONID: expect.any(String),
          ACK: expect.any(String)
        }));
      },
      (err: Error) => { console.log(err); done(); },
      () => { done(); }
    );
  });
});
