/**
 * Module dependencies
 */
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as session from 'express-session';
// import * as flash from "express-flash";
import expressValidator = require('express-validator');

import * as bodyParser from 'body-parser';

import * as i18n from 'i18n';

import * as errorHandler from 'errorhandler';

import * as compression from 'compression';  // compresses requests
import * as logger from 'morgan';
import * as path from 'path';
import ejslocals = require('ejs-locals');

import * as mongo from 'connect-mongo';
import * as mongoose from 'mongoose';

import * as redis from 'redis';

// this won't work, as we need type definition later
// import * as braintree from 'braintree';
// this also won't work
// import braintree = require('braintree');
// const braintree = require('braintree');
import Payback from './Payback/payback';

import * as dotenv from 'dotenv';

import * as JWT from './JWT/jwt';

import * as favicon from 'serve-favicon';

// import * as fetch from 'isomorphic-fetch';

import { Observable, Observer } from 'rxjs/Rx';

/**
 * Controllers (route handlers)
 */
import * as homeController from './controllers/home';
import * as paymentController from './controllers/make-payment';
import * as checkController from './controllers/check-order';

const controllers: any = {
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
dotenv.config({path: '.env.example' });


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

const redisClient = redis.createClient(parseInt(process.env.REDIS_PORT),
                              process.env.REDIS_URI
                              , {no_ready_check: true});

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
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({nope: true});
  } else {
    next();
  }
});

/*
 * Index in langs leads to the corresponding default locale filename in the
 * array locales of the same index
 */
// availabe languages
const locales: Array<string> = ['en', 'zh-hk'];


// default language
app.use((req: Request, res: Response, next: NextFunction) => {
  // save default language (english)
  if (res.locals.chosenLang) {
    res.locals.chosenLang = res.locals.chosenLang || 'en';
  } else {
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
const subRoutes: Array<string> = ['make-payment', 'check-order'];
// fo handling the following urls;
// baseUrl/make_payment/:controller
// baseUrl/check-order/:controller
app.get('/:language/:subRoute/:controller', (req: Request, res: Response, next: NextFunction) => {
  const subRoute = req.params.subRoute;
  if (subRoutes.indexOf(subRoute) < 0) { next(); return; }

  const chosenLang = req.params.language;
  if (locales.indexOf(chosenLang) < 0) { next(); return; }

  i18n.setLocale(req.params.language);
  res.setLocale(req.params.language);
  res.locals.chosenLang = req.params.language;

  if ((controllers[subRoute] as any)[req.params.controller]) {
    res.locals.currentUrl = `/${subRoute}/${req.params.controller}`;
    (controllers[subRoute] as any)[<any>req.params.controller](<any>req, <any>res, <any>redisClient);
  } else {
    next();
  }
});

app.post('/:language/:subRoute/:controller', (req: Request, res: Response, next: NextFunction) => {
  const subRoute = req.params.subRoute;
  if (subRoutes.indexOf(subRoute) < 0) { next(); return; }

  const chosenLang = req.params.language;
  if (locales.indexOf(chosenLang) < 0) { next(); return; }

  i18n.setLocale(req.params.language);
  res.setLocale(req.params.language);
  res.locals.chosenLang = req.params.language;

  console.log(`subRoute: ${subRoute}`);
  console.log(`req.params.controller: ${req.params.controller}`);
  if ((controllers[subRoute] as any)[req.params.controller]) {
    res.locals.currentUrl = `/${subRoute}/${req.params.controller}`;
    (controllers[subRoute] as any)[<any>req.params.controller](<any>req, <any>res, <any>next, <any>redisClient);
  } else {
    next();
  }
});

// for handling baseUrl/:controller
// example: baseUrl/contact
app.get('/:language/:controller', (req: Request, res: Response, next: NextFunction) => {
  const chosenLang = req.params.language;
  if (locales.indexOf(chosenLang) < 0) { next(); return; }

  i18n.setLocale(req.params.language);
  res.setLocale(req.params.language);
  res.locals.chosenLang = req.params.language;
  if ((controllers as any)[req.params.controller]) {
    res.locals.currentUrl = `/${req.params.controller}`;
    (controllers as any)[<any>req.params.controller](<any>req, <any>res, <any>redisClient);
  } else {
    next();
  }
});

// for index
app.get('/:language/', (req: Request, res: Response, next: NextFunction) => {
  const chosenLang = req.params.language;
  if (locales.indexOf(chosenLang) < 0) { next(); return; }

  i18n.setLocale(req.params.language);
  res.setLocale(req.params.language);
  res.locals.chosenLang = req.params.language;
  res.locals.currentUrl = ``;
  console.log('hihi');
  controllers['index'](req, res);
});

// for handling any other urls
app.get('*', (req: Request, res: Response, next: NextFunction) => {
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
