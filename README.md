# HK01-Test

## Table of contents
- [Usage](#usage)
  - [Make a Payment](#make-a-payment)
    - [Braintree](#braintree)
    - [Paypal](#paypal)
  - [Check order](#check-order)
- [Installation](#installation)
- [How to run](#how-to-run)
- [How to test](#how-to-test)
- [Structure](#structure)
- [Source Code](#source-code)
- [Payback (src/Payback/payback.ts)](#payback-src-payback-payback-ts)
- [server (src/server.ts)](#server-src-server-ts)
- [Controllers (src/controllers)](controllers-src-controllers)
  - [Controller: home](#controller-home)
  - [Controller: check-order](#controller-check-order)
  - [Controller: make-payment](#controller-make-payment)
- [locales (src/locales)](#locales-src-locales)
- [models (src/models)](#models-src-models)
- [public (src/public)](#public-src-public)
- [types (src/types)](#types-src-types)
- [views (src/views)](#views-src-views)
- [Checklist](#checklist)
- [Requirements](#requirements)
- [Bonus](#bonus)
- [After-thoughts](#after-thoughts)


## Usage
### Make a payment
On the make-payment page, I have listed some credit card numbers for you to try out with the necessary conditions specified.

https://hk01-test.herokuapp.com/en/make-payment/order

#### Braintree
According to the specification, `HKD`, `JPY` and `CNY` are to be handled by Braintree. Since Braintree handles different currencies by different merchant accounts, so I created two for it (`.env.example`), as I can't create a merchant account for `CNY`, so I did not handle `CNY` payments.

The credit card numbers I listed on the page are extracted from https://developers.braintreepayments.com/guides/credit-cards/testing-go-live/node, the two American Express numbers are listed just for completion, they won't work as `USD` payments are handled by Paypal.

You can repeatedly use the same information to do payments, except you will have to change the `amount` every time, or Braintree will give a `duplicate request` error.

#### Paypal
Paypal is supposed to be handling `USD`, `EUR` and `AUD` payments. The Paypal REST api has restricted doing credit card payments (https://developer.paypal.com/docs/api/), so I switched to doing it this way instead:

Paypal has something called Direct Payments, but requires pro accounts, I created two in the sandbox to handle `USD` and `AUD` payments. I also tried upgrading two `EUR` accounts (I used Germany and Greece) I created to pro accounts, but Paypal won't allow me. So right now, only `USD` and `AUD` payments can be handles.

And because of the above limitation, you can only use the two credit cards I specified on the web page to test out Paypal payments.

If you need to test out if you can do `non-USD` payments with an `AMEX` card number, the best you can do is use the `AMEX` numbers I listed on the Braintree section. I will give you an error before actually sending the requests to Paypal.

### Check Order

https://hk01-test.herokuapp.com/en/check-order/search

Just input the name you used for the payment and the given transaction reference number and do the searching.

## Installation
This is a NodeJS application, make sure you it installed on your computer.

The programming language chosen for development is TypeScript, so make sure you have TypeScript and TsLint installed globally:

```
sudo npm install -g typescript
sudo npm install -g tslint
```

Then run the following command to install all the dependencies:

```
sudo npm install
```

## How to run
You can run the application in the following two ways:

First, you can run the application instantly by running the `.js` file generatedin the `dist` folder:

```
sudo node ./dist/server.js
```

Or, for development and debugging, the preferred way is:

```
sudo npm run start
```

This will compile the .ts files and copy the necessary files into the `dist` folder and then watch for any file changes and restart the server.

Then you can go to http://localhost:4000

## How to test
Start the server:
```
sudo npm run start
```

In another terminal/command prompt, run the testing suite:
```
sudo npm run test
```

## Structure
Here's an overview of the folder structure:

| Name | Type | Summary |
|:-----|:-----|:-----|
| dist | Folder | The folder storing all the compiled files and everything needed to run the server with NodeJS |
| src | Folder | The folder that stores all the source code, details will be covered later |
| test | Folder | Contains all the test suites, will be explained more later |
| .env.example | File | Contains all the api keys and urls for MongoDb and Redis |
| copyStaticAssets.js | File | Copies static files into the `dist` folder |
| Procfile | File | Instructs how Heroku should run the server |
| package.json | File | Contains all the dependencies need to be installed and some info about the Node application |
| README.md | File | This file |
| tsconfig.json | File | Instructs `tsc` how it should compile the `.ts` files into `.js` files |
| tslint.json | File | Instructs `tslint` how it should lint the source code in `.ts` files |

## Source Code
Before you start, there's one thing I need to point out. `RxJS` (https://github.com/reactivex/rxjs) is used to handle anything that's asynchronous. I don't like putting too many callbacks in Node and which usually lead to callback hells. Also, compared to using Promises and chaining, I like using something more powerful that I can treat all the asynchronous actions into Observables, or 'streams' I like to call it.

### Payback (src/Payback/payback.ts)
Payback is the name of the library that is in charge of anything that has to do with communication with Paypal and Braintree, whether it's creating payments or querying transaction infos.

The basic mechanism is whenever the server receives requests that it has to communicated Paypal or Braintree, it'll establish the connection to do the work.

### server (src/server.ts)
The most important file of the application. It

- runs the server
- connects to the MongoDb instance on mlab
- connects to the Redis instance on RedisLab
- handles all the requests
  - sets the chosen language by analyzing the urls of the requests
  - parses the urls and determines what actions should be taken/what controllers should handle the request
  - redirects clients back to home page if requests are invalid

### Controllers (src/controllers)
There are three controllers: `home`, `check-order` and `make-payment`.

#### Controller: home
Handles the home page, that's it.

#### Controller: check-order
Handles
 - `https://rootUrl/chosen_language/check-order/search`
   - renders the page for clients to input searching information
 - `https://rootUrl/chosen_language/check-order/`
   - handles the requests and do the searching, then returns the result

Mechanism:
 - First check the cache in Redis,
   - if record is found, compare the `name`
   - if all information pass, return the result to client
   - else return error
- If record cannot be found in cache or there's an error,
   - find the record in MongoDb and returns the result to client
- When all is done, query Braintree/Paypal to verify if transaction still exists
   - if not, delete record in MongoDb

#### Controller: make-payment
Handles
 - `https://rootUrl/chosen_language/make-payment/order`
   - renders the page for clients to input payment information
 - `https://rootUrl/chosen_language/make-payment/send-order`
   - handles the requests and do the payment, then returns the result

 Mechanism:
  - First verify client's information and determines if Paypal/Braintree shoudl be used
  - Do the transaction
    - if success, stores the info in MongoDb and Redis and returns the reference no to client
    - if fail, returns an error message to client

### locales (src/locales)
Contains the mappings of the strings to show depending on language preferences

### models (src/models)
Contains the schema for storing records in MongoDb

### public (src/public)
Contains the static files that the web pages will be using, like images and `.js` files

### types (src/types)
Type definitions for typescript

### views (src/views)
Contains the web pages (`.ejs`) to be sent to clients and rendered.


## Checklist

### Requirements
| Criteria | Status |
|:---------|:-------|
| Create a payment gateway library, that could handle payments with PayPal REST API and Braintree payments | finished |
| Create a Make Payment Form to make the payment | Finished |
| After submitting the payment form, use a different gateway based on rules specified | Finished |
| Use appropriate form validations | Finished |
| Show Lightbox with success or error message after payment. | Finished |
| Save order data + response from payment gateway to database table. | Finished |
| Create a Payment Checking Form to check the payment record by Customer name, and payment reference code. | Finished |
| The record should get from memory caching instead of database. | Finished |
| Create a public repository on any Git repository provider and push the solution
there. | Finished |

### Bonus
| Item | Status |
|:---------|:-------|
| Documentation are added into every `.ts` file | Finished |
| Supports Chinese and English versions | Finished |
| Server-side rendering using EJS | Finished |
| Credit card information are encrypted and hashed, refer to `src/models/Transaction.ts` | Finished |
| Cache expires after 5 minutes, will retrieve from MongoDb and update the cache should requests ever arise | Finished |
| After returning reponse for transaction queries, a check with Paypal/Braintree will be done and update the database | Finished |


### After-thoughts
Time is limited, so actually a lot more can be done.
 - The UI of the web pages can be done better. I used Google's Material Design Lite to do development instead of using Bootstrap, but I forgot Material Design Lite actually doesn't support dropdown lists. This is why the dropdown lists seem a bit weird.
 - The Chinese and English versions are not 100% completed because of some lacking of text keys in `src/locales/en.json` and `zh-hk.json`.
 - Payment validation should be double-checked on server instead of solely relying on client-side (namely `Vue`).

I spent three days to finish the whole project due to me leaving my job at NISI on Friday, and the whole infrastructure and setup are actually quite straightforward and easy, I actually spent most of my time dealing with Paypal's API and Braintree, I'm lucky I finally had them sorted out and for the limitations of my solution, I've already listed out at the `Usage` section.  
