//TODO update objects to show optional parameters
//TODO expand on Function parameters
//TODO add enum types
//TODO add error types

declare module Braintree {

  /**********************
   *       Errors       *
   **********************/

   export interface AuthenticationError extends Error {}
   export interface AuthorizationError extends Error {}
   export interface DownForMaintenanceError extends Error { }
   export interface InvalidSignatureError extends Error { }
   export interface InvalidChallengeError extends Error { }
   export interface InvalidTransparentRedirectHashError extends Error { }
   export interface NotFoundError extends Error { }
   export interface ServerError extends Error { }
   export interface TestOperationPerformedInProductionError extends Error { }
   export interface TooManyRequestsError extends Error { }
   export interface UnexpectedError extends Error { }
   export interface UpgradeRequired extends Error { }

  /**********************
   *  Response Objects  *
   **********************/
  export function connect(
    config: {
      environment: Environment; //TODO get enum
      merchantId: string;
      publicKey: string;
      privateKey: string;
    }
  ): BraintreeGateway;

  export class BraintreeGateway {
    constructor(config: any);

    addOn: AddOnGateway;
    address: AddressGateway;
    clientToken: ClientTokenGateway;
    // creditCard: CreditCardGateway; //Deprecated, not bothering to implement
    creditCardVerification: CreditCardVerificationGateway;
    customer: CustomerGateway;
    // discount: DiscountGateway; //Not yet supported
    merchantAccountGateway: MerchantAccountGateway;
    paymentMethodGateway: PaymentMethodGateway;
    paymentMethodNonceGateway: PaymentMethodNonceGateway;
    plan: PlanGateway;
    settlementBatchSummary: SettlementBatchSummaryGateway;
    subscription: SubscriptionGateway;
    transaction: TransactionGateway;
    webhookNotification: WebhookNotificationGateway;
  }

  export interface AddOn {
    amount: string;
    currentBillingCycle: number;
    description: string;
    id: string;
    kind: string;
    name: string;
    neverExpires: boolean;
    numberOfBillingCycles: number;
    quantity: number;
  }

  export interface Address {
    company: string;
    countryCodeAlpha2: string;
    countryCodeAlpha3: string;
    countryCodeNumeric: string;
    countryName: string;
    createdAt: Date;
    customerId: string;
    extendedAddress: string;
    firstName: string;
    id: string;
    lastName: string;
    locality: string;
    postalCode: string;
    region: string;
    streetAddress: string;
    updatedAt: Date;
  }

  export interface AndroidPayCard extends PaymentMethod {
    bin: string;
    createdAt: Date;
    customerId: string;
    default: boolean;
    expirationMonth: string;
    expirationYear: string;
    googleTransactionId: string;
    imageUrl: string;
    sourceCardLast4: string;
    sourceCardType: string;
    sourceDescription: string;
    subscriptions: Subscription[];
    updatedAt: Date;
    virtualCardLast4: string;
    virtualCardType: string;
  }

  export interface ApplePayCard extends PaymentMethod {
    cardType: string;
    createdAt: Date;
    customerId: string;
    default: boolean;
    expirationMonth: string;
    expirationYear: string;
    expired: boolean;
    imageUrl: string;
    last4: string;
    paymentInsuranceName: string;
    sourceDescription: string;
    subscriptions: Subscription[];
    updatedAt: Date;
  }

  export interface CreditCard extends PaymentMethod {
    bin: string;
    billingAddress: Address;
    cardType: string;
    cardholderName: string;
    contryOfIssuance: string;
    createdAt: Date;
    customerId: string;
    customerLocation: any; //TODO create enum
    debit: string;
    default: boolean;
    durbinRegulated: string;
    expirationDate: string;
    expirationMonth: string;
    expirationYear: string;
    expired: boolean;
    healthcare: string;
    imageUrl: string;
    issuingBank: string;
    last4: string;
    maskedNumber: string;
    payroll: string;
    prepaid: string;
    subscriptions: Subscription[];
    uniqueNumberIdentifier: string;
    updatedAt: Date;
  }

