import {} from 'jest';
import * as supertest from "supertest";

const request = supertest('http://localhost:4000');

describe('GET /en/make-payment/order', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/en/make-payment/order')
      .expect(200, done);
  });
});

describe('GET /zh-hk/make-payment/order', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/zh-hk/make-payment/order')
      .expect(200, done);
  });
});

describe('POST /en/make-payment/send-order', () => {
  it('should return a result', (done) => {
    return request.post('/en/make-payment/send-order')
      .send({
        name: 'Jon Snow',
        phone: '314159',
        currency: 'HKD',
        cardHolderName: 'Eric Cartman',
        cardNumber: '378282246310005',
        expireMonth: '01',
        expireYear: '22',
        amount: '9.88',
        ccv: '0000'
      })
      .set('Accept', 'application/json')
      .expect(200)
      // .end(function (err, res) {
      //   if (err) throw err;
      //   console.log(res.body);
      //   done();
      // })
      .end((err, res) => {
        done();
      });
  });
});
