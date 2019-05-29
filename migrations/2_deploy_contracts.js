const Donation = artifacts.require("Donation");

module.exports = function(deployer) {
  deployer.deploy(Donation, 100, 0.01, 0.1, 0.005, 1, 0.5);
};