  export interface CreditCardVerification {
    avsErrorResponseCode: string;
    avsPostalCodeResponseCode: string;
    avsScreetAddressResponseCode: string;
    billing: {
      company: string;
      countryName: string;
      extendedAddress: string;
      firstName: string;
      lastName: string;
      locality: string;
      postalCode: string;
      region: string;
      streetAddress: string;
    }
    createdAt: Date;
    creditCard: {
      bin: any; //TODO get type
      cardType: any; //TODO get type
      cardholderName: string;
      commercial: any;// TODO get type
      countryOfIssuance: string;
      customerLocation: any; //TODO get type
      debit: any; //TODO get type
      durbinRegulated: any;//TODO get type
      expirationMonth: string;
      expirationYear: string;
      healthcare: any;//TODO get type
      issuingBank: string;
      last4: any;//TODO get type
      payroll: any;//TODO get type
      prepaid: any; //TODO get type
      token: string;
      uniqueNumberIdentifier: any;//TODO get type
    }
    cvvResponseCode: any;//TODO get type
    gatewayRejectionReason: string;
    id: string;
    merchantAccountId: string;
    preprocessorResponseCode: string;
    preprocessorResponseText: string;
    riskData: {
      decision: string;
      id: string;
    }
    status: string;
  }

  export interface Customer {
    addresses: Address[];
    androidPayCards: AndroidPayCard[];
    applePayCards: ApplePayCard[];
    company: string;
    createdAt: Date;
    creditCards: CreditCard[];
    customFields: any;
    email: string;
    fax: string;
    firstName: string;
    id: string;
    lastName: string;
    paymentMethods: PaymentMethod[];
    paypalAccounts: PayPalAccount[];
    phone: string;
    updatedAt: Date;
    website: string;
  }

  export interface Discount {
    amount: string;
    currentBillingCycle: number;
    description: string;
    id: string;
    kind: string;
    name: string;
    neverExpires: string;
    numberOfBillingCycles: number;
    quantity: number;
  }

  export enum Environment {
    Production,
    Sandbox
  }

  export interface MerchantAccount {
    business: {
      addressDetails: { //TODO check type
        locality: string;
        postalCode: string;
        region: string;
        streetAddress: string;
      }
      dbaName: string;
      legalName: string;
      taxId: string;
    }
    currencyIsoCode: string;
    default: boolean;
    funding: {
      accountNumberLast4: string;
      descriptor: string;
      destination: string;
      email: string;
      mobilePhone: string;
      routingNumber: string;
    }
    id: string;
    individual: {
      addressDetails: { //TODO check type
        locality: string;
        postalCode: string;
        region: string;
        streetAddress: string;
      }
      dateOfBirth: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      ssnLast4: string;
    }
    masterMerchantAccount: any;//TODO get type probably MerchantAccount
    status: string;
  }

  export interface PayPalAccount extends PaymentMethod {
    billingAgreementId: string;
    createdAt: Date;
    customerId: string;
    default: boolean;
    email: string;
    imageUrl: string;
    subscriptions: Subscription[];
    updatedAt: Date;
  }

  export interface PaymentMethod {
    token: string;
  }

  export interface PaymentMethodNonce {
    accountHolderName: any; //TODO get type
    bic: any; //TODO get type
    default: boolean;
    maskedIban: any;//TODO get type
    nonce: string;
    securityQuestions: any;//TODO get type
    threeDSecureInfo: {
      enrolled: string;
      liabilityShiftPossible: boolean;
      liabilityShifted: boolean;
      status: string;
    }
    type: string;
  }

  export interface Plan {
    addOns: AddOn[];
    billingDayOfMonth: number;
    billingFrequency: any;//TODO get type
    createdAt: Date;
    currenyIsoCode: string;
    description: string;
    discounts: Discount[];
    id: string;
    name: string;
    numberOfBillingCycles: number;
    price: string;
    trialDuration: any; //TODO get type
    trialDurationUnit: string;
    trialPeriod: boolean;//TODO check
    updatedAt: Date;
  }

  export interface SettlementBatchSummary {
    records: any[];
  }

  export interface Subscription {
    addOns: AddOn[];
    balance: string;
    billingDayOfMonth: number;
    billingPeriodEndDate: any;
    billingPeriodStartDate: any;
    createdAt: Date;
    currentBillingCycle: number;
    daysPastDue: number;
    descriptor: any;
    discounts: Discount[];
    failureCount: number;
    firstBillingDate: number;
    id: string;
    merchantAccountId: string;
    neverExpires: boolean;
    nextBillAmount: string;
    nextBillingDate: any;
    nextBillingPeriodAmount: string;
    numberOfBillingCycles: number;
    paidThroughDate: any;
    paymentMethodToken: string;
    planId: string;
    price: string;
    status: string;
    statusHistory: any[];
    transactions: Transaction[];
    trialDuration: number;
    trialDurationUnit: string;
    trialPeriod: boolean;
    updatedAt: Date;
  }

