import { Observable, Observer } from 'rxjs/Rx';
import * as Rx from 'rxjs/Rx';

// this won't work, as we need type definition later
// import * as braintree from 'braintree';
// this also won't work
// import braintree = require('braintree');
const braintree = require('braintree');
import * as Paypal from 'paypal-rest-sdk';

import * as fetch from 'isomorphic-fetch';

interface BraintreeCreditCard {
  number: string;
  cvv: string;
  expirationDate: string;
}

interface BraintreeSaleRequest {
  amount: string;
  merchantAccountId?: string;
  creditCard: BraintreeCreditCard;
  options: any;
}

interface PaypalSaleRequest {
  VERSION: string;
  SIGNATURE: string;
  USER: string;
  PWD: string;
  METHOD: string;
  PAYMENTACTION: string;
  IPADDRESS: string;
  AMT: string;
  CREDITCARDTYPE: string;
  ACCT: string;
  EXPDATE: string;
  CVV2: string;
  FIRSTNAME: string;
  LASTNAME: string;
  STREET: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  COUNTRYCODE: string;
  [key: string]: string;
}

interface PaypalTransactionQuery {
  SIGNATURE: string;
  USER: string;
  PWD: string;
  METHOD: string;
  VERSION: string;
  TransactionID: string;
  [key: string]: string;
}

export default class Payback {
  private readonly braintreeMerchantId: string;
  private readonly braintreePublicKey: string;
  private readonly braintreePrivateKey: string;

  private braintreeGateway: any;
  private paypal: any;

  constructor({
    braintreeMerchantId,
    braintreePublicKey,
    braintreePrivateKey
  }: {
    braintreeMerchantId: string,
    braintreePublicKey: string,
    braintreePrivateKey: string
  }) {
    this.braintreeMerchantId = braintreeMerchantId;
    this.braintreePublicKey = braintreePublicKey;
    this.braintreePrivateKey = braintreePrivateKey;

    // this.braintreeGateway = undefined;

    console.log(`Payback is a bitch`);
    this.connectBraintree();
    this.paypal = Paypal;
  }

  /**
   * Makes the connection to braintree
   */
  connectBraintree() {
    this.braintreeGateway = braintree.connect({
      environment: braintree.Environment.Sandbox,
      merchantId: this.braintreeMerchantId,
      publicKey: this.braintreePublicKey,
      privateKey: this.braintreePrivateKey
    });
  }

