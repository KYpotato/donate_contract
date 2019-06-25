import Web3 from "web3";
import donationArtifact from "../../build/contracts/Donation.json";
import projectListArtifact from "../../build/contracts/Project_list.json";

const App = {
  web3: null,
  account: null,
  donation_meta: null,
  donation_contract_address: null,
  project_list_meta: null,
  project_list_contract_address: "0x186415E0ecfEC1f19d7FA92AeB76A7D8f36cFdf9",

  start: async function() {
    const { web3 } = this;

    try {
      let page = window.location.href.split('/').pop();
      console.log(page);

      // get contract instance
      // const networkId = await web3.eth.net.getId();
      // console.log(networkId);

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
      console.log("account", this.account);

      // const projectListDeployedNetwork = projectListArtifact.networks[networkId];
      // console.log(projectListArtifact);
      // console.log(projectListDeployedNetwork);
      // this.project_list_contract_address = projectListDeployedNetwork.address;
      this.project_list_meta = new web3.eth.Contract(
        projectListArtifact.abi,
        this.project_list_contract_address,
      );
      console.log("project list contract address", this.project_list_contract_address);

      switch(page) {
        case 'new_project.html':
          break;
        case 'index.html':
        case 'project.html':
          document.getElementById('project_info_div').style.display = 'none';
          this.refresh_project_list();
          // const donationDeployedNetwork = donationArtifact.networks[networkId];
          // console.log(donationArtifact);
          // console.log(donationDeployedNetwork);
          // this.donation_contract_address = donationDeployedNetwork.address;
          this.donation_meta = new web3.eth.Contract(
            donationArtifact.abi,
            this.donation_contract_address,
          );
          console.log("donation contract address", this.donation_contract_address);

          if(this.donation_contract_address != null) {
            await this.displayProjectInfo();
          }
          break;
        default:
          break;
      }

    } catch (error) {
      console.error("Could not connect to contract or chain.");
      console.log(error);
    }
  },

  get_recipient: async function() {
    const { recipient } = this.donation_meta.methods;
    return await recipient().call();
  },

  displayProjectInfo: async function() {
    await this.refreshProjectInfo();
    let recipient_address = await this.get_recipient();
    console.log("recipient", recipient_address);
    if( this.account == recipient_address) {
      console.log('recipient');
      document.getElementById("for_donor").style.display = "none";
      document.getElementById("for_recipient").style.display = "block";
    }
    else {
      console.log('donor');
      document.getElementById("for_donor").style.display = "block";
      document.getElementById("for_recipient").style.display = "none";
      this.refreshAmount();
    }
  },

  refreshProjectInfo: async function() {
    console.log(this.donation_meta.methods);
    const { get_project_info, get_donation_info, check_passed_term, state } = this.donation_meta.methods;
    console.log(get_project_info());
    let project_info = await get_project_info().call();
    console.log(project_info);
    let donation_info = await get_donation_info().call();
    console.log(donation_info);
    let is_passed_deadline = await check_passed_term().call();
    console.log(is_passed_deadline);
    let project_state = await state().call();
    console.log(project_state);

    const { web3 } = this;
    let blocknumber = await web3.eth.getBlockNumber()
    console.log('blocknumber', blocknumber);

    let state_string;
    if (project_state == 1) {
      state_string = "This project has benn canceled";
    }
    else{
      if(is_passed_deadline) {
        state_string = "The deadline has passed";
      }
      else {
        if(project_info[0] < blocknumber){
          state_string = "The deadline has passed";
        }
        else {
          state_string = "This project is open";
        }
      }
    }

    document.getElementById("state").innerHTML = state_string;
    document.getElementById("contract_address").innerHTML = this.donation_contract_address;
    document.getElementById("total").innerHTML = this.web3.utils.fromWei(donation_info[0], "ether") + " ether";
    document.getElementById("num_of_donors").innerHTML = donation_info[1].length + " addresses";
    document.getElementById("term").innerHTML = project_info[0] + " block";
    document.getElementById("min").innerHTML = this.web3.utils.fromWei(project_info[1], "ether") + " ether";
    document.getElementById("max").innerHTML = this.web3.utils.fromWei(project_info[2], "ether") + " ether";
    document.getElementById("unit").innerHTML = this.web3.utils.fromWei(project_info[3], "ether") + " ehter";
    document.getElementById("upperlimit").innerHTML = this.web3.utils.fromWei(project_info[4], "ether") + " ehter";
    document.getElementById("lowerlimit").innerHTML = this.web3.utils.fromWei(project_info[5], "ether") + " ehter";

    let donor_list = document.getElementById('donor_list');
    while(0 < donor_list.rows.length) {
      donor_list.deleteRow(0);
    }
    for(var i = 0; i < donation_info[1].length; i++) {
      console.log(i, donation_info[1][i]);
      console.log(i, this.web3.utils.fromWei(donation_info[2][i], "ether"));
      $("#donor_list").append("<tr><td>" + donation_info[1][i] + "</td><td>" + this.web3.utils.fromWei(donation_info[2][i], "ether") + "</td></tr>");
    }
  },

  refreshAmount: async function() {
    const { amount_list } = this.donation_meta.methods;
    const amount = await amount_list(this.account).call();

    document.getElementById("donated_amount").innerHTML = (amount != null ? this.web3.utils.fromWei(amount, "ether") : "0") + " ether";
  },

  refreshButtons: async function() {
    const { check_passed_term, state } = this.donation_meta.methods;
    let is_passed_deadline = await check_passed_term().call();
    let project_state = await state().call();

    if(project_state == 0) {
      if(is_passed_deadline == false && project_state == 0) {
        // open
        document.getElementById('cancel').removeAttribute("disabled");
        document.getElementById('cancel_and_refund').removeAttribute("disabled");
        document.getElementById('withdraw').setAttribute("disabled");
      }
      else if(is_passed_deadline == true && project_state == 0) {
        // deadline passed
        document.getElementById('cancel').setAttribute("disabled");
        document.getElementById('cancel_and_refund').setAttribute("disabled");
        document.getElementById('withdraw').removeAttribute("disabled");
      }
    }
    else {
      // canceled
      document.getElementById('cancel').setAttribute("disabled");
      document.getElementById('cancel_and_refund').setAttribute("disabled");
      document.getElementById('withdraw').setAttribute("disabled");
    }
    
  },

  donate: async function() {
    const { donate } = this.donation_meta.methods;
    const amount = document.getElementById('amount_donate');

    this.setStatus("donating... (please wait)");
    console.log(this.account);
    console.log(amount.value);
    console.log(this.web3.utils.toWei(amount.value, "ether"));
    await donate().send({gas: 140000, value: this.web3.utils.toWei(amount.value, "ether"), from: this.account});
    this.setStatus("donate complete!");

    this.refreshProjectInfo();
    this.refreshAmount();
  },

  refund: async function() {
    const { refund } = this.donation_meta.methods;
    const amount = document.getElementById("amount_refund");

    this.setStatus("refund... (please wait)");
    await refund(this.web3.utils.toWei(amount.value, "ether")).send({from: this.account});
    this.setStatus("refund complete!");

    this.refreshProjectInfo()
    this.refreshAmount()
  },

  cancel_and_refund: async function() {
    const { cancel_and_refund } = this.donation_meta.methods;
    await cancel_and_refund().send({from: this.account});
  },

  withdraw: async function() {
    const { withdraw } = this.donation_meta.methods;
    await withdraw().send({from: this.account});
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  deploy: async function() {
    console.log('deploy');
    const { web3 } = this;

    // try{
      console.log('bytecode');
      console.log(donationArtifact.bytecode);
      const contract = new web3.eth.Contract(donationArtifact.abi);
      console.log('contract');
      console.log(contract);
      console.log(this.project_list_contract_address);
      console.log(typeof this.project_list_contract_address);
      this.setStatus("deploying your project... (please wait)");
      const deployedContract = await contract.deploy({
        data: donationArtifact.bytecode,
        arguments: [
          parseInt(document.getElementById('term').value), // term
          App.web3.utils.toWei(document.getElementById('min').value, "ether"),  // min
          App.web3.utils.toWei(document.getElementById('max').value, "ether"),   // max
          App.web3.utils.toWei(document.getElementById('unit').value, "ether"), // unit
          App.web3.utils.toWei(document.getElementById('upper_limit').value, "ether"),     // upper limit
          App.web3.utils.toWei(document.getElementById('lower_limit').value, "ether"),   // lower limit
          this.project_list_contract_address      // project list contract address
        ]
      }, (err, res) => {
        console.log('result');
        console.log(err);
        console.log(res);
      })
      .send({from: this.account, gas: 4700000, gasPrice:100});
      console.log(deployedContract);
      console.log(deployedContract.options.address);
      this.setStatus("deploy complete!");
      // this.set_donation_address(deployedContract.options.address);
      // await this.donation_meta.methods._register_to_project_list(this.project_list_contract_address).send({from: this.account});
      window.location.href = "./index.html";
    // }
    // catch(err) {
    //   console.log(err);
    // }
  },

  get_projects: async function(){
    const { get_all_projects } = this.project_list_meta.methods;
    let projects = await get_all_projects().call();
    console.log(projects);
    return projects;
  },

  refresh_project_list: async function() {
    let project_list = await this.get_projects();

    for(var i = 0; i < project_list[0].length; i++) {
      console.log(i, project_list[0][i], project_list[1][i]);
      $("#project_list").append(`<tr><td><a href='javascript:App.go_to_project(${i}, ${project_list[0][i]})'>${project_list[0][i]}</a><label>${this.account==project_list[1][i]?'&nbsp my project':''}</label></td></tr>`);
    }

    console.log(document.getElementById('project_list'));
  },

  go_to_project: async function(row_index) {
    let tbody = document.getElementById('project_list');
    this.set_donation_address(tbody.rows[row_index].cells[0].firstChild.innerHTML);
    await this.displayProjectInfo();
    document.getElementById('project_info_div').style.display = 'block';
  },

  set_donation_address: async function(address) {
    const { web3 } = this;
    console.log(address);
    this.donation_contract_address = address;
    this.donation_meta = new web3.eth.Contract(
      donationArtifact.abi,
      this.donation_contract_address,
    );
  }
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