  export interface Transaction {
    addOns: AddOn[];
    additionalProccessorResponse: string;
    amount: string;
    avsErrorResponseCode: any; //TODO get type
    avsPostalCodeResponseCode: any; //TODO get type
    avsStreetAddressResponseCode: any; //TODO get type
    billing: {
      company: string;
      countyCodeAlpha2: string;
      countyCodeAlpha3: string;
      countryCodeNumeric: string;
      countryName: string;
      extendedAddress: string;
      firstName: string;
      id: string;
      lastName: string;
      locality: string;
      postalCode: string;
      region: string;
      streetAddress: string;
    }
    channel: string;
    createdAt: Date;
    creditCard: {
      bin: any;//TODO get type
      cardType: any; //TODO get type
      cardholderName: string;
      commercial: any;//TODO get type
      countryOfIssuance: string;
      customerLocation: string;
      debit: any; //TOGO get type
      durbinRegulated: any;//TODO get type
      expirationDate: string;
      expirationMonth: string;
      expirationYear: string;
      healthcare: any;//TODO get type
      imageUrl: string;
      issuingBank: string;
      last4: any;//TODO get type
      maskedNumber: any; //TODO get type
      payroll: any;//TODO get type
      prepaid: any;//TODO get type
      token: string;
      uniqueNumberIdentifier: string;
    }
    currencyIsoCode: string;
    customFields: any;
    customer: {
      company: string;
      email: string;
      fax: string;
      firstName: string;
      id: string;
      lastName: string;
      phone: string;
      website: string;
    }
    cvvResponseCode: any;//TODO get type
    descriptor: {
      name: string;
      phone: string;
      url: string;
    }
    disbursementDetails: {
      disbursementDate: Date;//TODO check
      fundsHels: boolean;
      settlementAmount: string;
      settlementCurrencyExchangeRate: any;//TODO get type
      settlementCurrencyIsoCode: string;
      success: any; //TODO get type;
    }
    discounts: Discount[];
  }

  export interface WebhookNotification {
    Kind: {
      AccountUpdaterDailyReport: string;
      Check: string;
      Disbursement: string;
      DisbursementException: string;
      DisputeOpened: string;
      DisputeLost: string;
      DisputeWon: string;
      PartnerMerchantConnected: string;
      PartnerMerchantDisconnected: string;
      PartnerMerchantDeclined: string;
      SubscriptionCanceled: string;
      SubscriptionChargedSuccessfully: string;
      SubscriptoinChargedUnsuccessfully: string;
      SubscriptionExpired: string;
      SubscriptionTrialEnded: string;
      SubscriptionWentActive: string;
      SubscriptionWEntPastDue: string;
      SubMerchantAccountApproved: string;
      SubMerchantAccountDeclined: string;
      TransactionDisbursed: string;
    }
    subscription?: Subscription;
    merchantAccount?: MerchantAccount;
    disbursement?: any; //TODO create type
    transaction?: Transaction;
    partnerMerchant?: MerchantAccount;
    dispute?: any; //TODO create type
    accountUpdaterDailyReport?: any; //TODO create type

    errors: any; //TODO get type
    message: string;
  }

  /**********************
   *      Gateways      *
   **********************/

  export class AddOnGateway {
    all(callback?: (err: Error, result: AddOn[]) => {}): void;
  }

  export class AddressGateway {
    create(
      data: {
        company?: string;
        countryCodeAlpha2?: string;
        countryCodeAlpha3?: string;
        countryCodeNumeric?: string;
        countryName?: string;
        customerId: string;
        extendedAddress?: string;
        firstName?: string;
        lastName?: string;
        locality?: string;
        postalCode?: string;
        region?: string;
        streetAddress?: string;
      },
      callback?: (err: Error, result: Address) => {}
    ): void;

    delete(
      customerId: string,
      addressId: string,
      callback?: (err: Error) => {}
    ): void;

    find(
      customerId: string,
      addressId: string,
      callback?: (err: Error, result: Address) => {}
    ): void;

