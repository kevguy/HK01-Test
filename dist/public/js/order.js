const app = new Vue({
  el: '#order-form-page',
  data: {
    availableCurrencies: ['HKD', 'EUR', 'AUD', 'EUR', 'JPY', 'USD'],
    availableMonths: [
      { month: '1', value: '01' }, { month: '2', value: '02' }, { month: '3', value: '03' },
      { month: '4', value: '04' }, { month: '5', value: '05' }, { month: '6', value: '06' },
      { month: '7', value: '07' }, { month: '8', value: '08' }, { month: '9', value: '09' },
      { month: '10', value: '10' }, { month: '11', value: '11' }, { month: '12', value: '12' }
    ],
    availableYears: [
      { year: '2017', value: '17' }, { year: '2018', value: '18' }, { year: '2019', value: '19' },
      { year: '2020', value: '20' }, { year: '2021', value: '21' }, { year: '2022', value: '22' },
      { year: '2023', value: '23' }, { year: '2024', value: '24' }, { year: '2025', value: '25' },
      { year: '2026', value: '26' }, { year: '2027', value: '27' }, { year: '2028', value: '28' },
      { year: '2029', value: '29' }, { year: '2030', value: '30' }, { year: '2031', value: '31' },
      { year: '2032', value: '32' }, { year: '2033', value: '33' }, { year: '2034', value: '34' },
      { year: '2035', value: '35' }
    ],
    name: '',
    phone: '',
    phoneValid: true,
    currency: '',
    cardHolderName: '',
    cardNumber: '',
    cardNumberValid: true,
    expireMonth: '',
    expireMonthValid: true,
    expireYear: '',
    expireYearValid: true,
    ccv: '',
    ccvValid: true,
    amount: '',
    amountValid: true,
    dialogMsg: ''
  },
  created() {
    console.log('hihi')
    this.$nextTick(() => {
      componentHandler.upgradeDom()
      componentHandler.upgradeAllRegistered()
    });
  },
  watch: {
    phone(val) {
      (/^\d+$/.test(val)) ? this.phoneValid = true : this.phoneValid = false
    },
    cardNumber(val) {
      (/^\d+$/.test(val)) ? this.cardNumberValid = true : this.cardNumberValid = false
    },
    expireYear(val) {
      val.length <= 2 &&  (/^\d+$/.test(val)) ? this.expireYearValid = true : this.expireYearValid = false
    },
    expireMonth(val) {
      val.length <= 2 &&  (/^\d+$/.test(val)) ? this.expireMonthValid = true : this.expireMonthValid = false
    },
    ccv(val) {
      // check if ccv exceends length
      // whether ccv is a number will be left to the HTML pattern
      val.length <= 4 &&  (/^\d+$/.test(val)) ? this.ccvValid = true : this.ccvValid = false
    },
    amount(val) {
      let n;
      if (val.indexOf('.') > 0) {
        // maybe a float
        n = parseFloat(val);
      } else {
        // maybe an int
        n = parseInt(val);
      }
      // const n = Math.floor(Number(val));
      (String(n) === val && n >= 0) ? this.amountValid = true : this.amountValid = false
    }
  },
  methods: {
    showModal(msg) {
      this.dialogMsg = msg;

      var dialog = document.querySelector('#modal-example');
      if (! dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
      }

      dialog.showModal();
    },
    closeModal() {
      var dialog = document.querySelector('#modal-example');
      if (! dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
      }
      this.dialogMsg = '';
      dialog.close();
    },
    submitOrder() {
      console.log('submit order')
      const data = {
        name: this.name,
        phone: this.phone,
        currency: this.currency,
        cardHolderName: this.cardHolderName,
        cardNumber: this.cardNumber,
        expireMonth: this.expireMonth,
        expireYear: this.expireYear,
        amount: this.amount,
        ccv: this.ccv
      }

      console.log(data);

      let isFieldEmpty = false
      Object.keys(data).forEach(function(key) {
        if (data[key].length === 0)
         isFieldEmpty = true
      })

      console.log(data)

      if (this.phoneValid && this.cardNumberValid &&
        this.expireYearValid && this.expireMonthValid &&
        this.ccvValid && this.amountValid && !isFieldEmpty) {
        // send data to server
        this.sendOrder(data);
      } else {
        if (isFieldEmpty) {
          this.showModal('Shit is empty');
        } else {
          this.dialogMsg = data;
          console.log(`this.phoneValid: ${this.phoneValid}`);
          console.log(`this.cardNumberValid: ${this.cardNumberValid}`);
          console.log(`this.expireYearValid: ${this.expireYearValid}`);
          console.log(`this.expireMonthValid: ${this.expireMonthValid}`);
          console.log(`this.ccvValid: ${this.ccvValid}`);
          console.log(`this.amountValid: ${this.amountValid}`);
        }
        // show dialog/intent saying input is invalid
      }

    },
    sendOrder(payload) {
      var data = new FormData();
      data.append( "json", JSON.stringify( payload ) );
      fetch(`${rootUrl}/${chosenLang}/make-payment/send-order`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        if (data.status === 'success') {
          this.showModal('Reference no: ' + data.result.referenceNo);
        } else {
          if (data.result) {
            if (data.result.message) {
              this.showModal('Error: ' + data.result.message);
            } else {
              this.showModal('Error: Order cannot be made, please try again');
            }
          } else if (data.msg) {
            this.showModal('Error: ' + data.msg);
          } else {
            this.showModal('Error: Order cannot be made, please try again');
          }
        }
      })
    }
  }
})
