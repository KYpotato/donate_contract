var Donation = artifacts.require("Donation");

contract('Donation', accounts => {
  describe('open -> donate -> close(achieved) -> withdraw', async () => {
    var obj;

    before(async () => {
      // console.log(web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), "ether"));
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.5", "ether"),   // upper limit
        web3.utils.toWei("0.2", "ether")    // lower limit
        );
      // console.log(web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), "ether"));
    });

    it('donate', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
      await obj.donate({gas: 140000, from: accounts[2], value: web3.utils.toWei("0.1", "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0.2", "ether"));
      assert.equal(donation_info[1].length, 2);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[1][1], accounts[2]);
      assert.equal(donation_info[2].length, 2);
      assert.equal(donation_info[2][0], web3.utils.toWei("0.1", "ether"));
      assert.equal(donation_info[2][1], web3.utils.toWei("0.1", "ether"));
    })

    it('withdraw after project close', async() => {

      // console.log("start", (await web3.eth.getBlock('latest')).number);
      for(var i = 0; i < 110; i++){
        await web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: i
        }, () => {});
      }
      // console.log("end", (await web3.eth.getBlock('latest')).number);

      let ret = await obj.check_passed_term();
      assert.equal(ret, true);

      // let project_info = await obj.get_project_info();
      // console.log(project_info[0].toString());

      let before_withdraw = new web3.utils.BN(await web3.eth.getBalance(accounts[0]));

      // calc gas cost
      let recept = await obj.withdraw({gas: 140000, from: accounts[0]});
      let gasused = new web3.utils.BN(recept.receipt.gasUsed);
      let gasprice = new web3.utils.BN((await web3.eth.getTransaction(recept.tx)).gasPrice);
      // console.log(typeof gasused, gasused, typeof gasprice, gasprice);
      let gas = gasprice.mul(gasused);
      
      // console.log("before withdraw", web3.utils.fromWei(before_withdraw, "ether"));
      // console.log("gas", web3.utils.fromWei(gas.toString(), "ether"));
      // console.log("after withdraw", web3.utils.fromWei(await web3.eth.getBalance(accounts[0])));
      assert.equal((await web3.eth.getBalance(accounts[0])).toString(), before_withdraw.add(new web3.utils.BN(web3.utils.toWei("0.2", "ether"))).sub(gas).toString());
    })

  })
})

contract('Donation', accounts => {
  var obj;

  describe('open -> donate -> close(unachieved) -> refund', async () => {
    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.5", "ether"),   // upper limit
        web3.utils.toWei("0.2", "ether")    // lower limit
        );
    });

    it('donate', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.01", "ether")});
      await obj.donate({gas: 140000, from: accounts[2], value: web3.utils.toWei("0.1", "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0.11", "ether"));
      assert.equal(donation_info[1].length, 2);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[1][1], accounts[2]);
      assert.equal(donation_info[2].length, 2);
      assert.equal(donation_info[2][0], web3.utils.toWei("0.01", "ether"));
      assert.equal(donation_info[2][1], web3.utils.toWei("0.1", "ether"));
    })

    it('withdraw will fail', async() => {

      // console.log("start", (await web3.eth.getBlock('latest')).number);
      for(var i = 0; i < 100; i++){
        await web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: i
        }, () => {});
      }
      // console.log("end", (await web3.eth.getBlock('latest')).number);

      // let project_info = await obj.get_project_info();
      // console.log(project_info[0].toString());

      let err = null;
      try{
        await obj.withdraw({gas: 140000, from: accounts[0]});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);
      // console.log(err);
    })

    it('refund', async () => {
      let before_refund_1 = new web3.utils.BN(await web3.eth.getBalance(accounts[1]));
      let before_refund_2 = new web3.utils.BN(await web3.eth.getBalance(accounts[2]));
      
      // calc gas cost
      let recept_1 = await obj.refund_after_deadline({gas: 140000, from: accounts[1]});
      let gasused_1 = new web3.utils.BN(recept_1.receipt.gasUsed);
      let gasprice_1 = new web3.utils.BN((await web3.eth.getTransaction(recept_1.tx)).gasPrice);
      let gas_1 = gasprice_1.mul(gasused_1);

      // console.log(before_refund_1.toString(), web3.utils.toWei("0.01", "ether"), gas_1.toString());
      
      assert.equal((await web3.eth.getBalance(accounts[1])).toString(), before_refund_1.add(new web3.utils.BN(web3.utils.toWei("0.01", "ether"))).sub(gas_1).toString());

      let recept_2 = await obj.refund_after_deadline({gas: 140000, from: accounts[2]});
      let gasused_2 = new web3.utils.BN(recept_2.receipt.gasUsed);
      let gasprice_2 = new web3.utils.BN((await web3.eth.getTransaction(recept_2.tx)).gasPrice);
      let gas_2 = gasprice_2.mul(gasused_2);

      assert.equal((await web3.eth.getBalance(accounts[2])).toString(), before_refund_2.add(new web3.utils.BN(web3.utils.toWei("0.1", "ether"))).sub(gas_2).toString());
    })
  })
})