    update(
      customerId: string,
      addressId: string,
      data: {
        company?: string;
        countryCodeAlpha2?: string;
        countryCodeAlpha3?: string;
        countryCodeNumeric?: string;
        countryName?: string;
        extendedAddress?: string;
        firstName?: string;
        lastName?: string;
        locality?: string;
        postalCode?: string;
        region?: string;
        streetAddress?: string;
      },
      callback?: (err: Error, result: Address) => {}
    ): void;
  }

  export class ClientTokenGateway {
    generate(
      data: {
        customerId?: string;
        merchantAccountId?: string;
        options?: {
          failOnDuplicatePaymentMethod?: boolean;
          makeDefault?: boolean;
          verifyCard?: boolean;
        }
        version?: string;
      },
      callback?: (err: Error, result: { clientToken: string }) => {}
    ): void;
  }

  export class CreditCardVerificationGateway {
    search(
      search: (search: {
        billingAddressDetailsProstalCode: any,
        createdAt: any,
        creditCardCardType: any,
        creditCardCardHolderName: any,
        creditCardExpirationDate: any,
        creditCardNumber: any,
        customerEmail: any,
        customerId: any,
        id: any,
        ids: any,
        paymentMethodToken: any
      }) => {},
      callback?: (err: Error, response: { each: Function }) => {}
    ): void;
  }

  export class CustomerGateway {
    create(
      data: {
        company?: string;
        creditCard?: {
          billingAddress?: {
            company?: string;
            countryCodeAlpha2?: string
            countryCodeAlpha3?: string
            countryCodeNumeric?: string;
            countryName?: string;
            extendedAddress?: string;
            firstName?: string;
            lastName?: string;
            locality?: string;
            options?: any; //TODO check if correct
            postalCode?: string;
            region?: string;
            streetAddress?: string;
          };
          cardholderName?: string;
          options?: {
            failOnDuplicatePaymentMethod?: boolean;
            makeDefault?: boolean;
            verificationAcmount?: string;
            verificationMerchantAccountId?: string;
            verifyCard?: boolean;
          };
          token?: string;
        };
        customFields?: any;
        deviceData?: string;
        email?: string;
        fax?: string;
        firstName?: string;
        id?: string;
        lastName?: string;
        paymentMethodNonce?: string;
        phone?: string;
        website?: string;
      },
      callback?: (
        err: Error,
        result: {
          customer?: Customer;
          verification?: CreditCardVerification;
          message?: string;
          success: boolean;
        }
      ) => {}
    ): void;

    delete(
      customerId: string,
      callback?: (err: Error) => {}
    ): void;

    find(
      customerId: string,
      callback?: (err: Error, customer: Customer) => {}
    ): void;

    search(
      search: (search: {
        //TODO
      }) => {},
      callback?: (
        err: Error,
        results: { each: (err: Error, customer: Customer) => {} }
      ) => {}
    ): void;

    update(
      id: string,
      data: {
        company?: string;
        creditCard?: {
          billingAddress?: {
            company?: string;
            countryCodeAlpha2?: string
            countryCodeAlpha3?: string
            countryCodeNumeric?: string;
            countryName?: string;
            extendedAddress?: string;
            firstName?: string;
            lastName?: string;
            locality?: string;
            options?: {
              updateExisting?: boolean;
            };
            postalCode?: string;
            region?: string;
            streetAddress?: string;
          };
          billingAddressId?: string;
          cardholderName?: string;
          options?: {
            failOnDuplicatePaymentMethod?: boolean;
            makeDefault?: boolean;
            updateExistingToken?: string;
            verificationAcmount?: string;
            verificationMerchantAccountId?: string;
            verifyCard?: boolean;
          };
          token?: string;
        };
        customFields?: any;
        deviceData?: string;
        email?: string;
        fax?: string;
        firstName?: string;
        id?: string;
        lastName?: string;
        paymentMethodNonce?: string;
        phone?: string;
        website?: string;
      },
      callback?: (err: Error, result: { customer: Customer }) => {}
    ): void;
  }

  export class DiscountGateway {
    // `all` is not supported in the node library yet
  }

