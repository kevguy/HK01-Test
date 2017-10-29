"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function base64Encode(str) {
    return new Buffer(str).toString('base64');
}
function base64Decode(str) {
    return new Buffer(str, 'base64').toString();
}
function sign(str, key) {
    return crypto.createHmac('sha256', key).update(str).digest('base64');
}
exports.encode = (payload, secret) => {
    const algorithm = 'HS256';
    const header = {
        typ: 'JWT',
        alg: algorithm
    };
    const jwt = base64Encode(header) + '.' + base64Encode(payload);
    return jwt + '.' + sign(jwt, secret);
};
exports.decode = (token, secret) => {
    const segments = token.split('.');
    if (segments.length !== 3)
        throw new Error('Token structure incorrect');
    const header = JSON.parse(base64Decode(segments[0]));
    const payload = JSON.parse(base64Decode(segments[1]));
    return payload;
};
//# sourceMappingURL=jwt.js.map