"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GET /make-order/order
 * page for making an order.
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.order = (req, res) => {
    res.locals.mode = 'make-order--order';
    res.render('make-order/order', {
        title: 'Order | Fish'
    });
};
/**
 * GET /make-order/success
 * page for showing successful order
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.success = (req, res) => {
    res.locals.mode = 'make-order--success';
    res.render('make-order/order', {
        title: 'Success | Fish'
    });
};
/**
 * GET /make-order/failure
 * page for showing successful order
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.failure = (req, res) => {
    res.locals.mode = 'make-order--failure';
    res.render('make-order/order', {
        title: 'Failure | Fish'
    });
};
//# sourceMappingURL=make-order.js.map