const Donation = artifacts.require("Donation");

module.exports = function(deployer) {
  deployer.deploy(Donation, 
    100, // term
    web3.utils.toWei("0.01", "ether"),  // min
    web3.utils.toWei("0.1", "ether"),   // max
    web3.utils.toWei("0.005", "ether"), // unit
    web3.utils.toWei("1", "ether"),     // upper limit
    web3.utils.toWei("0.5", "ether"));  // lower limit
};
