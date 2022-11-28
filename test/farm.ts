import hardhat, { web3 } from "hardhat";
const { ethers } = hardhat;
import { expect } from "chai";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import { getEventListener } from "events";
import exp from "constants";
import { eventNames, execPath } from "process";
import { start } from "repl";
let catchRevert = require("./utils/exceptions.ts").catchRevert;
let catchRevertWithoutReason =
  require("./utils/exceptions.ts").catchRevertWithoutReason;

let deployer: any;
let account1: any;
let account2: any;
let account3: any;
let account4: any;
let account5: any;
let accountApprove: any;

before(async function () {
  [deployer, account1, account2, account3, account4, account5, accountApprove] =
    await ethers.getSigners();
});

// COC Details
const name = "Coin of the champion";
const symbol = "COC";
const decimals = 18;
const taxFee = 3;
const burnFee = 3;

// Farm details
const rewardPerBlock = BigNumber.from(web3.utils.toWei("1", "ether"));
const startBlockOffset = 20;
const cocPoolAllocationPoint = 100;
const cocAvailableRewards = BigNumber.from(web3.utils.toWei("100", "ether"));

let farmContract: Contract;
let cocContract: Contract;
let cocLPContract: Contract;
let farmingStartingBlock: any;
let farmingEndingBlock: any;

let cocPoolId: any;
let cumulativeTimestamp: any;

