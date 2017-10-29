const app = new Vue({
  el: '#check-order-page',
  data: {
    referenceNo: '',
    name: '',
    dialogMsg: '',
    result: undefined,
    responseSuccess: false
  },
  methods: {
    openModal(msg) {
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
    submitCheck() {
      if (referenceNo.length === 0 || name.length === 0) {
        this.openModal('shit is empty')
      }
    },
    submitOrder() {
      this.responseSuccess = false;
      console.log('submit order')
      const data = {
        name: this.name,
        referenceNo: this.referenceNo
      }

      let isFieldEmpty = false
      Object.keys(data).forEach(function(key) {
        if (data[key].length === 0)
         isFieldEmpty = true
      })


      if (!isFieldEmpty) {
        // send data to server
        this.sendOrder(data);
      } else {
        if (isFieldEmpty) {
          this.openModal('Shit is empty');
        }
      }
    },
    sendOrder(payload) {
      var data = new FormData();
      data.append( "json", JSON.stringify( payload ) );
      fetch(`${rootUrl}/${chosenLang}/check-order/send-query`, {
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
        if (data.status === 'failure') {
          this.responseSuccess = false;
          this.result = undefined;
          this.openModal(data.result);
        } else {
          this.responseSuccess = true;
          this.result = data.result;
        }
      })
    }
  }
})
