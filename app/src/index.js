import Web3 from "web3";
import donationArtifact from "../../build/contracts/Donation.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = donationArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        donationArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      this.refreshProjectInfo();
      this.refreshAmount();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  refreshProjectInfo: async function() {
    const { get_project_info, get_donation_info } = this.meta.methods;
    const project_info = get_project_info().call();
    const donation_info = get_donation_info().call();

    document.getElementById("contract_address").value = "";
    document.getElementById("total").value = project_info.total;
    document.getElementById("num_of_donators").value = "";
    document.getElementById("term").value = donation_info;
    document.getElementById("min").value = donation_info;
    document.getElementById("max").value = donation_info;
    document.getElementById("unit").value = donation_info;
    document.getElementById("lowerlimit").value = donation_info;
    document.getElementById("upperlimit").value = donation_info;
  },

  refreshAmount: async function() {
    const { amount_list } = this.meta.methods;
    const amount = await amount_list(this.account).call();

    document.getElementById("donated_amount").innerHTML = this.web3.utils.fromWei(amount, "ether");
  },

  donate: async function() {
    const { donate } = this.meta.methods;
    const amount = document.getElementById('amount_donate');

    this.setStatus("donating... (please wait)");
    console.log(this.account);
    await donate().send({gas: 140000, value: this.web3.utils.toWei(amount.value, "ether"), from: this.account})
    this.setStatus("donate complete!");

    this.refreshProjectInfo();
    this.refreshAmount();
  },

  refund: async function() {
    const { refund } = this.meta.methods;
    const amount = document.getElementById("amount_refund");

    this.setStatus("refund... (please wait)");
    await refund(this.web3.utils.toWei(amount.value, "ether")).send({from: this.account});
    this.setStatus("refund complete!");

    this.refreshProjectInfo()
    this.refreshAmount()
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
    );
  }

  App.start();
});
