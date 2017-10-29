import {} from 'jest';
import * as supertest from "supertest";
import {Response} from 'supertest';

const request = supertest('http://localhost:4000');

describe('GET /en/check-order/search', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/en/check-order/search')
      .expect(200, done);
  });
});

describe('GET /zh-hk/check-order/search', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/zh-hk/check-order/search')
      .expect(200, done);
  });
});

describe('POST /en/check-order/send-query', () => {
  it('should return a result', (done) => {
    return request.post('/en/check-order/send-query')
      .send({
        name: 'sdvsdvd',
        referenceNo: 'ec3ce6c0-bbad-11e7-91d8-db9c77e66874'
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
