var request = require('request');
let fetch = require('node-fetch');

var dataString = 'VERSION=56.0&SIGNATURE=AEXy-7etBVzfsyWvVj2Q9jqoVg3dAZA5CkeVn4Dt.dRzPXV2Ps6Lccpb&USER=kevlai22-2_api1.uw.edu&PWD=WG8AG6Y62DJPH52L&METHOD=DoDirectPayment&PAYMENTACTION=Sale&IPADDRESS=192.168.0.1&AMT=8.88&CREDITCARDTYPE=Visa&ACCT=4571338849742676&EXPDATE=112022&CVV2=000&FIRSTNAME=John&LASTNAME=Smith&STREET=1 Main St.&CITY=San Jose&STATE=CA&ZIP=95131&COUNTRYCODE=US';

var options = {
    url: 'https://api-3t.sandbox.paypal.com/nvp',
    method: 'POST',
    body: dataString
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}


// let payload = {
//   VERSION: "56.0",
//   SIGNATURE: "AEXy-7etBVzfsyWvVj2Q9jqoVg3dAZA5CkeVn4Dt.dRzPXV2Ps6Lccpb"  ,
//   USER: "kevlai22-2_api1.uw.edu",
//   PWD: "WG8AG6Y62DJPH52L",
//   METHOD: "DoDirectPayment",
//   PAYMENTACTION: "Sale",
//   IPADDRESS: "192.168.0.1",
//   AMT: 8.88,
//   CREDITCARDTYPE: "Visa",
//   ACCT: "4571338849742676",
//   EXPDATE: "112022",
//   CVV2: "000",
//   FIRSTNAME: "John",
//   LASTNAME: "Smith",
//   STREET: "1 Main St.",
//   CITY: "San Jose",
//   STATE: "CA",
//   ZIP: "95131",
//   COUNTRYCODE: "US"
// };

let payload =  {
  VERSION: '56.0',
  SIGNATURE: 'ALvW1LfJ5RaibyQPxHIpppfeMDgoANSIee2pGQJLCI2Dp5v5FMZ0CEWH',
  USER: 'kevlai22-3_api1.uw.edu',
  PWD: 'TT29JSDCEWZPX2NA',
  METHOD: 'DoDirectPayment',
  PAYMENTACTION: 'Sale',
  IPADDRESS: '192.168.0.1',
  AMT: undefined,
  CREDITCARDTYPE: 'VISA',
  ACCT: '4032036598120085',
  EXPDATE: '102022',
  CVV2: '000',
  FIRSTNAME: 'dvsdv',
  LASTNAME: 'dvsdv',
  STREET: '1 Main St.',
  CITY: 'San Jose',
  STATE: 'CA',
  ZIP: '95131',
  COUNTRYCODE: 'US'
};


// payload = {
//   SIGNATURE: "AEXy-7etBVzfsyWvVj2Q9jqoVg3dAZA5CkeVn4Dt.dRzPXV2Ps6Lccpb"  ,
//   USER: "kevlai22-2_api1.uw.edu",
//   PWD: "WG8AG6Y62DJPH52L",
//   METHOD: "GetTransactionDetails",
//   VERSION: "78",
//   TransactionID: "08P32454TS514583H"
// };

// let fuck = new FormData();
// fuck.append( "json", JSON.stringify( payload ) );
// console.log(fuck);

console.log(JSON.stringify(payload));

const str = Object.keys(payload).reduce((acc, curr) => {
  return acc +=`&${curr}=${payload[curr]}`;
}, '');
console.log(str);

const responseStr = `RECEIVERBUSINESS=kevlai22%2d2%40uw%2eedu&RECEIVEREMAIL=kevlai22%2d2%40uw%2eedu&RECEIVERID=GK2A6964DBHBJ&PAYERID=LVUT9HVCQBR58&PAYERSTATUS=unverified&COUNTRYCODE=US&ADDRESSOWNER=PayPal&ADDRESSSTATUS=None&SALESTAX=0%2e00&SHIPAMOUNT=0%2e00&SHIPHANDLEAMOUNT=0%2e00&GIFTRECEIPT=0&TIMESTAMP=2017%2d10%2d28T12%3a10%3a06Z&CORRELATIONID=67d72b43533f7&ACK=Success&VERSION=78&BUILD=39206242&FIRSTNAME=John&LASTNAME=Smith&TRANSACTIONID=08P32454TS514583H&RECEIPTID=0313%2d0453%2d8436%2d3609&TRANSACTIONTYPE=pro_api&PAYMENTTYPE=instant&ORDERTIME=2017%2d10%2d28T12%3a02%3a39Z&AMT=8%2e88&FEEAMT=0%2e65&TAXAMT=0%2e00&CURRENCYCODE=USD&PAYMENTSTATUS=Completed&PENDINGREASON=None&REASONCODE=None&PROTECTIONELIGIBILITY=Ineligible&PROTECTIONELIGIBILITYTYPE=None&L_QTY0=1&L_TAXAMT0=0%2e00&L_SHIPPINGAMT0=0%2e00&L_HANDLINGAMT0=0%2e00&L_CURRENCYCODE0=USD&L_AMT0=8%2e88&INSURANCEOPTIONSELECTED=0&SHIPPINGOPTIONISDEFAULT=0
`;

const decodedResponseStr = decodeURIComponent(responseStr);
console.log(decodedResponseStr);
const lalala = decodedResponseStr.split('&');
console.log(lalala);



fetch('https://api-3t.sandbox.paypal.com/nvp', {
  method: 'POST',
  body: str.substring(1)
})
.then(res => res.text())
.then(result => console.log(result));

// request(options, callback);
