import * as bcrypt from 'bcrypt-nodejs';
import * as crypto from 'crypto';
import * as mongoose from 'mongoose';

export type TransactionModel = mongoose.Document & {
  name: string,
  phone: string,
  currency: string,
  price: string,
  type: string,
  transactionId: string
  creditCardNo: string,
  referenceNo: string,

  compareCreditCardNo: (creditCardNo: string, cb: (err: any, isMatch: any) => {}) => void
};

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
  if (!transaction.isModified('creditCardNo')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(transaction.creditCardNo, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      transaction.creditCardNo = hash;
      next();
    });
  });
});

transactionSchema.methods.compareCreditCardNo = function (creditCardNo: string, cb: (err: any, isMatch: any) => {}) {
  bcrypt.compare(creditCardNo, this.creditCardNo, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