contract('Donation', accounts => {
  describe('open -> donate -> cancel and refund', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.5", "ether"),     // upper limit
        web3.utils.toWei("0.2", "ether")    // lower limit
        );
    });

    it('donate', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.1", "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0.1", "ether"));
      assert.equal(donation_info[1].length, 1);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[2].length, 1);
      assert.equal(donation_info[2][0], web3.utils.toWei("0.1", "ether"));
    })

    it('cancel and refund', async () => {
      await obj.cancel_and_refund({gas:140000, from: accounts[0]});
    })

  })
})

contract('Donation', accounts => {

  describe('constructor', () => {
    var obj;
    var deadline;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.5", "ether"),     // upper limit
        web3.utils.toWei("0.2", "ether")    // lower limit
        );
      deadline = (await web3.eth.getBlock('latest')).number;
    });

    it("check parameter", async () => {
      let project_info = await obj.get_project_info();
      let donation_info = await obj.get_donation_info();

      // console.log(Donation);
      assert.equal(project_info[0].toString(), String(deadline + 100));
      assert.equal(project_info[1], web3.utils.toWei("0.01", "ether"));
      assert.equal(project_info[2], web3.utils.toWei("0.1", "ether"));
      assert.equal(project_info[3], web3.utils.toWei("0.005", "ether"));
      assert.equal(project_info[4], web3.utils.toWei("0.5", "ether"));
      assert.equal(project_info[5], web3.utils.toWei("0.2", "ether"));

      assert.equal(donation_info[0], 0);
      assert.equal(donation_info[1].length, 0);
      assert.equal(donation_info[2].length, 0);
    })
  })

  describe('donate', () => {
    var obj;
    let first_value = 0.01;
    let another_value = 0.1;
    let second_value = 0.05;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.5", "ether"),     // upper limit
        web3.utils.toWei("0.3", "ether")    // lower limit
        );
    });

    it('nonate less than min', async () => {
      try{
        await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.009", "ether")})
        let err = null;
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], 0);
      assert.equal(donation_info[1].length, 0);
      assert.equal(donation_info[2].length, 0);
    })

    it('nonate more than max', async () => {
      let err = null;
      try{
        await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.11", "ether")});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0", "ether"));
      assert.equal(donation_info[1].length, 0);
      assert.equal(donation_info[2].length, 0);
    })

    if('donate amount is not multiple of unit', async () => {
      let err = null;
      try{
        await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.011", "ether")});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0", "ether"));
      assert.equal(donation_info[1].length, 0);
      assert.equal(donation_info[2].length, 0);

    })

    it('first donate', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei(String(first_value), "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei(String(first_value), "ether"));
      assert.equal(donation_info[1].length, 1);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[2].length, 1);
      assert.equal(donation_info[2][0], web3.utils.toWei(String(first_value), "ether"));
    })

    it('another donate', async () => {
      await obj.donate({gas: 140000, from: accounts[2], value: web3.utils.toWei(String(another_value), "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0].toString(), new web3.utils.BN(web3.utils.toWei(String(first_value), "ether")).add(new web3.utils.BN(web3.utils.toWei(String(another_value), "ether"))).toString());
      assert.equal(donation_info[1].length, 2);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[1][1], accounts[2]);
      assert.equal(donation_info[2].length, 2);
      assert.equal(donation_info[2][0], web3.utils.toWei(String(first_value), "ether"));
      assert.equal(donation_info[2][1], web3.utils.toWei(String(another_value), "ether"));

    })

    it('second donate', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei(String(second_value), "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(web3.utils.fromWei(donation_info[0], "ether"), first_value + another_value + second_value);
      assert.equal(donation_info[1].length, 2);
      assert.equal(donation_info[1][0], accounts[1]);
      assert.equal(donation_info[1][1], accounts[2]);
      assert.equal(donation_info[2].length, 2);
      assert.equal(donation_info[2][0].toString(), new web3.utils.BN(web3.utils.toWei(String(first_value), "ether")).add(new web3.utils.BN(web3.utils.toWei(String(second_value), "ether"))).toString());
      assert.equal(donation_info[2][1].toString(), web3.utils.toWei(String(another_value), "ether"));

    })
  })

  describe('donate over max and upper limit', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("0.3", "ether"),   // upper limit
        web3.utils.toWei("0.2", "ether")    // lower limit
        );
    });
    
    it('total balance is more than max', async () => {

      await obj.donate({gas:140000, from: accounts[3], value: web3.utils.toWei("0.09", "ether")});
      await obj.donate({gas:140000, from: accounts[3], value: web3.utils.toWei("0.05", "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0], web3.utils.toWei("0.1", "ether"));
      assert.equal(donation_info[1].length, 1);
      assert.equal(donation_info[1][0], accounts[3]);
      assert.equal(donation_info[2].length, 1);
      assert.equal(donation_info[2][0].toString(), web3.utils.toWei("0.1", "ether"));
    })

    it('donate more than upper limit', async () => {
      await obj.donate({gas:140000, from: accounts[1], value: web3.utils.toWei("0.1", "ether")});
      await obj.donate({gas:140000, from: accounts[4], value: web3.utils.toWei("0.01", "ether")});
      await obj.donate({gas:140000, from: accounts[5], value: web3.utils.toWei("0.1", "ether")});

      let donation_info = await obj.get_donation_info();

      assert.equal(donation_info[0].toString(), web3.utils.toWei("0.3", "ether"));
      assert.equal(donation_info[1].length, 4);
      assert.equal(donation_info[1][0], accounts[3]);
      assert.equal(donation_info[1][1], accounts[1]);
      assert.equal(donation_info[1][2], accounts[4]);
      assert.equal(donation_info[1][3], accounts[5]);
      assert.equal(donation_info[2].length, 4);
      assert.equal(donation_info[2][0], web3.utils.toWei("0.1", "ether"));
      assert.equal(donation_info[2][1], web3.utils.toWei("0.1", "ether"));
      assert.equal(donation_info[2][2], web3.utils.toWei("0.01", "ether"));
      assert.equal(donation_info[2][3], web3.utils.toWei("0.09", "ether"));
    })
  })

  describe('donate after canceled', () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('donate after canceled', async () => {
      await obj.cancel_and_refund({from: accounts[0]});

      let err = null;
      try{
        await obj.donate({gas:140000, from: accounts[6], value: web3.utils.toWei("0.1", "ether")});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);
      // console.log(err);
    })
  })

  describe('donate after deadline', () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('donate after deadline', async () => {

      // console.log("start", (await web3.eth.getBlock('latest')).number);

      for(var i = 0; i < 99; i++){
        await web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [100],
          id: 123
        }, () => {});
      }
      // console.log("mined 99", (await web3.eth.getBlock('latest')).number);
      await obj.donate({gas:140000, from: accounts[5], value: web3.utils.toWei("0.01", "ether")});
      // donate and mined one block

      // console.log("end", (await web3.eth.getBlock('latest')).number);

      let err = null;
      try{
        await obj.donate({gas:140000, from: accounts[5], value: web3.utils.toWei("0.1", "ether")});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);
      // console.log(err);
    })
  })

  describe('cancel and refund', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('cancel and refund', async () => {
      assert.fail();
    })

    it('no donor', async () => {
      assert.fail();
    })

    it('after deadline', async () => {
      assert.fail();
    })

    it('after cancel', async () => {
      assert.fail();
    })

  })

  describe('withdraw', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('before deadline', async () => {
      await obj.donate({gas: 140000, from: accounts[1], value: web3.utils.toWei("0.1", "ether")});

      let err = null;
      try{
        await obj.withdraw({gas:140000, from: accounts[0]});
      } catch(error) {
        err = error;
      }

      assert.isNotNull(err);
      // console.log(err);
    })

    it('after deadline by recipient', async () => {
      assert.fail();
    })

    it('after cancel by not recipient', async () => {
      assert.fail();
    })

    it('after cancel', async () => {
      assert.fail();
    })
    
  })

  describe('refund', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('refund', async () => {
      assert.fail();
    })

    it('after deadline', async () => {
      assert.fail();
    })

    it('no donate', async () => {
      assert.fail();
    })

    it('no enough', async () => {
      assert.fail();
    })

    it('after cancel', async () => {
      assert.fail();
    })
    
  })

  describe('is passed term', async () => {
    var obj;

    before(async () => {
      obj = await Donation.new(
        100, // term
        web3.utils.toWei("0.01", "ether"),  // min
        web3.utils.toWei("0.1", "ether"),   // max
        web3.utils.toWei("0.005", "ether"), // unit
        web3.utils.toWei("1", "ether"),     // upper limit
        web3.utils.toWei("0.5", "ether")    // lower limit
        );
    });

    it('term', async () => {

      for(var i = 0; i < 99; i++){
        await web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [100],
          id: 123
        }, () => {});
      }

      let ret = await obj.check_passed_term();
      assert.equal(ret, false);

      await web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [100],
        id: 123
      }, () => {});

      let ret2 = await obj.check_passed_term();
      assert.equal(ret2, true);
    })
  })

});
