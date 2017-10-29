const app = new Vue({
  el: '#order-form',
  data: {
    availaleCurrencies: ['HKD', 'EUR', 'AUD', 'EUR', 'JPY']
    name: '',
    phone: '',
    currency: '',
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    ccv: '',
    amount: ''
  },
  watch: {
    phone() {
      
    }
  },
  methods: {
    submitOrder() {
      const data = {
        name: this.name,
        phone: this.phone,
        currency: this.currency,
        cardHolerName: this.cardHolerName,
        cardNumber: this.cardNumber,
        expireMonth: this.expireMonth,
        expireYear: this.expireYear,
        amount: this.amount
      }
      console.log(data)
    }
  }
})