describe.only("Testing Farm contract", async () => {
  describe("Testing deploy", async () => {
    // Deploy contract
    it("should deploy Farm contract", async () => {
      let blockNumber = await ethers.provider.getBlockNumber();
      farmingStartingBlock = blockNumber + startBlockOffset;
      farmingEndingBlock = farmingStartingBlock;

      let farmFactory = await ethers.getContractFactory("Farm");
      let cocFactory = await ethers.getContractFactory("COC");
      let testlpFactory = await ethers.getContractFactory("testLP");

      cocContract = await cocFactory.deploy(
        name,
        symbol,
        decimals,
        taxFee,
        burnFee
      );

      farmContract = await farmFactory.deploy(
        cocContract.address,
        rewardPerBlock,
        farmingStartingBlock
      );

      await cocContract.excludeFromFee(farmContract.address);

      cocLPContract = await testlpFactory.deploy();

      let owner = await farmContract.owner();
      expect(owner).to.be.equal(deployer.address);

      // Transfers COC LP to account1 and account2
      let lpAmount1 = web3.utils.toWei("100", "ether");
      let lpAmount2 = web3.utils.toWei("200", "ether");
      await cocLPContract.connect(deployer).transfer(account1.address, lpAmount1);
      await cocLPContract.connect(deployer).transfer(account2.address, lpAmount2);
    });

    // Checks that constructor initialises correctly the contract
    it("deployment is correct", async () => {
      let startingBlock = await farmContract.startBlock();
      let endingBlock = await farmContract.endBlock();
      let farmToken = await farmContract.erc20();
      
      expect(startingBlock).to.be.equal(farmingStartingBlock);
      expect(endingBlock).to.be.equal(farmingStartingBlock);
      expect(farmToken).to.be.equal(cocContract.address);
    });
  });

  // Checks the initial state of the contract
  describe("Testing intial farm state", async () => {
    it("pool lenght is zero", async () => {
      let poolLength = await farmContract.poolLength();

      expect(poolLength).to.be.equal(0);
    });

    it("paid rewards is zero", async () => {
      let paidRewards = await farmContract.paidOut();

      expect(paidRewards).to.be.equal(0);
    });

    it("allocation point sum is zero", async () => {
      let totAllocPoints = await farmContract.totalAllocPoint();

      expect(totAllocPoints).to.be.equal(0);
    });
  });

  // Checks insertion of the first LP pool
  describe("Testing COC LP insertion in the farm", async () => {
    it("only owner can add COC LP to the farm", async () => {
      await expect(farmContract.connect(account5).add(cocPoolAllocationPoint, cocLPContract.address, false)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Add COC LP to the farm", async () => {
      await farmContract.connect(deployer).add(cocPoolAllocationPoint, cocLPContract.address, false);

      cocPoolId = 0;
    });

    it("Check that pool informations are correct", async () => {
      let poolInfo = await farmContract.poolInfo(cocPoolId);

      expect(poolInfo["lpToken"]).to.be.equal(cocLPContract.address);
      expect(poolInfo["allocPoint"]).to.be.equal(cocPoolAllocationPoint);
      expect(poolInfo["lastRewardBlock"]).to.be.equal(farmingStartingBlock);
      expect(poolInfo["accERC20PerShare"]).to.be.equal(0);
    });

    it("Total pending rewards are zero", async () => {
      let pending = await farmContract.totalPending();

      expect(pending).to.be.equal(0);
    });
  });

  // Checks farm funding
  describe("Testing farm funding", async () => {
    it("approve COC", async () => {
      await cocContract.connect(deployer).approve(farmContract.address, cocAvailableRewards);
    });

    it("add COC to the farm", async () => {
      await farmContract.connect(deployer).fund(cocAvailableRewards);
    });

    it("endBlock is now 200", async () => {
      let endBlock = await farmContract.endBlock();
      let expectedBlock = farmingEndingBlock + 100; // farminEndingBlock + (available rewards / block reward)

      expect(endBlock.toNumber()).to.be.equal(expectedBlock);
    });
  })

  // User deposits COC LP tokens in the farm
  describe("Testing COC LP deposits", async () => {
    // Checks that the pool info are correct once the 
    // first user deposits lp tokens
    describe("First account deposit", async () => {
      const lpAmount = web3.utils.toWei("100", "ether");
      
      it("account1 approve 100 CPC LP", async () => {
        await cocLPContract.connect(account1).approve(farmContract.address, lpAmount);
      });

      it("account1 deposits 100 CPC LP", async () => {
        await farmContract.connect(account1).deposit(cocPoolId, lpAmount);
      });
  
      it("Deposit event has been emitted", async () => {
        let eventFilter = farmContract.filters.Deposit();
        let events = await farmContract.queryFilter(eventFilter, "latest");
        let event = events[0]["args"];

        let eventCaller = event!["user"];
        let eventPool = event!["pid"];
        let eventAmont = event!["amount"];

        expect(eventCaller).to.be.equal(account1.address);
        expect(eventPool).to.be.equal(cocPoolId);
        expect(eventAmont).to.be.equal(lpAmount);
      }); 

      it("account1 deposit info are correct", async () => {
        let deposited = await farmContract.deposited(cocPoolId, account1.address);
        let userInfo = await farmContract.userInfo(cocPoolId, account1.address);

        expect(deposited.toString()).to.be.equal(lpAmount);
        expect(userInfo["amount"].toString()).to.be.equal(lpAmount);
        expect(userInfo["rewardDebt"].toString()).to.be.equal("0");
      });

      it("Total pending rewards are correct before farm starts", async () => {
        let totalPending = await farmContract.totalPending();
        let userPending = await farmContract.pending(cocPoolId, account1.address);

        expect(totalPending.toNumber()).to.be.equal(0);
        expect(userPending.toNumber()).to.be.equal(0);
      });

      // setting the timestamp is not really needed, it's just a parameter
      // needed by the send method to not mess up tests
      it("farming starts...", async () => { 
        let startBlock = await farmContract.startBlock();
        let blockNumber = await ethers.provider.getBlockNumber();
        let blocksToAdvance = startBlock.toNumber() - blockNumber;

        cumulativeTimestamp = Math.floor(Date.now() / 1000) + 10;
        for (let i = 0; i < blocksToAdvance; i++) {
          await ethers.provider.send('evm_mine', [cumulativeTimestamp]);
          cumulativeTimestamp += 10;
        }
      });

      it("10 blocks passes...", async () => {
        for (let i = 0; i < 10; i++) {
          await ethers.provider.send('evm_mine', [cumulativeTimestamp]);
          cumulativeTimestamp += 10;
        }

        let startBlock = await farmContract.startBlock();
        let blockNumber = await ethers.provider.getBlockNumber();
        let diff = blockNumber - startBlock.toNumber();
        
        expect(diff).to.be.equal(10);
      });

      it("total pending rewards are correct", async () => {
        let pending = await farmContract.totalPending();
        let expected = web3.utils.toWei("10", "ether");

        expect(pending.toString()).to.be.equal(expected);
      });

      it("account1 pending rewards are correct", async () => {
        let pending = await farmContract.pending(cocPoolId, account1.address);
        let expected = web3.utils.toWei("10", "ether");

        expect(pending.toString()).to.be.equal(expected);
      });

      it("accumulated COC per share before pool update is correct", async () => {
        let poolInfo = await farmContract.poolInfo(cocPoolId);
        let effectiveShare = poolInfo["accERC20PerShare"];
        let expectedShare = "0"; 

        expect(effectiveShare.toString()).to.be.equal(expectedShare);
      });

      it("update pool info", async () => {
        await farmContract.connect(deployer).updatePool(cocPoolId);
      })

      it("accumulated COC per share is correct", async () => {
        let poolInfo = await farmContract.poolInfo(cocPoolId);
        let effectiveShare = poolInfo["accERC20PerShare"];
        let expectedShare = "110000000000000000000000000000000000"; // 0.11 ether * 1e18

        expect(effectiveShare.toString()).to.be.equal(expectedShare);
      });
    });

    // Checks that the pool info are correct with multiple users
    describe("Second account deposit", async () => {
      const lpAmount = web3.utils.toWei("200", "ether");
      let depositBlock: any;
      let shareBeforeUpdate: any;
      
      it("account1 approve 200 CPC LP", async () => {
        await cocLPContract.connect(account2).approve(farmContract.address, lpAmount);
      });

      it("account2 deposits 200 CPC LP", async () => {
        await farmContract.connect(account2).deposit(cocPoolId, lpAmount);

        depositBlock = await ethers.provider.getBlockNumber();
      });
  
      it("Deposit event has been emitted", async () => {
        let eventFilter = farmContract.filters.Deposit();
        let events = await farmContract.queryFilter(eventFilter, "latest");
        let event = events[0]["args"];

        let eventCaller = event!["user"];
        let eventPool = event!["pid"];
        let eventAmont = event!["amount"];

        expect(eventCaller).to.be.equal(account2.address);
        expect(eventPool).to.be.equal(cocPoolId);
        expect(eventAmont).to.be.equal(lpAmount);
      });

      it("account2 deposit info are correct", async () => {
        let deposited = await farmContract.deposited(cocPoolId, account2.address);
        let userInfo = await farmContract.userInfo(cocPoolId, account2.address);

        expect(deposited.toString()).to.be.equal(lpAmount);
        expect(userInfo["amount"].toString()).to.be.equal(lpAmount);
        expect(userInfo["rewardDebt"].toString()).to.be.equal("26000000000000000000"); //// 0.13 * 200 * 1e18 
      });

      it("10 blocks passes...", async () => {
        for (let i = 0; i < 10; i++) {
          await ethers.provider.send('evm_mine', [cumulativeTimestamp]);
          cumulativeTimestamp += 10;
        }
      });

      it("Total pending rewards are correct", async () => {
        let pending = await farmContract.totalPending();

        let blockNumber = await ethers.provider.getBlockNumber();
        let startBlock = await farmContract.startBlock();
        let blockAfterStart = blockNumber - startBlock;

        let expected = rewardPerBlock.mul(blockAfterStart);

        expect(pending).to.be.equal(expected);
      });

      it("update pool info", async () => {
        let poolInfo = await farmContract.poolInfo(cocPoolId);
        shareBeforeUpdate = poolInfo["accERC20PerShare"];

        await farmContract.connect(account2).updatePool(cocPoolId);
      });

      it("accumulated COC per share is correct", async () => {
        let poolInfo = await farmContract.poolInfo(cocPoolId);
        let effectiveShare = poolInfo["accERC20PerShare"];

        let blockNumber = await ethers.provider.getBlockNumber();
        let blockAfterLastReward = blockNumber - depositBlock;

        let lpSupply = await cocLPContract.balanceOf(farmContract.address); // Should be 300 COC LP
        expect(lpSupply.toString()).to.be.equal(web3.utils.toWei("300", "ether"));

        let multiplier = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
        let expectedShare = rewardPerBlock.mul(blockAfterLastReward).mul(BigNumber.from(multiplier)).div(lpSupply).add(shareBeforeUpdate);

        expect(effectiveShare.toString()).to.be.equal(expectedShare);
      });

      it("account2 pending rewards are correct", async () => {
        let pending = await farmContract.pending(cocPoolId, account2.address);
        
        let poolInfo = await farmContract.poolInfo(cocPoolId);
        let effectiveShare = poolInfo["accERC20PerShare"];
        
        let userInfo = await farmContract.userInfo(cocPoolId, account2.address);
        let rewardDebt = userInfo["rewardDebt"];

        let multiplier = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
        let expected = effectiveShare.mul(lpAmount).div(multiplier).sub(rewardDebt);

        expect(pending).to.be.equal(expected);
      });
    });
    
  });

  // Test withdraw method
  describe("Testing withdraws", async () => {
    const lpAmount = web3.utils.toWei("100", "ether");

    let cocBalanceBefore: any;
    let accShareBeforeUpdate: any;
    let withdrawBlock: any;

    it("save current account1 COC balance", async () => {
      cocBalanceBefore = await cocContract.balanceOf(account1.address);
    });

    it("account1 withdraws from farm", async () => {
      await farmContract.connect(account1).withdraw(cocPoolId, lpAmount);

      withdrawBlock = await ethers.provider.getBlockNumber();
    });

    it("account1 rewards are correct", async () => {
      let cocBalanceAfter = await cocContract.balanceOf(account1.address);
      let cocDiff = cocBalanceAfter.sub(cocBalanceBefore);

      let poolInfo = await farmContract.poolInfo(cocPoolId);
      accShareBeforeUpdate = poolInfo["accERC20PerShare"];
      let divider = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
      let expected = accShareBeforeUpdate.mul(lpAmount).div(divider);

      expect(cocDiff).to.be.equal(expected);
    });

    it("account1 COC LP balance is correct", async () => {
      let lpBalanceAfter = await cocLPContract.balanceOf(account1.address);

      expect(lpBalanceAfter).to.be.equal(lpAmount);
    });

    it("update pool info", async () => {
      await farmContract.connect(deployer).updatePool(cocPoolId);
    });

    it("accumulated reward share is correct", async () => {
      let poolInfo = await farmContract.poolInfo(cocPoolId);
      let effectiveShare = poolInfo["accERC20PerShare"];

      let blockNumber = await ethers.provider.getBlockNumber();
      let blockAfterLastReward = blockNumber - withdrawBlock;

      let lpSupply = await cocLPContract.balanceOf(farmContract.address); // Should be 200 COC LP
      expect(lpSupply.toString()).to.be.equal(web3.utils.toWei("200", "ether"));

      let multiplier = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
      let expectedShare = rewardPerBlock.mul(blockAfterLastReward).mul(BigNumber.from(multiplier)).div(lpSupply).add(accShareBeforeUpdate);

      expect(effectiveShare.toString()).to.be.equal(expectedShare);
    });
  });

  // Mine blocks until the farming period ends
  describe("Farming ends...", async () => {

    it("time passes...", async () => {
      let endBlock = await farmContract.endBlock();
      let blockBumber = await ethers.provider.getBlockNumber(); 
      let toPass = endBlock.toNumber() - blockBumber + 1;

      for (let i = 0; i < toPass; i++) {
        await ethers.provider.send('evm_mine', [cumulativeTimestamp]);
        cumulativeTimestamp += 10;
      }
    });
  });

  // account2 withdraws a partial amount of his COC LP
  describe("Testing withdraws after farming has ended", async () => {
    const lpToWithdraw = BigNumber.from(web3.utils.toWei("100", "ether"));
    const lpDeposited = BigNumber.from(web3.utils.toWei("200", "ether"));

    let cocBalanceBefore: any;
    let accShareBeforeUpdate: any;
    let withdrawBlock: any;
    let rewardDebtBefore: any;

    it("save current account2 COC balance", async () => {
      cocBalanceBefore = await cocContract.balanceOf(account2.address);
    });

    it("account2 withdraws from farm", async () => {
      let userInfo = await farmContract.userInfo(cocPoolId, account2.address);
      rewardDebtBefore = userInfo["rewardDebt"];

      await farmContract.connect(account2).withdraw(cocPoolId, lpToWithdraw);

      withdrawBlock = await ethers.provider.getBlockNumber();
    });

    it("account2 rewards are correct", async () => {
      let cocBalanceAfter = await cocContract.balanceOf(account2.address);
      let cocDiff = cocBalanceAfter.sub(cocBalanceBefore);

      let poolInfo = await farmContract.poolInfo(cocPoolId);
      accShareBeforeUpdate = poolInfo["accERC20PerShare"];

      let divider = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
      let expected = lpDeposited.mul(accShareBeforeUpdate).div(divider).sub(rewardDebtBefore);

      expect(cocDiff).to.be.equal(expected);
    });

    it("account2 COC LP balance is correct", async () => {
      let lpBalanceAfter = await cocLPContract.balanceOf(account2.address);

      expect(lpBalanceAfter).to.be.equal(lpToWithdraw); // 100 COC LP
    });

    it("accumulated reward share is correct", async () => {
      let poolInfo = await farmContract.poolInfo(cocPoolId);
      let effectiveShare = poolInfo["accERC20PerShare"];

      let blockNumber = await ethers.provider.getBlockNumber();
      let blockAfterLastReward = blockNumber - withdrawBlock;

      let lpSupply = await cocLPContract.balanceOf(farmContract.address); // Should be 100 COC LP
      expect(lpSupply.toString()).to.be.equal(web3.utils.toWei("100", "ether"));

      let multiplier = "1000000000000000000000000000000000000"; // needed due to overflow, 1e36
      let expectedShare = rewardPerBlock.mul(blockAfterLastReward).mul(BigNumber.from(multiplier)).div(lpSupply).add(accShareBeforeUpdate);

      expect(effectiveShare.toString()).to.be.equal(expectedShare);
    });
  });

  // Testing emergency withdraw
  describe("Testing emergency withdraw", async () => {
    let cocBalance: any;
    let cocLpBalance: any;

    it("save account2 balances", async () => {
      cocBalance = await cocContract.balanceOf(account2.address);
      cocLpBalance = await cocLPContract.balanceOf(account2.address);
    });

    it("account2 calls emergency withdraw", async () => {
      await farmContract.connect(account2).emergencyWithdraw(cocPoolId);
    });

    it("COC balance didn't change", async () => {
      let cocBalanceAfter = await cocContract.balanceOf(account2.address);
      let cocBalanceDiff = cocBalanceAfter.sub(cocBalance);

      expect(cocBalanceDiff.toString()).to.be.equal("0");
    });

    it("COC LP balance is correct", async () => {
      let cocLpBalanceAfter = await cocLPContract.balanceOf(account2.address);
      let cocLpBalanceDiff = cocLpBalanceAfter.sub(cocLpBalance);
      let expected = web3.utils.toWei("100", "ether");

      expect(cocLpBalanceDiff.toString()).to.be.equal(expected);
    });
  });

});

