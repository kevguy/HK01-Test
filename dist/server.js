"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const express = require("express");
const session = require("express-session");
// import * as flash from "express-flash";
const expressValidator = require("express-validator");
const bodyParser = require("body-parser");
const i18n = require("i18n");
const errorHandler = require("errorhandler");
const compression = require("compression"); // compresses requests
const logger = require("morgan");
const path = require("path");
const ejslocals = require("ejs-locals");
const mongo = require("connect-mongo");
const mongoose = require("mongoose");
const redis = require("redis");
const dotenv = require("dotenv");
const favicon = require("serve-favicon");
/**
 * Controllers (route handlers)
 */
const homeController = require("./controllers/home");
const paymentController = require("./controllers/make-payment");
const checkController = require("./controllers/check-order");
const controllers = {
    index: homeController.index,
    'make-payment': {
        order: paymentController.order,
        'send-order': paymentController.handleOrder
    },
    'check-order': {
        search: checkController.search,
        'send-query': checkController.srchResults
    }
};
const MongoStore = mongo(session);
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });
/**
 * Create Express server.
 */
const app = express();
/**
 * Connect to MongoDB.
 */
// mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGODB_URI);
mongoose.connection.on('error', () => {
    console.log('MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
});
/**
 * Connect to Redis
 */
const redisClient = redis.createClient(parseInt(process.env.REDIS_PORT), process.env.REDIS_URI, { no_ready_check: true });
// Redis Lab doesn't allow me to set password
// client.auth('password', function (err) {
//     if (err) throw err;
// });
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});
// const paybackInit = {
//   braintreeMerchantId: process.env.BRAINTREE_MERCHANT_ID,
//   braintreePublicKey: process.env.BRAINTREE_PUBLIC_KEY,
//   braintreePrivateKey: process.env.BRAINTREE_PRIVATE_KEY
// };
// const payback = new Payback(paybackInit);
// payback.paypalPayment('cd');
/**
 * Express configuration
 */
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, './views'));
app.engine('ejs', ejslocals);
app.set('view engine', 'ejs');
app.use(compression());
app.use(logger('dev'));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'linkinpark',
    store: new MongoStore({
        url: process.env.MONGOLAB_URI || process.env.MONGODB_URI,
        autoReconnect: true
    })
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// bypass favico
app.use((req, res, next) => {
    if (req.originalUrl === '/favicon.ico') {
        res.status(204).json({ nope: true });
    }
    else {
        next();
    }
});
/*
 * Index in langs leads to the corresponding default locale filename in the
 * array locales of the same index
 */
// availabe languages
const locales = ['en', 'zh-hk'];
// default language
app.use((req, res, next) => {
    // save default language (english)
    if (res.locals.chosenLang) {
        res.locals.chosenLang = res.locals.chosenLang || 'en';
    }
    else {
        res.locals.chosenLang = 'en';
    }
    res.locals.originUrl = req.originalUrl;
    console.log('originalUrl');
    console.log(req.originalUrl);
    console.log(req.url);
    console.log('host');
    console.log(req.get('host'));
    res.locals.hostinspect = req.get('host');
    res.locals.rootUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    res.locals.zhUrl = fullUrl.replace('/en/', '/zh-hk/');
    res.locals.enUrl = fullUrl.replace('/zh-hk/', '/en/');
    next();
});
i18n.configure({
    // setup some locales - other locales default to en silently
    locales,
    // where to store json files - defaults to './locales' relative to modules directory
    directory: path.join(__dirname, 'locales'),
    defaultLocale: 'en',
    // sets a custom cookie name to pare locale settings from - defualts to NULL
    cookie: 'lang'
});
app.use(i18n.init);
/**
 * Primary app routes
 */
const subRoutes = ['make-payment', 'check-order'];
// fo handling the following urls;
// baseUrl/make_payment/:controller
// baseUrl/check-order/:controller
app.get('/:language/:subRoute/:controller', (req, res, next) => {
    const subRoute = req.params.subRoute;
    if (subRoutes.indexOf(subRoute) < 0) {
        next();
        return;
    }
    const chosenLang = req.params.language;
    if (locales.indexOf(chosenLang) < 0) {
        next();
        return;
    }
    i18n.setLocale(req.params.language);
    res.setLocale(req.params.language);
    res.locals.chosenLang = req.params.language;
    if (controllers[subRoute][req.params.controller]) {
        res.locals.currentUrl = `/${subRoute}/${req.params.controller}`;
        controllers[subRoute][req.params.controller](req, res, redisClient);
    }
    else {
        next();
    }
});
app.post('/:language/:subRoute/:controller', (req, res, next) => {
    const subRoute = req.params.subRoute;
    if (subRoutes.indexOf(subRoute) < 0) {
        next();
        return;
    }
    const chosenLang = req.params.language;
    if (locales.indexOf(chosenLang) < 0) {
        next();
        return;
    }
    i18n.setLocale(req.params.language);
    res.setLocale(req.params.language);
    res.locals.chosenLang = req.params.language;
    console.log(`subRoute: ${subRoute}`);
    console.log(`req.params.controller: ${req.params.controller}`);
    if (controllers[subRoute][req.params.controller]) {
        res.locals.currentUrl = `/${subRoute}/${req.params.controller}`;
        controllers[subRoute][req.params.controller](req, res, next, redisClient);
    }
    else {
        next();
    }
});
// for handling baseUrl/:controller
// example: baseUrl/contact
app.get('/:language/:controller', (req, res, next) => {
    const chosenLang = req.params.language;
    if (locales.indexOf(chosenLang) < 0) {
        next();
        return;
    }
    i18n.setLocale(req.params.language);
    res.setLocale(req.params.language);
    res.locals.chosenLang = req.params.language;
    if (controllers[req.params.controller]) {
        res.locals.currentUrl = `/${req.params.controller}`;
        controllers[req.params.controller](req, res, redisClient);
    }
    else {
        next();
    }
});
// for index
app.get('/:language/', (req, res, next) => {
    const chosenLang = req.params.language;
    if (locales.indexOf(chosenLang) < 0) {
        next();
        return;
    }
    i18n.setLocale(req.params.language);
    res.setLocale(req.params.language);
    res.locals.chosenLang = req.params.language;
    res.locals.currentUrl = ``;
    console.log('hihi');
    controllers['index'](req, res);
});
// for handling any other urls
app.get('*', (req, res, next) => {
    console.log(`make redirection back to index`);
    res.redirect(`/${res.locals.chosenLang}/`);
});
/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());
/**
 * Start Express server
 */
app.listen(app.get('port'), () => {
    console.log((' App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
    console.log(' Press CTRL-C to stop\n');
});
module.exports = app;
//# sourceMappingURL=server.js.map