  export class MerchantAccountGateway {
    create(
      data: {
        business?: {
          address?: string | { //TODO check correct
            locality?: string;
            postalCode?: string;
            region?: string;
            streetAddress?: string;
          };
          dbaName?: string;
          legalName?: string;
          taxId?: string;
        };
        funding: {
          accountNumber?: string;
          descriptor?: string;
          destination: string;
          email?: string;
          mobilePhone?: string;
          routingNumber: string;
        }
        individual: {
          address: string | { //TODO check correct
            locality: string;
            postalCode: string;
            region: string;
            streetAddress: string;
          };
          dateOfBirth: string;
          email: string;
          firstName: string;
          lastName: string;
          phone?: string;
          ssn?: string;
        };
        merchantAccountId: string;
        tosAccepted: boolean;
      },
      callback?: (err: Error, result: { merchantAccount: MerchantAccount }) => {} //TODO check correctness
    ): void;

    find(
      id: string,
      callback?: (err: Error, merchantAccount: MerchantAccount) => {}
    ): void;

    update(
      id: string,
      data: {
        business?: {
          address?: string | { //TODO check correct
            locality?: string;
            postalCode?: string;
            region?: string;
            streetAddress?: string;
          };
          dbaName?: string;
          legalName?: string;
          taxId?: string;
        };
        funding?: {
          accountNumber?: string;
          descriptor?: string;
          destination: string;
          email?: string;
          mobilePhone?: string;
          routingNumber: string;
        }
        individual?: {
          address?: string | { //TODO check correct
            locality?: string;
            postalCode?: string;
            region?: string;
            streetAddress?: string;
          };
          dateOfBirth?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          phone?: string;
          ssn?: string;
        };
      },
      callback?: (
        err: Error,
        result: { success: boolean, merchantAccount: MerchantAccount }
      ) => {}
    ): void;
  }

  export class PaymentMethodGateway {
    create(
      data: {
        billingAddress?: {
          company?: string;
          countryCodeAlpha2?: string
          countryCodeAlpha3?: string
          countryCodeNumeric?: string;
          countryName?: string;
          extendedAddress?: string;
          firstName?: string;
          lastName?: string;
          locality?: string;
          postalCode?: string;
          region?: string;
          streetAddress?: string;
        };
        billingAddressId?: string;
        cardholderName: string;
        customerId: string;
        cvv?: string;
        deviceData?: string;
        expirationDate?: string;
        expirationMonth?: string;
        expirationYear?: string;
        number?: string;
        options?: {
          failOnDuplicatePaymentMethod?: boolean;
          makeDefault?: boolean;
          verificationAcmount?: string;
          verificationMerchantAccountId?: string;
          verifyCard?: boolean;
        };
        paymentMethodNonce: string;
        token?: string;
      },
      callback?: (
        err: Error,
        result: { success: boolean, paymentMethod: PaymentMethod } //TODO check correct
      ) => {}
    ): void;

    delete(
      token: string,
      callback?: (err: Error) => {}
    ): void;

    find(
      token: string,
      callback?: (err: Error, paymentMethod: PaymentMethod) => {}
    ): void;

    update(
      token: string,
      data: {
        billingAddress?: {
          company?: string;
          countryCodeAlpha2?: string
          countryCodeAlpha3?: string
          countryCodeNumeric?: string;
          countryName?: string;
          extendedAddress?: string;
          firstName?: string;
          lastName?: string;
          locality?: string;
          options?: {
            updateExisting?: boolean;
          };
          postalCode?: string;
          region?: string;
          streetAddress?: string;
        };
        billingAddressId?: string;
        cardholderName?: string;
        cvv?: string;
        expirationDate?: string;
        expirationMonth?: string;
        expirationYear?: string;
        number?: string;
        options?: {
          failOnDuplicatePaymentMethod?: boolean;
          makeDefault?: boolean;
          verificationAcmount?: string;
          verificationMerchantAccountId?: string;
          verifyCard?: boolean;
        };
        paymentMethodNonce?: string;
        token?: string;
      },
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;
  }

  export class PaymentMethodNonceGateway {
    create(
      paymentMethodToken: string,
      callback?: (err: Error, response: { paymentMethodNonce: PaymentMethodNonce }) => {}
    ): void;

    find(
      paymentMethodNonce: string,
      callback?: (err: Error, result: PaymentMethodNonce) => {}
    ): void;
  }

  export class PlanGateway {
    all(callback?: (err: Error, result: {/*TODO*/ }) => {}): Plan[];
  }

  export class SettlementBatchSummaryGateway {
    generate(
      data: {
        settlementDate: string,
        groupByCustomField?: string
      },
      callback?: (err: Error, result: { settlementBatchSummary: SettlementBatchSummary }) => {}
    ): void;
  }

