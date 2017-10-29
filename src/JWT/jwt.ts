import * as crypto from 'crypto';

function base64Encode(str: any) {
  return new Buffer(str).toString('base64');
}

function base64Decode(str: any) {
  return new Buffer(str, 'base64').toString();
}

function sign(str: any, key: any) {
  return crypto.createHmac('sha256', key).update(str).digest('base64');
}

export let encode = (payload: any, secret: String) => {
  const algorithm = 'HS256';

  const header = {
    typ: 'JWT',
    alg: algorithm
  };

  const jwt = base64Encode(header) + '.' + base64Encode(payload);
  return jwt + '.' + sign(jwt, secret);
};

export let decode = (token: any, secret: any) => {
  const segments = token.split('.');

  if (segments.length !== 3)
    throw new Error('Token structure incorrect');

  const header = JSON.parse(base64Decode(segments[0]));
  const payload = JSON.parse(base64Decode(segments[1]));

  return payload;
};
