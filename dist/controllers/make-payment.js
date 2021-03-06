"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper = require("./helper");
/**
 * GET /make-payment/order
 * page for making an order.
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.order = (req, res, redisClient) => {
    res.locals.mode = 'make-order--order';
    res.render('make-payment/order', {
        title: 'Order | Kev'
    });
};
/**
 * GET /make-payment/success
 * page for showing successful order
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.handleOrder = (req, res, next, redisClient) => {
    console.log('hello there');
    const error = req.validationErrors();
    // request body
    // console.log(req.body);
    let payType;
    // check if card is AMEX
    // http://www.validcreditcardnumber.com/
    // https://stackoverflow.com/questions/72768/how-do-you-detect-credit-card-type-based-on-number
    const regEx = /^3[47][0-9]{5,}$/g;
    let isAMEX;
    // if card number starts with 34 or 37, it's an AMEX number
    req.body.cardNumber.match(regEx) ? isAMEX = true : isAMEX = false;
    // if currenct is not USD, EUR, or AUD, then choose BRAINTREE
    switch (req.body.currency) {
        case 'USD':
        case 'AUD':
        case 'EUR':
            payType = 'PAYPAL';
            break;
        case 'HKD':
        case 'JPY':
            payType = 'BRAINTREE';
            break;
    }
    if (req.body.currency !== 'USD' && isAMEX) {
        // error
        res.send(JSON.stringify({
            status: 'fail',
            msg: `You cannot pay USD with an AMEX card`
        }));
        return next();
    }
    let stream = undefined;
    payType === 'PAYPAL' ?
        stream = helper.createHandlePaypalSaleRequestStream(req.body, redisClient) :
        stream = helper.createHandleBraintreeSaleRequestStream(req.body, redisClient);
    console.log(`chose ${payType}`);
    stream.subscribe((result) => {
        console.log(`payment complete and success`);
        res.setHeader('Content-Type', 'application/json');
        console.log(result);
        res.send(JSON.stringify({ status: 'success', result }));
        next();
    }, (err) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ status: 'failure', result: err }));
        next();
    }, () => { console.log(`finish making payment to ${payType}`); });
};
//# sourceMappingURL=make-payment.js.map