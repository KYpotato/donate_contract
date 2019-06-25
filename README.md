# donate_contract

## Overview
You can recieve donation and donate to someone by ETH on this contracts. 

## Description
It is possible to set condition for donation.

## Requirement
You need MetaMask and ETH on Ropsten network.
truffle

## Usage
make project donation  
0. Select ropsten testnetwork on MetaMask.  
1. Click "New Project".  
2. Input form  
   term: Term for accepting donations (blocks)  
   min: Minimum amount of donation per address (ETH)  
   max: Maxmum amount of donation per address (ETH)  
   unit: Minimum unit of donation (ETH)  
   lower limit: Minimum value for donation acceptance conditions. (ETH) If the total value of donations is less than this value, recipient can not receive.  
   upper limit: Maximum value of donation conditions. (ETH) The total amount of donation never exceeds this value.  
3. Click "deploy" button and wait  
  
receive donation
1. Click address of your project on "Project List"
2. After the dealdline, click "withdraw" button.  
   if the total amount of donation exceeds the "lower limit", you can receive donation.  
  
donate  
0. Select ropsten testnetwork on MetaMask.  
1. Click address of project you want to donate on "Project List"  
2. Input amount you want to donate.  
3. Click "donate eth" button.  
  
## install
`git clone https://github.com/KYpotato/donate_contract.git`
`cd donate_contract`
`npm install`  
`truffle compile`  
`ganache-cli`  
`truffle migrate`  
`cd app`  
`npm install`  
`npm run dev`  

