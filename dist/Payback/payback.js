"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Rx = require("rxjs/Rx");
// this won't work, as we need type definition later
// import * as braintree from 'braintree';
// this also won't work
// import braintree = require('braintree');
const braintree = require('braintree');
const Paypal = require("paypal-rest-sdk");
const fetch = require("isomorphic-fetch");
class Payback {
    constructor({ braintreeMerchantId, braintreePublicKey, braintreePrivateKey }) {
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
        return Rx.Observable.create((observer) => {
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
    createBraintreePaymentStream(saleRequest, currency) {
        // different merchant account for different currencies
        // https://stackoverflow.com/questions/33909595/how-to-set-currency-format-in-braintree-transaction-sale
        if (currency === 'HKD') {
            saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_HKD;
        }
        else if (currency === 'JPY') {
            saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_JPY;
        }
        return Rx.Observable.create((observer) => {
            this.braintreeGateway.transaction.sale(saleRequest, (err, result) => {
                console.log('transaction complete');
                console.log(result);
                if (err) {
                    observer.error(err);
                }
                if (result.success) {
                    observer.next(result);
                }
                else {
                    observer.error(result);
                }
                observer.complete();
            });
        });
    }
    /**
     * Does the payment with Braintree
     * @param saleRequest {BraintreeSaleRequest} the request-to-be-sent
     * @param currency {string} the chosen currency
     */
    braintreePayment(saleRequest, currency) {
        // different merchant account for different currencies
        // https://stackoverflow.com/questions/33909595/how-to-set-currency-format-in-braintree-transaction-sale
        if (currency === 'HKD') {
            saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_HKD;
        }
        else if (currency === 'JPY') {
            saleRequest.merchantAccountId = process.env.BRAINTREE_MERCHANT_ACC_ID_JPY;
        }
        this.braintreeGateway.transaction.sale(saleRequest, (err, result) => {
            if (err) {
                console.log(err.name);
            }
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
    createBraintreeQueryTransactionStream(transactionId) {
        return Rx.Observable.create((observer) => {
            this.braintreeGateway.transaction.search((search) => {
                search.id().is(transactionId);
            }, (err, response) => {
                if (err) {
                    observer.error(err);
                }
                response.each((err, transaction) => {
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
    braintreeQueryTransaction(transactionId) {
        this.braintreeGateway.transaction.search((search) => {
            search.id().is(transactionId);
        }, (err, response) => {
            console.log(response);
            response.each((err, transaction) => {
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
    getPaypalSettings(creditCardNo, currency) {
        let cardType = '';
        let chosenUsername = '';
        let chosenPassword = '';
        let chosenSignature = '';
        const visaRegEx = /^4[0-9]{6,}$/g;
        const masterRegEx = /^4[0-9]{6,}$/g;
        const amexRegEx = /^3[47][0-9]{5,}$/g;
        if (creditCardNo.match(visaRegEx)) {
            cardType = 'VISA';
        }
        else if (creditCardNo.match(masterRegEx)) {
            cardType = 'MASTER';
        }
        else if (creditCardNo.match(amexRegEx)) {
            cardType = 'AMEX';
        }
        else {
            cardType = 'UNKNOWN';
        }
        switch (currency) {
            case 'USD':
                chosenUsername = process.env.PAYPAL_USD_USERNAME;
                chosenPassword = process.env.PAYPAL_USD_PASSWORD;
                chosenSignature = process.env.PAYPAL_USD_SIGNATURE;
                break;
            case 'AUD':
                chosenUsername = process.env.PAYPAL_AUD_USERNAME;
                chosenPassword = process.env.PAYPAL_AUD_PASSWORD;
                chosenSignature = process.env.PAYPAL_AUD_SIGNATURE;
                break;
        }
        return { cardType, chosenUsername, chosenPassword, chosenSignature };
    }
    /**
     * Create the Observable/stream that does the payment with Paypal
     * @param saleRequest {any} the request-to-be-sent
     * @returns {Observable} the stream that does the work
     */
    createPaypalPaymentStream(saleRequest) {
        const currency = saleRequest.currency;
        const creditCardNo = saleRequest.creditCardNo;
        const { cardType, chosenUsername, chosenPassword, chosenSignature } = this.getPaypalSettings(creditCardNo, currency);
        const payload = {
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
        const dataStr = Object.keys(payload).reduce((acc, curr) => {
            return acc += `&${curr}=${payload[curr]}`;
        }, '');
        return Rx.Observable.fromPromise(fetch('https://api-3t.sandbox.paypal.com/nvp', {
            method: 'POST',
            body: dataStr
        }).then(res => res.text())).flatMap((result) => {
            // extract the transaction ID
            console.log(`got results form paypal`);
            const decodedStr = decodeURIComponent(result);
            const dataArr = decodedStr.split('&');
            const response = {};
            dataArr.forEach((item) => {
                const arr = item.split('=');
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
    paypalPayment(saleRequest) {
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
        const { cardType, chosenUsername, chosenPassword, chosenSignature } = this.getPaypalSettings(creditCardNo, currency);
        const payload = {
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
        const dataStr = Object.keys(payload).reduce((acc, curr) => {
            return acc += `&${curr}=${payload[curr]}`;
        }, '');
        fetch('https://api-3t.sandbox.paypal.com/nvp', {
            method: 'POST',
            body: dataStr
        })
            .then(res => res.text())
            .then((result) => {
            // extract the transaction ID
            console.log(`got results form paypal`);
            const decodedStr = decodeURIComponent(result);
            const dataArr = decodedStr.split('&');
            const response = {};
            dataArr.forEach((item) => {
                const arr = item.split('=');
                response[arr[0]] = arr[1];
            });
            console.log(response);
        });
    }
    createPaypalQueryTransactionStream(transactionId, currency) {
        const { cardType, chosenUsername, chosenPassword, chosenSignature } = this.getPaypalSettings('dummy_number', currency);
        const payload = {
            SIGNATURE: chosenSignature,
            USER: chosenUsername,
            PWD: chosenPassword,
            METHOD: 'GetTransactionDetails',
            VERSION: '78',
            TransactionID: transactionId
        };
        // serialize the payload
        const dataStr = Object.keys(payload).reduce((acc, curr) => {
            return acc += `&${curr}=${payload[curr]}`;
        }, '');
        return Rx.Observable.fromPromise(fetch('https://api-3t.sandbox.paypal.com/nvp', {
            method: 'POST',
            body: dataStr
        }).then(res => res.text())).flatMap((result) => {
            // extract the transaction ID
            console.log(`got results form paypal`);
            const decodedStr = decodeURIComponent(result);
            const dataArr = decodedStr.split('&');
            const response = {};
            dataArr.forEach((item) => {
                const arr = item.split('=');
                response[arr[0]] = arr[1];
            });
            console.log(response);
            if (response.ACK === 'Success') {
                return Rx.Observable.of({ status: 'success', result: response });
            }
            return Rx.Observable.throw({ status: 'failure', msg: 'transaction cannot be retrieved', result: response });
        });
    }
    paypalQueryTransaction(transactionId, currency) {
        const { cardType, chosenUsername, chosenPassword, chosenSignature } = this.getPaypalSettings('dummy_number', currency);
        const payload = {
            SIGNATURE: chosenSignature,
            USER: chosenUsername,
            PWD: chosenPassword,
            METHOD: 'GetTransactionDetails',
            VERSION: '78',
            TransactionID: transactionId
        };
        // serialize the payload
        const dataStr = Object.keys(payload).reduce((acc, curr) => {
            return acc += `&${curr}=${payload[curr]}`;
        }, '');
        fetch('https://api-3t.sandbox.paypal.com/nvp', {
            method: 'POST',
            body: dataStr
        })
            .then(res => res.text())
            .then((result) => {
            // extract the transaction ID
            console.log(`got results form paypal`);
            const decodedStr = decodeURIComponent(result);
            const dataArr = decodedStr.split('&');
            const response = {};
            dataArr.forEach((item) => {
                const arr = item.split('=');
                response[arr[0]] = arr[1];
            });
            console.log(response);
        });
    }
}
exports.default = Payback;
//# sourceMappingURL=payback.js.map