  export class SubscriptionGateway {
    cancel(
      subscriptionId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    create(
      data: {
        addOns?: {
          add?: {
            amount?: string;
            inheritedFromId: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: any; //TODO get type
          }[];
          update: {
            amount?: string;
            existingId: string; //TODO check required
            neverExpires?: boolean;
            numberOfBillingCycles?: number;
            quantity?: number;
          }[];
          remove: string[]
        };
        billingDayOfMonth?: number;
        descriptor?: {
          name?: string;
          phone?: string;
          url?: string;
        };
        discounts: {
          add: {
            amount?: string;
            inheritedFromId: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: number;
          }[];
          updade: {
            amount?: string;
            inheritedFromId?: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: number;
          }[];
          remove: string[];
        };
        firstBillingDate?: Date;
        id?: string;
        merchantAccountId?: string;
        neverExpires?: boolean;
        numberOfBillingCycles?: number;
        options?: {
          doNotInheritAddOnsOrDiscounts?: boolean;
          startImmediately?: boolean;
        };
        paymentMethodNonce?: string;
        paymentMethodToken: string;
        planId: string;
        price?: string;
        trialDuration?: number;
        trialDurationUnit?: string;
        trialPeriod?: boolean;
      },
      callback?: (err: Error, result: { subscription: Subscription }) => {}
    ): void;

    find(
      subscriptionId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    retryCharge(
      subscriptionId: string,
      amount?: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    search(
      search: (search: any) => {}, //TODO get search type
      callback?: (
        err: Error,
        response: { each: (err: Error, subscription: Subscription) => {} }
      ) => {}
    ): any; //TODO get return stream type

    update(
      id: string,
      data: {
        addOns?: {
          add?: {
            amount?: string;
            inheritedFromId: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: number;
          }[];
          update: {
            amount?: string;
            existingId?: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: number;
            quantity?: number;
          }[];
          remove: string[]
        };
        descriptor?: {
          name?: string;
          phone?: string;
          url?: string;
        };
        discounts: {
          add: {
            amount?: string;
            inheritedFromId: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: number;
          }[];
          updade: {
            amount?: string;
            inheritedFromId?: string;
            neverExpires?: boolean;
            numberOfBillingCycles?: string;
            quantity?: number;
          }[];
          remove: string[];
        };
        id?: string;
        merchantAccountId?: string;
        neverExpires?: boolean;
        numberOfBillingCycles?: number;
        options?: {
          prorateCharges: boolean;
          replaceAllAddonsAndDiscounts?: boolean;
          revertSubscriptionOnProrationFailure?: boolean;
        };
        paymentMethodToken?: string;
        planId?: string;
        price?: string;
      },
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;
  }

  export class TransactionGateway {
    cancelRelease(
      transationId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    cloneTransaction(
      transactionId: string,
      data?: {
        amount: string;
        options: {
          submitForSettlement: boolean;
        }
      },
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    find(
      transationId: string,
      callback?: (err: Error, transaction: Transaction) => {}
    ): void;

    holdInEscrow(
      transactionId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    refund(
      transactionId: string,
      amount?: string,
      callback?: (
        err: Error,
        result: { success: boolean, transaction: Transaction }
      ) => {}
    ): void;

    releaseFromEscrow(
      tansactionId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    sale(
      data: {
        amount: string,
        billing?: {
          //TODO
        }
        //TODO
      },
      callback?: (
        err: Error,
        result: { success: boolean, transaction: Transaction }
      ) => {}
    ): void;

    search(
      search: (search: any) => {}, //TODO get search type
      callback?: (
        err: Error,
        response: { each: (err: Error, transaction: Transaction) => {} }
      ) => {}
    ): any; //TODO get return stream type

    submitForSettlement(
      transactionId: string,
      callback?: (err: Error, result: {/*TODO*/ }) => {}
    ): void;

    void(
      transactionId: string,
      callback?: (err: Error, result: { success: boolean, message?: string }) => {}
    ): void;
  }

  export class WebhookNotificationGateway {
    parse(
      signature: string,
      payload: string,
      callback: (err: Error, result: { kind: any, timestamp: any }) => {} //TODO get rest of types
    ): void;
  }
}

declare module 'braintree' {
  export default Braintree;
}
