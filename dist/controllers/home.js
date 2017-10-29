"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GET /
 * Home page.
 * @param req {Request} the Request
 * @param res {Response} the Response
 */
exports.index = (req, res) => {
    res.locals.mode = 'index';
    res.render('home', {
        title: 'Home'
    });
};
//# sourceMappingURL=home.js.map