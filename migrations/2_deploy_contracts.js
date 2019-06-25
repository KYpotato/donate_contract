const Donation = artifacts.require("Donation");
const Project_list = artifacts.require("Project_list");

module.exports = function(deployer) {
  deployer.then(async() => {
    await deployer.deploy(Project_list);
    await deployer.deploy(Donation, 
      100, // term
      web3.utils.toWei("0.01", "ether"),  // min
      web3.utils.toWei("0.1", "ether"),   // max
      web3.utils.toWei("0.005", "ether"), // unit
      web3.utils.toWei("1", "ether"),     // upper limit
      web3.utils.toWei("0.5", "ether"),   // lower limit
      Project_list.address
      );
    console.log(Project_list.address);
    console.log(typeof Project_list.address);
    return;
  })
};
