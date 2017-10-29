import {} from 'jest';
import * as supertest from "supertest";

// import Payback from '../src/Payback/payback';

const request = supertest('http://localhost:4000');

describe('GET /', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/')
      .expect(200, done);
  });
});

describe('GET /en', () => {
  it('should return 200 OK', (done) => {
    return request
      .get('/en')
      .expect(200, done);
  });
});

describe('GET /zh-hk', () => {
  it('should return 200 OK', (done) => {
    request
      .get('/zh-hk')
      .expect(200, done);
  });
});

describe("GET /random-url", () => {
  it("should do redirection", () => {
    return request.get("/random-url/blah-blah-blah")
      .expect(302);
  });
});

/*
describe("GET /random-url", () => {
  it("should not return 404", () => {
    return request.get("/random-url/blah-blah-blah")
      .expect(302)
      .then(response => {
        console.log('hihi');
        console.log(response);
      });;
  });
});
*/