  /**
   * Create the Observable/stream that makes the connection to braintree
   * @returns {Observable} the stream that does the work
   */
  createConnectBraintreeStream() {
    return Rx.Observable.create((observer: Observer<any>) => {
      this.braintreeGateway = braintree.connect({
       environment: braintree.Environment.Sandbox,
       merchantId: this.braintreeMerchantId,
       publicKey: this.braintreePublicKey,
       privateKey: this.braintreePrivateKey
      });
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Create the Observable/stream that does the payment with Braintree
   * @param saleRequest {BraintreeSaleRequest} the request-to-be-sent
   * @param currency {string} the chosen currency
   * @returns {Observable} the stream that does the work
   */
  createBraintreePaymentStream(saleRequest: BraintreeSaleRequest, currency: string) {
    // different merchant account for different currencies
    // https://stackoverflow.com/questions/33909595/how-to-set-currency-format-in-braintree-transaction-sale
    if (currency === 'HKD') {
      saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_HKD;
    } else if (currency === 'JPY') {
      saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_JPY;
    }

    return Rx.Observable.create((observer: Observer<any>) => {
      this.braintreeGateway.transaction.sale(saleRequest, (err: Error, result: any) => {
        console.log('transaction complete');
        console.log(result);
        if (err) { observer.error(err); }
        if (result.success) { observer.next(result); }
        else { observer.error(result); }
        observer.complete();
      });
    });
  }

  /**
   * Does the payment with Braintree
   * @param saleRequest {BraintreeSaleRequest} the request-to-be-sent
   * @param currency {string} the chosen currency
   */
  braintreePayment(saleRequest: BraintreeSaleRequest, currency: string) {
    // different merchant account for different currencies
    // https://stackoverflow.com/questions/33909595/how-to-set-currency-format-in-braintree-transaction-sale
    if (currency === 'HKD') {
      saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_HKD;
    } else if (currency === 'JPY') {
      saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_JPY;
    }

    this.braintreeGateway.transaction.sale(saleRequest, (err: Error, result: any) => {
      if (err) { console.log(err.name); }
      if (result.success) {
        console.log(`braintree success!`);
        console.log(`transaction info: ${result.transaction}`);
      }
    });
  }

  /**
   * Create the Observable/stream that queries the transaction with Braintree
   * @param transactionId {string} id of the transaction
   * @returns {Observable} the stream that does the work
   */
  createBraintreeQueryTransactionStream(transactionId: string) {
    return Rx.Observable.create((observer: Observer<any>) => {
      this.braintreeGateway.transaction.search((search: any) => {
        search.id().is(transactionId);
      }, (err: Error, response: any) => {
        if (err) { observer.error(err); }
        response.each((err: Error, transaction: any) => {
          observer.next(transaction);
        });
        observer.complete();
      });
    });
  }

  /**
   * Queries the transaction with Braintree
   * @param transactionId {string} id of the transaction
   */
  braintreeQueryTransaction(transactionId: string) {
    this.braintreeGateway.transaction.search((search: any) => {
      search.id().is(transactionId);
    }, (err: Error, response: any) => {
      console.log(response);
      response.each((err: Error, transaction: any) => {
        console.log(transaction);
      });
    });
  }
  /**
   * Get the necessary info for configuring the Paypal payment request
   * @param creditCardNo {string} the credit card number
   * @param currency {string} the chosen currency for payment
   * @returns {any} an object that has the info of credit card type,
   *  username, password and signature to be used
   */
  getPaypalSettings(creditCardNo: string, currency: string) {
    let cardType = '';
    let chosenUsername = '';
    let chosenPassword = '';
    let chosenSignature = '';

    const visaRegEx = /^4[0-9]{6,}$/g;
    const masterRegEx = /^4[0-9]{6,}$/g;
    const amexRegEx = /^3[47][0-9]{5,}$/g;

    if (creditCardNo.match(visaRegEx)) {
      cardType = 'VISA';
    } else if (creditCardNo.match(masterRegEx)) {
      cardType = 'MASTER';
    } else if (creditCardNo.match(amexRegEx)) {
      cardType = 'AMEX';
    } else {
      cardType = 'UNKNOWN';
    }

    switch (currency) {
      case 'USD':
        chosenUsername = process.env.PAYPAL_USD_USERNAME || 'kevlai22-3_api1.uw.edu';
        chosenPassword = process.env.PAYPAL_USD_PASSWORD || 'TT29JSDCEWZPX2NA';
        chosenSignature = process.env.PAYPAL_USD_SIGNATURE || 'ALvW1LfJ5RaibyQPxHIpppfeMDgoANSIee2pGQJLCI2Dp5v5FMZ0CEWH';
        break;
      case 'AUD':
        chosenUsername = process.env.PAYPAL_AUD_USERNAME || 'kevlai22-4_api1.uw.edu';
        chosenPassword = process.env.PAYPAL_AUD_PASSWORD || 'M7JVGW3K63CT33TL';
        chosenSignature = process.env.PAYPAL_AUD_SIGNATURE || 'A7LWorWrJcRjmmYMyZ3UG3TC-LgOABbMaf2rN2o2.rFku882NheCuXt1';
        break;
      // case 'EUR':
      //   chosenUsername = process.env.PAYPAL_EUR_USERNAME;
      //   chosenPassword = process.env.PAYPAL_EUR_PASSWORD;
      //   chosenSignature = process.env.PAYPAL_EUR_SIGNATURE;
      //   break;
    }
    return { cardType, chosenUsername, chosenPassword, chosenSignature };
  }

  /**
   * Create the Observable/stream that does the payment with Paypal
   * @param saleRequest {any} the request-to-be-sent
   * @returns {Observable} the stream that does the work
   */
  createPaypalPaymentStream(saleRequest: any) {
    const currency = saleRequest.currency;
    const creditCardNo = saleRequest.creditCardNo;

    const { cardType, chosenUsername, chosenPassword, chosenSignature }
      = this.getPaypalSettings(creditCardNo, currency);

    const payload: PaypalSaleRequest = {
      VERSION: '56.0',
      SIGNATURE: chosenSignature,
      USER: chosenUsername,
      PWD: chosenPassword,
      METHOD: 'DoDirectPayment',
      PAYMENTACTION: 'Sale',
      IPADDRESS: '192.168.0.1',
      AMT: saleRequest.amount,
      CREDITCARDTYPE: cardType,
      ACCT: saleRequest.creditCardNo,
      EXPDATE: `${saleRequest.expireMonth}20${saleRequest.expireYear}`,
      CVV2: saleRequest.ccv,
      FIRSTNAME: saleRequest.name,
      LASTNAME: saleRequest.name,
      STREET: '1 Main St.',
      CITY: 'San Jose',
      STATE: 'CA',
      ZIP: '95131',
      COUNTRYCODE: 'US'
    };

    // serialize the payload
    const dataStr = Object.keys(payload).reduce((acc: string, curr: string) => {
      return acc += `&${curr}=${<string>payload[curr]}`;
    }, '');

    return Rx.Observable.fromPromise(
      fetch('https://api-3t.sandbox.paypal.com/nvp', {
        method: 'POST',
        body: dataStr
      }).then(res => res.text())
    ).flatMap((result: any) => {
      // extract the transaction ID
      console.log(`got results form paypal`);
      const decodedStr = decodeURIComponent(result);
      const dataArr = decodedStr.split('&');
      const response: any = {};
      dataArr.forEach((item: string) => {
        const arr: any = item.split('=');
        response[arr[0]] = arr[1];
      });
      console.log(response);

      if (response.TRANSACTIONID && response.ACK === 'Success') {
        return Rx.Observable.of({ status: 'success', result: response });
      }
      return Rx.Observable.throw({ status: 'failure', msg: 'transaction cannot be made', result: response });
    });
  }

  /**
   * Does the payment with Paypal
   * @param saleRequest {any} the request-to-be-sent
   */
  paypalPayment(saleRequest: any) {
    // const configDetails = {
    //   host: 'api.sandbox.paypal.com',
    //   port: '',
    //   client_id: process.env.PAYPAL_CLIENT_ID,
    //   client_secret: process.env.PAYPAL_CLIENT_SECRET
    // };
    //
    // const paymentRequest = {
    //   intent: 'sale',
    //   payer: {
    //     payment_method: 'credit_card',
    //     funding_instruments: [{
    //       credit_card: {
    //         type: 'Visa',
    //         number: '4571338849742676',
    //         expire_month: '11',
    //         expire_year: '2022',
    //         cvv2: '000',
    //         first_name: 'sdvsdvds'
    //       }
    //     }]
    //   },
    //   transactions: [{
    //     amount: {
    //       total: '8.88',
    //       currency: 'USD'
    //     }
    //   }]
    // };
    //
    // this.paypal.payment.create(paymentRequest, configDetails, function(err: any, result: any) {
    //   if (err) { console.log(err); }
    //   if (result) {
    //     console.log(result);
    //   }
    // });
    const currency = saleRequest.currency;
    const creditCardNo = saleRequest.creditCardNo;

    const { cardType, chosenUsername, chosenPassword, chosenSignature }
      = this.getPaypalSettings(creditCardNo, currency);

    const payload: PaypalSaleRequest = {
      VERSION: '56.0',
      SIGNATURE: chosenSignature,
      USER: chosenUsername,
      PWD: chosenPassword,
      METHOD: 'DoDirectPayment',
      PAYMENTACTION: 'Sale',
      IPADDRESS: '192.168.0.1',
      AMT: saleRequest.amount,
      CREDITCARDTYPE: cardType,
      ACCT: saleRequest.creditCardNo,
      EXPDATE: `${saleRequest.expireMonth}20${saleRequest.expireYear}`,
      CVV2: saleRequest.ccv,
      FIRSTNAME: saleRequest.name,
      LASTNAME: saleRequest.name,
      STREET: '1 Main St.',
      CITY: 'San Jose',
      STATE: 'CA',
      ZIP: '95131',
      COUNTRYCODE: 'US'
    };

    // serialize the payload
    const dataStr = Object.keys(payload).reduce((acc: string, curr: string) => {
      return acc += `&${curr}=${<string>payload[curr]}`;
    }, '');

    fetch('https://api-3t.sandbox.paypal.com/nvp', {
      method: 'POST',
      body: dataStr
    })
    .then(res => res.text())
    .then((result: any) => {
      // extract the transaction ID
      console.log(`got results form paypal`);
      const decodedStr = decodeURIComponent(result);
      const dataArr = decodedStr.split('&');
      const response: any = {};
      dataArr.forEach((item: string) => {
        const arr: any = item.split('=');
        response[arr[0]] = arr[1];
      });
      console.log(response);
    });
  }

  /**
   * Create the Observable/stream that queries the transaction with Paypal
   * @param transactionId {any} transaction id
   * @param currency {any} chosen currency
   * @returns {Observable} the stream that does the work
   */
  createPaypalQueryTransactionStream(transactionId: string, currency: string) {
    const { cardType, chosenUsername, chosenPassword, chosenSignature }
      = this.getPaypalSettings('dummy_number', currency);

    const payload: PaypalTransactionQuery = {
      SIGNATURE: chosenSignature,
      USER: chosenUsername,
      PWD: chosenPassword,
      METHOD: 'GetTransactionDetails',
      VERSION: '78',
      TransactionID: transactionId
    };

    // serialize the payload
    const dataStr = Object.keys(payload).reduce((acc: string, curr: string) => {
      return acc += `&${curr}=${<string>payload[curr]}`;
    }, '');

    return Rx.Observable.fromPromise(
      fetch('https://api-3t.sandbox.paypal.com/nvp', {
        method: 'POST',
        body: dataStr
      }).then(res => res.text())
    ).flatMap((result: any) => {
      // extract the transaction ID
      console.log(`got results form paypal`);
      const decodedStr = decodeURIComponent(result);
      const dataArr = decodedStr.split('&');
      const response: any = {};
      dataArr.forEach((item: string) => {
        const arr: any = item.split('=');
        response[arr[0]] = arr[1];
      });
      console.log(response);

      if (response.ACK === 'Success') {
        return Rx.Observable.of({ status: 'success', result: response });
      }
      return Rx.Observable.throw({ status: 'failure', msg: 'transaction cannot be retrieved', result: response });
    });
  }

  /**
   * Queries the transaction with Paypal
   * @param transactionId {any} transaction id
   * @param currency {any} chosen currency
   */
  paypalQueryTransaction(transactionId: string, currency: string) {
    const { cardType, chosenUsername, chosenPassword, chosenSignature }
      = this.getPaypalSettings('dummy_number', currency);

    const payload: PaypalTransactionQuery = {
      SIGNATURE: chosenSignature,
      USER: chosenUsername,
      PWD: chosenPassword,
      METHOD: 'GetTransactionDetails',
      VERSION: '78',
      TransactionID: transactionId
    };

    // serialize the payload
    const dataStr = Object.keys(payload).reduce((acc: string, curr: string) => {
      return acc += `&${curr}=${<string>payload[curr]}`;
    }, '');

    fetch('https://api-3t.sandbox.paypal.com/nvp', {
      method: 'POST',
      body: dataStr
    })
    .then(res => res.text())
    .then((result: any) => {
      // extract the transaction ID
      console.log(`got results form paypal`);
      const decodedStr = decodeURIComponent(result);
      const dataArr = decodedStr.split('&');
      const response: any = {};
      dataArr.forEach((item: string) => {
        const arr: any = item.split('=');
        response[arr[0]] = arr[1];
      });
      console.log(response);
    });
  }
}
