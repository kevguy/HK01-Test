"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
    referenceNo: { type: String, unique: true },
    name: String,
    phone: String,
    currency: String,
    price: String,
    type: String,
    transactionId: String,
    creditCardNo: String
}, { timestamps: true });
/**
 * Credit Card hash middleware
 */
transactionSchema.pre('save', function save(next) {
    const transaction = this;
    if (!transaction.isModified('creditCardNo')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(transaction.creditCardNo, salt, undefined, (err, hash) => {
            if (err) {
                return next(err);
            }
            transaction.creditCardNo = hash;
            next();
        });
    });
});
transactionSchema.methods.compareCreditCardNo = function (creditCardNo, cb) {
    bcrypt.compare(creditCardNo, this.creditCardNo, (err, isMatch) => {
        cb(err, isMatch);
    });
};
const Transaction = mongoose.model('Transaction', transactionSchema);
exports.default = Transaction;
//# sourceMappingURL=Transaction.js.map