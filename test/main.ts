import hardhat, { web3 } from "hardhat";
const { ethers } = hardhat;
import { expect } from "chai";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import { getEventListener } from "events";
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
let referralCode1: string = "referralCode1";
let rateReferralCode1: number = 10;
let referralCode2: string = "referralCode2";
let rateReferralCode2: number = 20;
let referralCode3: string = "referralCode3";
let rateReferralCode3: number = 5;
const holders1 = "0x675CA97b43d7f19374b1FCFD7BadabEdb690864f"; // 70% INITIAL SUPPLY
const holders2 = "0x3825ff8012730F35f7D201b681AC3A14E425a291"; // 10% INITIAL SUPPLY
const holders3 = "0xB3009449c14a2e12851D5eE0E7f70BfaF907De04"; // 10% INITIAL SUPPLY
const holders4 = "0x3Dcc420b0a5fb11e8F7C9933F5514f40AC309C20"; // 10% INITIAL SUPPLY
before(async function () {
  [deployer, account1, account2, account3, account4, account5, accountApprove] =
    await ethers.getSigners();
});

// Set initial con/2st
const name = "Coin of the champion";
const name2 = "Coin of the champion marketing";
const symbol = "COC";
const symbol2 = "COCM";
const decimals = 18;
// const initialSupply : BigNumber = BigNumber.from(10000000000000000)
const taxFee = 3;
const burnFee = 3;
let cocContract: Contract;
let cocMContract: Contract;
let crowdsaleContract: Contract;
const initialSupply: BigNumber = BigNumber.from(1000000000000000).mul(10);
const txAmountReward: BigNumber = BigNumber.from(2500000)
  .mul(1000000000000000)
  .mul(1000);
const maxCap: BigNumber = BigNumber.from(5000000000000)
  .mul(1000000000000000)
  .mul(1000);
const txAmountStakeAccount1: BigNumber = BigNumber.from(100)
  .mul(1000000000000000)
  .mul(1000);
const txAmountStakeAccount2: BigNumber = BigNumber.from(500)
  .mul(1000000000000000)
  .mul(1000);
const txAmountToTransfer: BigNumber = BigNumber.from(200000000000)
  .mul(1000000000000000)
  .mul(1000);
const txAmount2ToDeliver: BigNumber = BigNumber.from(1251231856740).add(1);

// const pricePreSale : BigNumber = BigNumber.from(50000).mul(1000000000000000).mul(1000)
const pricePreSale: BigNumber = BigNumber.from(5)
  .mul(1000000000000000)
  .mul(1000);
const quantityPreSale: BigNumber = BigNumber.from(10000)
  .mul(1000000000000000)
  .mul(1000);
const quantityBuy1: BigNumber = BigNumber.from(100);

const nHolderIncluded = 6;
let blockFirstDeliver: number;
const _TIME_SIX_MONTH = 200;
const _TIME_ONE_MONTH = _TIME_SIX_MONTH / 6;

let StakingFactory: ContractFactory;
let stakingContract: Contract;
let newStakingContract: any;
let stakingContractInstance: Contract;
let owner: String;
let add;

let stakingStarts: any;
let stakingEnds: any;
let withdrawStart: any;

describe.only("Testing COC contract", async () => {
  describe("Testing deploy", async () => {
    // Deploy contract
    it("should deploy COC contract", async () => {
      const CocFactory = await ethers.getContractFactory("COC");
      cocContract = await CocFactory.deploy(
        name,
        symbol,
        decimals,
        taxFee,
        burnFee
      );

      owner = await cocContract.getOwner();
      expect(owner).to.be.equal(deployer.address);
    });
  });

  describe("Staking", () => {
    it("should deploy staking contract", async () => {
      const StakingFactory = await ethers.getContractFactory("Staking");

      let someDate = new Date();
      let startStakingDays = 1;
      let endStakingDays = 10;
      let withdrawStartDays = 375;

      stakingStarts = Math.floor(
        someDate.setDate(someDate.getDate() + startStakingDays) / 1000
      );
      stakingEnds = Math.floor(
        someDate.setDate(someDate.getDate() + endStakingDays) / 1000
      );

      withdrawStart = Math.floor(
        someDate.setDate(someDate.getDate() + withdrawStartDays) / 1000
      );

      const stakingConstructor = [
        "Staking COC 1",
        cocContract.address,
        stakingStarts,
        stakingEnds,
        withdrawStart,
        maxCap,
      ];

      stakingContract = await StakingFactory.deploy(
        stakingConstructor[0],
        stakingConstructor[1],
        stakingConstructor[2],
        stakingConstructor[3],
        stakingConstructor[4],
        stakingConstructor[5]
      );
    });

    it("should exclude staking contract from fee", async () => {
      await cocContract.excludeFromFee(stakingContract.address);
      //await cocContract.excludeFromReward(stakingContract.address);
    });

    it("should add staking contract as admin of coc contract", async function () {
      await cocContract.addAdmin(stakingContract.address);
    });

    let balanceStakingContractAfterAddReward: BigNumber;
    it("should add staking reward", async () => {
      await cocContract.approve(stakingContract.address, txAmountReward);

      const allowanceStakingContractOfDeployer = await cocContract.allowance(
        deployer.address,
        stakingContract.address
      );
      console.log(
        "allowance of coc deployer for staking contract: " +
          ethers.utils.formatEther(allowanceStakingContractOfDeployer)
      );

      const balanceDeployerBeforeAddReward = await cocContract.balanceOf(
        deployer.address
      );
      console.log(
        "balance deployer first add reward " +
          ethers.utils.formatEther(balanceDeployerBeforeAddReward)
      );

      // check balance staking contract before add reward
      const balanceStakingContractBeforeAddReward = await cocContract.balanceOf(
        stakingContract.address
      );

      await stakingContract.addReward(txAmountReward);

      const balanceDeployerAfterAddReward = await cocContract.balanceOf(
        deployer.address
      );

      console.log(
        "balance deployer after add reward " +
          ethers.utils.formatEther(balanceDeployerAfterAddReward)
      );

      expect(balanceDeployerAfterAddReward).to.be.equal(
        balanceDeployerBeforeAddReward.sub(txAmountReward)
      );

      // check balance staking contract after add reward
      balanceStakingContractAfterAddReward = await cocContract.balanceOf(
        stakingContract.address
      );

      console.log(
        "balance staking contract before add reward " +
          ethers.utils.formatEther(balanceStakingContractBeforeAddReward)
      );
      console.log(
        "balance staking contract after add reward " +
          ethers.utils.formatEther(balanceStakingContractAfterAddReward)
      );

      expect(balanceStakingContractAfterAddReward).to.be.equal(
        balanceStakingContractBeforeAddReward.add(txAmountReward)
      );
    });

    let account1BalanceAfterTransfer: BigNumber;
    let account2BalanceAfterTransfer: BigNumber;
    it("should transfer txAmount to account 1 and 2", async function () {
      const account1BalanceBeforeTransfer = await cocContract.balanceOf(
        account1.address
      );
      await cocContract.transfer(account1.address, txAmountStakeAccount1);
      account1BalanceAfterTransfer = await cocContract.balanceOf(
        account1.address
      );
      expect(account1BalanceAfterTransfer).to.be.equal(
        account1BalanceBeforeTransfer.add(txAmountStakeAccount1)
      );

      const account2BalanceBeforeTransfer = await cocContract.balanceOf(
        account2.address
      );
      await cocContract.transfer(account2.address, txAmountStakeAccount2);
      account2BalanceAfterTransfer = await cocContract.balanceOf(
        account2.address
      );
      expect(account2BalanceAfterTransfer).to.be.equal(
        account2BalanceBeforeTransfer.add(txAmountStakeAccount2)
      );
    });

    it("should set block timestamp to stakingStarts", async function () {
      // set block timestamp to staking start
      await hardhat.network.provider.send("evm_setNextBlockTimestamp", [
        stakingStarts,
      ]);

      await hardhat.network.provider.send("evm_mine");
    });

    it("should stake account1", async function () {
      // stake account 1
      await cocContract
        .connect(account1)
        .approve(stakingContract.address, txAmountStakeAccount1);
      await stakingContract.connect(account1).stake(txAmountStakeAccount1);

      const balanceAccount1AfterStake = await cocContract.balanceOf(
        account1.address
      );
      expect(balanceAccount1AfterStake).to.be.equal(
        account1BalanceAfterTransfer.sub(txAmountStakeAccount1)
      );

      const stakeOfAccount1 = await stakingContract.stakeOf(account1.address);
      expect(stakeOfAccount1).to.be.equal(txAmountStakeAccount1);

      // check balance staking contract after stake account 1
      const balanceStakingContractAfterStake1 = await cocContract.balanceOf(
        stakingContract.address
      );

      console.log(
        "balance staking contract after stake1 " +
          ethers.utils.formatEther(balanceStakingContractAfterStake1)
      );

      expect(balanceStakingContractAfterStake1).to.be.equal(
        balanceStakingContractAfterAddReward.add(txAmountStakeAccount1)
      );
    });

    it("should stake account2", async function () {
      // stake account 2
      await cocContract
        .connect(account2)
        .approve(stakingContract.address, txAmountStakeAccount2);
      await stakingContract.connect(account2).stake(txAmountStakeAccount2);

      const balanceAccount2AfterStake = await cocContract.balanceOf(
        account2.address
      );
      expect(balanceAccount2AfterStake).to.be.equal(
        account2BalanceAfterTransfer.sub(txAmountStakeAccount2)
      );

      const stakeOfAccount2 = await stakingContract.stakeOf(account2.address);
      expect(stakeOfAccount2).to.be.equal(txAmountStakeAccount2);

      // check balance staking contract after stake account 2
      const balanceStakingContractAfterStake2 = await cocContract.balanceOf(
        stakingContract.address
      );

      console.log(
        "balance staking contract after stake1 " +
          ethers.utils.formatEther(balanceStakingContractAfterStake2)
      );

      expect(balanceStakingContractAfterStake2).to.be.equal(
        balanceStakingContractAfterAddReward
          .add(txAmountStakeAccount1)
          .add(txAmountStakeAccount2)
      );
    });

    it("should set block timestamp to stakingEnd", async function () {
      // set block timestamp to staking start
      await hardhat.network.provider.send("evm_setNextBlockTimestamp", [
        stakingEnds,
      ]);

      await hardhat.network.provider.send("evm_mine");
    });

    /*
    it('should try stake againg and catch revert', async function () {
      // try stake again account 1 and catch
      await cocContract.transfer(
          account1.address,
          txAmountStakeAccount1
      );
      await cocContract.connect(account1).approve(stakingContract.address, txAmountStakeAccount1)
      await catchRevert(stakingContract.connect(account1).stake(txAmountStakeAccount1));

      await catchRevert(stakingContract.withdraw(txAmountStakeAccount1));

      // try stake againg account 2 and catch
      await cocContract.transfer(
          account2.address,
          txAmountStakeAccount2
      );
      await cocContract.connect(account2).approve(stakingContract.address, txAmountStakeAccount2)
      await catchRevert(stakingContract.connect(account2).stake(txAmountStakeAccount2));

    });
     */

    it("should try withdraw before withdrawStart", async function () {
      await catchRevert(
        stakingContract.connect(account1).withdraw(txAmountStakeAccount1)
      );
      await catchRevert(
        stakingContract.connect(account2).withdraw(txAmountStakeAccount2)
      );
    });

    it("should make some transfer", async function () {
      // make some transfer before withdraw
      await cocContract.transfer(account3.address, txAmountToTransfer);
      await cocContract.transfer(account4.address, txAmountToTransfer);
      await cocContract.transfer(account5.address, txAmountToTransfer);
      await cocContract
        .connect(account3)
        .transfer(account5.address, txAmountToTransfer);

      await cocContract
        .connect(account5)
        .transfer(account4.address, txAmountToTransfer);

      await cocContract
        .connect(account4)
        .transfer(account3.address, txAmountToTransfer);
    });

    it("should set block timestamp to withdrawStart", async function () {
      // set block timestamp to staking start
      await hardhat.network.provider.send("evm_setNextBlockTimestamp", [
        withdrawStart,
      ]);

      await hardhat.network.provider.send("evm_mine");
    });

    it("should withdraw account1", async function () {
      // withdraw account 1
      const balanceOfAccount1BeforeWithdraw = await cocContract.balanceOf(
        account1.address
      );
      await stakingContract.connect(account1).withdraw(txAmountStakeAccount1);
      const balanceOfAccount1AfterWithdraw = await cocContract.balanceOf(
        account1.address
      );

      console.log(
        "balance account1 before withdraw " +
          ethers.utils.formatEther(balanceOfAccount1BeforeWithdraw)
      );
      console.log(
        "balance account1 after withdraw " +
          ethers.utils.formatEther(balanceOfAccount1AfterWithdraw)
      );
    });

    it("should make some transfer", async function () {
      // make some transfer before withdraw
      await cocContract.transfer(account3.address, txAmountToTransfer);
      await cocContract.transfer(account4.address, txAmountToTransfer);
      await cocContract.transfer(account5.address, txAmountToTransfer);
      await cocContract
        .connect(account3)
        .transfer(account5.address, txAmountToTransfer);

      await cocContract
        .connect(account5)
        .transfer(account4.address, txAmountToTransfer);

      await cocContract
        .connect(account4)
        .transfer(account3.address, txAmountToTransfer);
    });

    it("should withdraw account2", async function () {
      // withdraw account 2
      const balanceOfAccount2BeforeWithdraw = await cocContract.balanceOf(
        account2.address
      );
      await stakingContract.connect(account2).withdraw(txAmountStakeAccount2);
      const balanceOfAccount2AfterWithdraw = await cocContract.balanceOf(
        account2.address
      );

      console.log(
        "balance account2 before withdraw " +
          ethers.utils.formatEther(balanceOfAccount2BeforeWithdraw)
      );
      console.log(
        "balance account2 after withdraw " +
          ethers.utils.formatEther(balanceOfAccount2AfterWithdraw)
      );
    });

    it("should check balance staking contract after withdraw", async function () {
      // check balance staking after withdraw and distribution with reflection
      const balanceStakingContractAfterWithdraw = await cocContract.balanceOf(
        stakingContract.address
      );

      console.log(
        "balance staking contract after withdraw " +
          ethers.utils.formatEther(balanceStakingContractAfterWithdraw)
      );
    });
  });

  /*
    describe("Testing approve", async () => {
        it("Approve for account 1 and 2 initial supply", async () => {
            await cocContract.approve(account1.address, initialSupply)
            await cocContract.approve(account2.address, initialSupply)

            const allowanceAccount1 = await cocContract.allowance(deployer.address, account1.address)
            const allowanceAccount2 = await cocContract.allowance(deployer.address, account2.address)
            expect(allowanceAccount1).to.be.equal(initialSupply)
            expect(allowanceAccount2).to.be.equal(initialSupply)
        })
        it("Reset approve for account 1 and 2", async () => {
            await cocContract.approve(account1.address, 0)
            await cocContract.approve(account2.address, 0)

            const allowanceAccount1 = await cocContract.allowance(deployer.address, account1.address)
            const allowanceAccount2 = await cocContract.allowance(deployer.address, account2.address)
            expect(allowanceAccount1).to.be.equal(0)
            expect(allowanceAccount2).to.be.equal(0)

        })
    })

    describe("Testing transfer", async () => {
        it("should transfer txAmount1 from deployer to account2", async () => {
            await cocContract.transfer(account2.address, txAmount1)
            const balanceAccount2 = await cocContract.balanceOf(account2.address);
            expect(balanceAccount2).to.be.equal(txAmount1);
        })
    })

    describe("Testing reflection", async () => {
        it("should transfer txAmount1 from account2 to account3 with reflection", async () => {
            await cocContract.connect(account2).transfer(account3.address, txAmount1)
            const balanceAccount3 = await cocContract.balanceOf(account3.address);
            const fee = txAmount1.div(100).mul(3);
            expect(balanceAccount3).to.be.equal(txAmount1.sub(fee).sub(fee));
        })
    })

    describe("Testing admin role", async () => {
        it("should add account 1 as admin", async () => {
            await cocContract.addAdmin(account1.address);
            const isAdmin = await cocContract.checkIfAdmin(account1.address);
            expect(isAdmin).to.be.true
        })

        it("should remove account 1 as admin", async () => {
            await cocContract.removeAdmin(account1.address);
            const isAdmin = await cocContract.checkIfAdmin(account1.address);
            expect(isAdmin).to.be.false
        })
    })

    describe("Testing pausable", async () => {
        let balanceAccount1First : BigNumber;
        let balanceAccount2First : BigNumber;

        it("should pause contract and try to transfer txAmount2 to account and check", async () => {
            await cocContract.pause();
        })
        it("should transfer txAmount2 to account1 and catch revert", async () => {
            balanceAccount1First = await cocContract.balanceOf(account1.address);
            await catchRevertWithoutReason(cocContract.connect(account2).transfer(account1.address, txAmount1));

            const balanceAccount1After = await cocContract.balanceOf(account1.address);
            expect(balanceAccount1After).to.be.equal(balanceAccount1First)
        })

        it("should unpause contract", async () => {
            await cocContract.unpause();
        })

        it("should transfer all balance of account 3 to account1", async () => {
            const balanceAccount3First = await cocContract.balanceOf(account3.address);
            balanceAccount1First = await cocContract.balanceOf(account1.address);
            await cocContract.connect(account3).transfer(account1.address, balanceAccount3First);

            const balanceAccount1After = await cocContract.balanceOf(account1.address);
            const fee = balanceAccount3First.div(100).mul(3)
            expect(balanceAccount1After).to.be.equal(balanceAccount1First.add(balanceAccount3First).sub(fee).sub(fee))

            const balanceAccount3After = await cocContract.balanceOf(account3.address);
            expect(balanceAccount3After).to.be.equal(0)
        })

        it("should return txAmount2 from account1 to account 3", async () => {
            const balanceAccount3First = await cocContract.balanceOf(account3.address);
            balanceAccount1First = await cocContract.balanceOf(account1.address);
            await cocContract.connect(account1).transfer(account3.address, balanceAccount1First);

            const balanceAccount1After = await cocContract.balanceOf(account1.address);
            expect(balanceAccount1After).to.be.equal(0);

            const balanceAccount3After = await cocContract.balanceOf(account3.address);
            const fee = balanceAccount1First.div(100).mul(3);
            expect(balanceAccount3After).to.be.equal(balanceAccount3First.add(balanceAccount1First).sub(fee).sub(fee))
        })

    })

    describe("Testing blacklist", async () => {

        it("should transfer txAmount1 from deployer to account2 (not blacklisted)", async () => {
            const balanceAccount2First = await cocContract.balanceOf(account2.address);
            await cocContract.transfer(account2.address, txAmount1)
            const balanceAccount2After = await cocContract.balanceOf(account2.address);
            expect(balanceAccount2After).to.be.equal(balanceAccount2First.add(txAmount1));
        })

        it("should add account2 to blacklist", async () => {
            await cocContract.addAddressToBlacklist(account2.address);
            const isBlacklisted = await cocContract.isBlacklisted(account2.address);
            expect(isBlacklisted).to.be.true
        })

        it("should transfer txAmount1 from deployer to account2 (blacklisted) and catch revert", async () => {
            const balanceDeployerFirst = await cocContract.balanceOf(deployer.address);

            await catchRevert(cocContract.transfer(account2.address, txAmount1))
            const balanceDeployerAfter = await cocContract.balanceOf(deployer.address);
            expect(balanceDeployerAfter).to.be.equal(balanceDeployerFirst);
        })

        it("should transfer txAmount1 from account2 (blacklisted) to account 3 and catch revert", async () => {
            const balanceAccount2First = await cocContract.balanceOf(account2.address);
            await catchRevert(cocContract.connect(account2).transfer(account3.address, txAmount1))
            const balanceAccount2After = await cocContract.balanceOf(account2.address);
            expect(balanceAccount2After).to.be.equal(balanceAccount2First);
        })

        it("should remove account2 to blacklist", async () => {
            await cocContract.removeAddressFromBlacklist(account2.address);
            const isBlacklisted = await cocContract.isBlacklisted(account2.address);
            expect(isBlacklisted).to.be.false
        })

        it("should transfer txAmount1 from deployer to account2 (not blacklisted)", async () => {
            const balanceAccount2First = await cocContract.balanceOf(account2.address);
            await cocContract.transfer(account2.address, txAmount1)
            const balanceAccount2After = await cocContract.balanceOf(account2.address);
            expect(balanceAccount2After).to.be.equal(balanceAccount2First.add(txAmount1));
        })

        it("should transfer txAmount1 from account2 (not blacklisted) to account 3", async () => {
            const balanceAccount3First = await cocContract.balanceOf(account3.address);
            const balanceAccount2First = await cocContract.balanceOf(account2.address);
            await cocContract.connect(account2).transfer(account3.address, txAmount1);

            const balanceAccount2After = await cocContract.balanceOf(account2.address);
            expect(balanceAccount2After).to.be.equal(balanceAccount2First.sub(txAmount1));

            const balanceAccount3After = await cocContract.balanceOf(account3.address);
            const fee = txAmount1.div(100).mul(3)
            expect(balanceAccount3After).to.be.equal(balanceAccount3First.add(txAmount1).sub(fee).sub(fee)); // expect txAmount1 -3% fee -3% burn
        })

        it("should add account 1 as admin", async () => {
            await cocContract.addAdmin(account1.address);
            const isAdmin = await cocContract.checkIfAdmin(account1.address);
            expect(isAdmin).to.be.true
        })

        it("should add account2 to blacklist with account 1 (admin)", async () => {
            await cocContract.connect(account1).addAddressToBlacklist(account2.address);
            const isBlacklisted = await cocContract.isBlacklisted(account2.address);
            expect(isBlacklisted).to.be.true
        })
    })
    */
  /*
   it('should get token unlocked for account 4', async () => {
     let tokenUnlocked = await cocMContract.connect(account4).getTokenUnlock();

     expect(tokenUnlocked).to.be.equal(0);
   });

   it('should deliver to account4 with rate 10 with no admin account and catch revert', async () => {
     await catchRevert(cocMContract.connect(account2).deliverToAccountWithRate10(account4.address, txAmount1))
   });

   it('should get info lock of account4 and check', async () => {
     let infoLocked = await cocMContract.getInfoLockedByAddress(account4.address);

     expect(infoLocked[0]).to.be.equal(txAmount1.div(10));
     // expect(infoLocked[1]).to.be.equal(blockFirstDeliver + 1 + _TIME_SIX_MONTH);
     expect(infoLocked[2]).to.be.false;
   });

   it('should deliver 1 token more to address4 and catch error', async () => {
     catchRevert(cocMContract.deliverToAccountWithRate10(account4.address, 1))

     const balanceCocMAccount4 =  await cocMContract.balanceOf(account4.address);

     expect(balanceCocMAccount4).to.be.equal(txAmount1);

     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount1);
   });

   it('should transfer txAmount2 to from deployer to cocM contract and check', async () => {
     await cocContract.transfer(cocMContract.address, txAmount2);

     let balanceCocMContract : any =  await cocContract.balanceOf(cocMContract.address);
     expect(balanceCocMContract).to.be.equal(txAmount2.add(txAmount1));

     balanceCocMContract =  await cocMContract.getCOCLockedInContract();
     expect(balanceCocMContract).to.be.equal(txAmount2.add(txAmount1));
   });

   it('should deliver from account5 (admin) to account3 with rate 5', async () => {
     blockFirstDeliver = await hardhat.web3.eth.getBlockNumber()

     await cocMContract.connect(account5).deliverToAccountWithRate5(account3.address, txAmount2);

     const balanceCocMAccount4 =  await cocMContract.balanceOf(account3.address);

     expect(balanceCocMAccount4).to.be.equal(txAmount2);

     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount2.add(txAmount1));
   });

   it('should get token unlocked for account 3', async () => {
     let tokenUnlocked = await cocMContract.connect(account3).getTokenUnlock();

     expect(tokenUnlocked).to.be.equal(0);
   });

   it('should get info lock of account3 and check', async () => {
     let infoLocked = await cocMContract.getInfoLockedByAddress(account3.address);

     expect(infoLocked[0]).to.be.equal(txAmount2.div(20));
     expect(infoLocked[1]).to.be.equal(blockFirstDeliver + 1 + _TIME_SIX_MONTH);
     expect(infoLocked[2]).to.be.false;
   });

   it('should transfer txAmount2 to from deployer to cocM contract and check', async () => {
     await cocContract.transfer(cocMContract.address, txAmount2ToDeliver);

     let balanceCocMContract : any =  await cocContract.balanceOf(cocMContract.address);
     expect(balanceCocMContract).to.be.equal(txAmount2ToDeliver.add(txAmount1).add(txAmount2));

     balanceCocMContract =  await cocMContract.getCOCLockedInContract();
     expect(balanceCocMContract).to.be.equal(txAmount2ToDeliver.add(txAmount1).add(txAmount2));
   });

   it('should deliver to account2 with rate manual', async () => {
     blockFirstDeliver = await hardhat.web3.eth.getBlockNumber()

     await cocMContract.deliverToAccountManual(account2.address, txAmount2);

     const balanceCocMAccount2 =  await cocMContract.balanceOf(account2.address);

     expect(balanceCocMAccount2).to.be.equal(txAmount2);

     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount2.add(txAmount1).add(txAmount2));
   });

   it('should get token unlocked for account 2', async () => {
     let tokenUnlocked = await cocMContract.getTokenUnlock(account2.address);

     expect(tokenUnlocked).to.be.equal(0);

   });

   it('should get info lock of account2 and check', async () => {
     let infoLocked = await cocMContract.getInfoLockedByAddress(account2.address);

     expect(infoLocked[0]).to.be.equal(txAmount2);
     expect(infoLocked[1]).to.be.equal(0);
     expect(infoLocked[2]).to.be.true;
   });

   it('should unlock swap for account2 and check token unlock', async () => {
     await cocMContract.unlockSwap(account2.address);
     let infoLocked = await cocMContract.getInfoLockedByAddress(account2.address);

     expect(infoLocked[2]).to.be.false;

     let tokenUnlocked = await cocMContract.getTokenUnlock(account2.address);

     expect(tokenUnlocked).to.be.equal(txAmount2);
   });

   it('1th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address);

     expect(tokenUnlockedAccount4).to.be.equal(0);
     expect(tokenUnlockedAccount3).to.be.equal(0);
   });

   it('6th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH*5; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address);

     expect(tokenUnlockedAccount4).to.be.equal(0);
     expect(tokenUnlockedAccount3).to.be.equal(0);
   });

   it('7th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4.div(10));
     expect(tokenUnlockedAccount3).to.be.equal(txAmount2.div(20));
   });

   let tokenUnlock : any;
   it('should swap token for account 3', async () => {
     let balanceCOCMAccount3First = await cocMContract.balanceOf(account3.address);
     tokenUnlock = await cocMContract.getTokenUnlock(account3.address);

     await cocMContract.connect(account3).swapCOCMtoCOC();

     const balanceCOCAccount3 = await cocContract.balanceOf(account3.address);

     expect(balanceCOCAccount3).to.be.equal(tokenUnlock);

     const balanceCOCMAccount3After = await cocMContract.balanceOf(account3.address);
     expect(balanceCOCMAccount3After).to.be.equal(balanceCOCMAccount3First.sub(tokenUnlock));

   });

   it('should check total supply', async () => {
     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount2.add(txAmount2).add(txAmount1).sub(tokenUnlock));
   });

   it('8th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4.div(10).mul(2));
   });

   it('should get token unlocked for account 3', async () => {
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount3).to.be.equal(txAmount2.div(20));
   });

   it('16th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH*8; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4);
     expect(tokenUnlockedAccount3).to.be.equal(txAmount2.div(20).mul(9));
   });

   it('25th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH*9; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4);
     expect(tokenUnlockedAccount3).to.be.equal(txAmount2.div(20).mul(18));
   });

   it('26th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4);
     expect(tokenUnlockedAccount3).to.be.equal(balanceOfAccount3);
   });

   it('32th month', async () => {
     for (let i = 0; i < _TIME_ONE_MONTH*6; i++ ) {
       await hardhat.network.provider.send("evm_mine")
     }
   });

   it('should get token unlocked for account 3/4', async () => {
     const balanceOfAccount4 = await cocMContract.balanceOf(account4.address);
     const balanceOfAccount3 = await cocMContract.balanceOf(account3.address);
     let tokenUnlockedAccount4 = await cocMContract.getTokenUnlock(account4.address);
     let tokenUnlockedAccount3 = await cocMContract.getTokenUnlock(account3.address)

     expect(tokenUnlockedAccount4).to.be.equal(balanceOfAccount4);
     expect(tokenUnlockedAccount3).to.be.equal(balanceOfAccount3);
   });

   it('should swap token for account 4', async () => {
     let balanceCOCMAccount4 = await cocMContract.balanceOf(account4.address);
     const tokenUnlock = await cocMContract.getTokenUnlock(account4.address);

     await cocMContract.connect(account4).swapCOCMtoCOC();

     const balanceCOCAccount4 = await cocContract.balanceOf(account4.address);

     expect(balanceCOCMAccount4).to.be.equal(balanceCOCAccount4);

     balanceCOCMAccount4 = await cocMContract.balanceOf(account4.address);
     expect(balanceCOCMAccount4).to.be.equal(0);
  ;

   });

   it('should check total supply', async () => {
     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount2.add(txAmount2).sub(txAmount2.div(20)))
   });

   it('should swap token for account 3', async () => {
     let balanceCOCMAccount3First = await cocMContract.balanceOf(account3.address);
     tokenUnlock = await cocMContract.getTokenUnlock(account3.address);

     await cocMContract.connect(account3).swapCOCMtoCOC();

     const balanceCOCAccount3 = await cocContract.balanceOf(account3.address);

     expect(balanceCOCAccount3).to.be.equal(tokenUnlock.add(txAmount2.div(20)));

     // const balanceCOCMAccount3After = await cocMContract.balanceOf(account3.address);
     // expect(balanceCOCMAccount3After).to.be.equal(balanceCOCMAccount3First.sub(tokenUnlock));

   });

   it('should check total supply', async () => {
     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(txAmount2);
   });

   it('should swap token for account 2 ( manual )', async () => {
     let balanceCOCMAccount2First = await cocMContract.balanceOf(account2.address);
     let tokenUnlockAccount2 = await cocMContract.getTokenUnlock(account2.address);

     expect(tokenUnlockAccount2).to.be.equal(txAmount2);

     await cocMContract.connect(account2).swapCOCMtoCOC();

     const balanceCOCAccount2 = await cocContract.balanceOf(account2.address);

     expect(balanceCOCAccount2).to.be.equal(tokenUnlockAccount2);

     // const balanceCOCMAccount3After = await cocMContract.balanceOf(account3.address);
     // expect(balanceCOCMAccount3After).to.be.equal(balanceCOCMAccount3First.sub(tokenUnlock));

   });

   it('should check total supply', async () => {
     const totalSupply = await cocMContract.totalSupply();
     expect(totalSupply).to.be.equal(0);
   });

   it('should check COC locked in COCM contract', async () => {
     const balanceCocMContract =  await cocMContract.getCOCLockedInContract();
     expect(balanceCocMContract).to.be.equal(1);
   });

   // it('should exclude account1 from fee', async () => {
   //   await cocContract.excludeFromFee(account1.address);
   //   expect(await cocContract.isExcludedFromFee(account1.address)).to.be.equal(true);
   // });
   //
   // it('should reinclude account1 in fee', async () => {
   //   await cocContract.includeInFee(account1.address);
   //   expect(await cocContract.isExcludedFromFee(account1.address)).to.be.equal(false);
   // });
   //
   // it('should exclude account1 from rewards', async () => {
   //   await cocContract.excludeFromReward(account1.address);
   //   expect(await cocContract.isExcludedFromReward(account1.address)).to.be.equal(true);
   // });
   //
   // it('should reinclude account1 in rewards', async () => {
   //   await cocContract.includeInReward(account1.address);
   //   expect(await cocContract.isExcludedFromReward(account1.address)).to.be.equal(false);
   // });
   //
   // it('should transfer half of initialSupply to account 1', async () => {
   //   await cocContract.transfer(account1.address, initialSupply.div(2))
   //
   //   const balance = await cocContract.balanceOf(account1.address);
   //   expect(balance).to.be.equal(initialSupply.div(2));
   // });
   //
   // it('should transfer 1/4 of initialSupply to account 2', async () => {
   //   await cocContract.transfer(account2.address, initialSupply.div(4))
   //
   //   const balance = await cocContract.balanceOf(account2.address);
   //   expect(balance).to.be.equal(initialSupply.div(4));
   //   const balanceAccount1 = await cocContract.balanceOf(account1.address);
   //   expect(balanceAccount1).to.be.equal(initialSupply.div(2));
   // });
   //
   // it('should transfer 1/8 of initialSupply to account 3', async () => {
   //   await cocContract.transfer(account3.address, initialSupply.div(8))
   //
   //   const balance = await cocContract.balanceOf(account3.address);
   //   expect(balance).to.be.equal(initialSupply.div(8));
   // });
   //
   // it('print all balance', async () => {
   //   const balanceDeployer = await cocContract.balanceOf(deployer.address);
   //   const balance1 = await cocContract.balanceOf(account1.address);
   //   const balance2 = await cocContract.balanceOf(account2.address);
   //   const balance3 = await cocContract.balanceOf(account3.address);
   //   const balance4 = await cocContract.balanceOf(account4.address);
   //   const balance5 = await cocContract.balanceOf(account5.address);
   //   const balanceApprove = await cocContract.balanceOf(accountApprove.address);
   //   console.log("Balance deployer: " + balanceDeployer)
   //   console.log("Balance 1: " + balance1)
   //   console.log("Balance 2: " + balance2)
   //   console.log("Balance 3: " + balance3)
   //   console.log("Balance 4: " + balance4)
   // console.log("Balance 5: " + balance5)
   //   console.log("Balance Approve: " + balanceApprove)
   // });
   //
   // it('should transfer 1/2 of supply of account 1 to account 2', async () => {
   //   const balanceAccount1First : BigNumber = await cocContract.balanceOf(account1.address);
   //   const balanceAccount2First : BigNumber = await cocContract.balanceOf(account2.address);
   //   const balanceAccount3First : BigNumber = await cocContract.balanceOf(account3.address);
   //
   //   // const txAmount : BigNumber = balanceAccount1First.div(2)
   //   await cocContract.connect(account1).transfer(account2.address, txAmount2)
   //
   //   const balanceAccount1After = await cocContract.balanceOf(account1.address);
   //   // Calculate reward for account 1
   //   const feeTotalExpected : BigNumber = txAmount2.div(100).mul(3)
   //   const supply : BigNumber = await cocContract.totalSupply();
   //   const rewardAccount1Expected : BigNumber = balanceAccount1After.mul(feeTotalExpected).div(supply)
   //
   //   const balanceAccount1Expected = balanceAccount1First.sub(txAmount2).add(rewardAccount1Expected)
   //   // expect(balanceAccount1After).to.be.equal(balanceAccount1Expected);
   //
   //   const balanceAccount2After = await cocContract.balanceOf(account2.address);
   //   const rewardAccount2Expected : BigNumber = balanceAccount2After.mul(feeTotalExpected).div(supply)
   //   const balanceAccount2Expected = balanceAccount2First.add(txAmount2).sub(feeTotalExpected).sub(feeTotalExpected).add(rewardAccount2Expected)
   //
   //   // expect(balanceAccount2After).to.be.equal(balanceAccount2Expected);
   //
   //   // const balanceAccount3After = await cocContract.balanceOf(account3.address);
   //   // const rewardAccount3Expected : BigNumber = balanceAccount3After.mul(feeTotalExpected).div(supply)
   //   // const balanceAccount3Expected = balanceAccount3First.add(rewardAccount3Expected)
   //   //
   //   // expect(balanceAccount3After).to.be.equal(balanceAccount3Expected);
   // });
   //
   //
   //









   //
   // // it('should transfer txAmount2 from account2 to account 3', async () => {
   // //   const balanceAccount2 = await cocContract.balanceOf(account2.address);
   // //
   // //   await cocContract.connect(account2).transfer(account3.address, txAmount2)
   // //
   // //   const tFeeTotalExpected = (txAmount2 / 100) * taxFee
   // //   const tFeeSingleExpected = tFeeTotalExpected / nHolderIncluded
   // //   const tBurnExpected = (txAmount2 / 100) * burnFee
   // //
   // //   const balanceAccount2AfterTr = await cocContract.balanceOf(account2.address);
   // //   const balanceAccount2AfterTrNum = hardhat.Web3.utils.hexToNumber(balanceAccount2AfterTr._hex)
   // //   const balanceAccount2Expected =  balanceAccount2 - txAmount2  + tFeeSingleExpected
   // //   const balanceAccount1AfterTr = await cocContract.balanceOf(account1.address);
   // //
   // //   expect(balanceAccount1AfterTr).to.be.equal(balanceAccount2Expected);
   // //   expect(balanceAccount2AfterTrNum).to.be.equal(balanceAccount2Expected);
   // //
   // // });
   // //
   // // it('should approve half balance of account 1 to accountApprove', async () => {
   // //   const balance = await cocContract.balanceOf(account1.address);
   // //
   // //   await cocContract.connect(account1).approve(accountApprove.address, balance/2)
   // //   const allowance = await cocContract.allowance(account1.address, accountApprove.address);
   // //
   // //   expect(allowance).to.be.equal(balance/2);
   // // });
   //
   // // it('should move by accountApprove half allowance of account1 to account4', async () => {
   // //   const allowance = await cocContract.allowance(account1.address, accountApprove.address);
   // //
   // //   const tAmount = allowance / 2
   // //   await cocContract.connect(accountApprove).transferFrom(account1.address, account4.address, tAmount)
   // //   const tFeeExpected = (tAmount / 100) * taxFee
   // //   const tBurnExpected = (tAmount / 100) * burnFee
   // //
   // //   const balanceAccount4 = await cocContract.balanceOf(account4.address)
   // //   const balanceAccount4Expected =  hardhat.Web3.utils.hexToNumber(balanceAccount4._hex)  - tFeeExpected - tBurnExpected
   // //   expect(balanceAccount4).to.be.equal(balanceAccount4Expected)
   // //
   // //   const allowanceAfterTransfer = await cocContract.allowance(account1.address, accountApprove.address);
   // //
   // //   expect(allowanceAfterTransfer).to.be.equal(allowance - tAmount);
   // // });
   //
   // // it('should try move by accountApprove double allowance of account1 to account4 and check error', async () => {
   // //   const allowance = await cocContract.allowance(account1.address, accountApprove.address);
   // //
   // //   await catchRevert(cocContract.connect(accountApprove).transferFrom(account1.address, account4.address, allowance*2))
   // // });
   //
   // it('should increase allowance of accountApprove for account1', async () => {
   //   const balanceAccount1 = await cocContract.balanceOf(account1.address);
   //   const initialAllowance = await cocContract.allowance(account1.address, accountApprove.address);
   //   const quantityToIncrease = balanceAccount1 - initialAllowance
   //
   //   await cocContract.connect(account1).increaseAllowance(accountApprove.address, quantityToIncrease)
   //
   //   const newAllowance = await cocContract.allowance(account1.address, accountApprove.address);
   //   const newAllowanceExpected = hardhat.Web3.utils.hexToNumber(initialAllowance._hex) + quantityToIncrease
   //   expect(newAllowance).to.be.equal(newAllowanceExpected)
   // });
   //
   // it('should decrease allowance of accountApprove for account1', async () => {
   //   const initialAllowance = await cocContract.allowance(account1.address, accountApprove.address);
   //
   //   await cocContract.connect(account1).decreaseAllowance(accountApprove.address, initialAllowance/2)
   //
   //   const newAllowance = await cocContract.allowance(account1.address, accountApprove.address);
   //   expect(newAllowance).to.be.equal(initialAllowance/2)
   // });

  
});

describe("Testing COCM contract", async () => {
  let now = Math.trunc(Date.now() / 1000);

  it("should deploy COCM contract", async () => {
    const CocMFactory = await ethers.getContractFactory("COCM");
    cocMContract = await CocMFactory.deploy(
      name2,
      symbol2,
      decimals,
      cocContract.address
    );

    const owner = await cocMContract.getOwner();
    expect(owner).to.be.equal(deployer.address);
  });

  it("should exclude cocM from fee", async () => {
    await cocContract.excludeFromFee(cocMContract.address);
    expect(
      await cocContract.isExcludedFromFee(cocMContract.address)
    ).to.be.equal(true);
  });

  it("should set new admin address and check", async () => {
    await cocMContract.addAdmin(account5.address);

    let isAdmin = await cocMContract.checkIfAdmin(account5.address);
    expect(isAdmin).to.be.true;

    isAdmin = await cocMContract.checkIfAdmin(account1.address);
    expect(isAdmin).to.be.false;
  });

  it("should remove admin address5 and check", async () => {
    await cocMContract.removeAdmin(account5.address);

    let isAdmin = await cocMContract.checkIfAdmin(account5.address);
    expect(isAdmin).to.be.false;
  });

  it("should reset admin address5 and check", async () => {
    await cocMContract.addAdmin(account5.address);

    let isAdmin = await cocMContract.checkIfAdmin(account5.address);
    expect(isAdmin).to.be.true;
  });

  it("should transfer txAmount 1 to from deployer to cocM contract", async () => {
    await cocContract.transfer(cocMContract.address, txAmount1);

    const balanceCocMContract = await cocContract.balanceOf(
      cocMContract.address
    );
    expect(balanceCocMContract).to.be.equal(txAmount1);
  });

  it("should check COC locked in COCM contract", async () => {
    const balanceCocMContract = await cocMContract.getCOCLockedInContract();
    expect(balanceCocMContract).to.be.equal(txAmount1);
  });

  it("should deliver to account4 with rate 10", async () => {
    blockFirstDeliver = await hardhat.web3.eth.getBlockNumber();

    await cocMContract.deliverToAccountWithRate10(account4.address, txAmount1);

    const balanceCocMAccount4 = await cocMContract.balanceOf(account4.address);
    expect(balanceCocMAccount4).to.be.equal(txAmount1);

    const totalSupply = await cocMContract.totalSupply();
    expect(totalSupply).to.be.equal(txAmount1);
  });
});

describe("Testing Crowdsale contract", async () => {
  let now = Math.trunc(Date.now() / 1000);

  describe("Testing deploy", async () => {
    it("should deploy Crowdsale contract", async () => {
      const CrowdsaleFactory = await ethers.getContractFactory("Crowdsale");
      crowdsaleContract = await CrowdsaleFactory.deploy(cocContract.address);

      const owner = await crowdsaleContract.owner();
      expect(owner).to.be.equal(deployer.address);
    });

    it("should exclude Crowdsale contract from fee of coc", async () => {
      await cocContract.excludeFromFee(crowdsaleContract.address);
      expect(
        await cocContract.isExcludedFromFee(crowdsaleContract.address)
      ).to.be.equal(true);
    });
  });

  // describe("Testing whitelisting", async () => {
  //     it("should be add account4 to whitelist", async ()=> {
  //         await crowdsaleContract.addAddressToWhitelist(account4.address);
  //
  //         const isWhiteListed = await crowdsaleContract.isWhitelisted(account4.address);
  //         expect(isWhiteListed).to.be.equal
  //     })
  //
  //     it("should be add account3 to whitelist", async ()=> {
  //         await crowdsaleContract.addAddressToWhitelist(account3.address);
  //
  //         const isWhiteListed = await crowdsaleContract.isWhitelisted(account3.address);
  //         expect(isWhiteListed).to.be.equal
  //     })
  //
  //     it("should be add account1 to whitelist", async ()=> {
  //         await crowdsaleContract.addAddressToWhitelist(account1.address);
  //
  //         const isWhiteListed = await crowdsaleContract.isWhitelisted(account1.address);
  //         expect(isWhiteListed).to.be.equal
  //     })
  //
  //     it("should be add account5 to whitelist", async ()=> {
  //         await crowdsaleContract.addAddressToWhitelist(account5.address);
  //
  //         const isWhiteListed = await crowdsaleContract.isWhitelisted(account5.address);
  //         expect(isWhiteListed).to.be.equal
  //     })
  //
  //     it("should be remove account5 to whitelist", async ()=> {
  //         await crowdsaleContract.addAddressToWhitelist(account4.address);
  //
  //         const isWhiteListed = await crowdsaleContract.isWhitelisted(account4.address);
  //         expect(isWhiteListed).to.be.equal
  //     })
  // })

  describe("Testing sale", async () => {
    let balanceFirstCreateSale: BigNumber;

    describe("Open sale", async () => {
      it("should set account 1 as admin", async () => {
        await crowdsaleContract.addAdmin(account1.address);
        const isAdmin = await crowdsaleContract.checkIfAdmin(account1.address);
        expect(isAdmin).to.be.true;
      });

      it("should transfer quantity1token from deployer ( admin and owner ) to account 1 ( admin )", async () => {
        const result = await cocContract.transfer(
          account1.address,
          quantityPreSale
        );
      });

      it("should approve quantity1token for crowdsale contract", async () => {
        const result = await cocContract
          .connect(account1)
          .approve(crowdsaleContract.address, quantityPreSale);
      });

      it("should open a new sale with account 1 ( admin )", async () => {
        now = Math.trunc(Date.now() / 1000);
        balanceFirstCreateSale = await cocContract.balanceOf(account1.address);
        const result = await crowdsaleContract
          .connect(account1)
          .createSale(now + 100, now + 3000, quantityPreSale, pricePreSale);
      });

      it("should check balance of account 1 after create sale", async () => {
        const balance = await cocContract.balanceOf(account1.address);
        expect(balance).to.be.equal(
          balanceFirstCreateSale.sub(quantityPreSale)
        );
      });

      it("should get info sale", async () => {
        const infoLastSale = await crowdsaleContract.getInfoSale(1);
        expect(infoLastSale.startDate).to.be.equal(now + 100);
        expect(infoLastSale.endDate).to.be.equal(now + 3000);
        expect(infoLastSale.quantity).to.be.equal(quantityPreSale);
        expect(infoLastSale.price).to.be.equal(pricePreSale);
      });

      it("should open new sale and catch revert", async () => {
        let now = Math.trunc(Date.now() / 1000);
        await catchRevert(
          crowdsaleContract
            .connect(account1)
            .createSale(now + 100, now + 3000, quantityPreSale, pricePreSale)
        );
      });
    });

    describe("Force close", async () => {
      it("should force close with account 1 (admin ) and check", async () => {
        await crowdsaleContract.connect(account1).forceClose();
        const infoSale = await crowdsaleContract.getInfoSale(1);

        expect(infoSale.startDate).to.be.equal(now + 100);
        // expect(infoSale.endDate).to.be.equal(now + 3000)
        expect(infoSale.quantity).to.be.equal(0);
        expect(infoSale.price).to.be.equal(pricePreSale);
      });

      it("should check balance of account1 after force close", async () => {
        const balance = await cocContract.balanceOf(account1.address);
        expect(balance).to.be.equal(balanceFirstCreateSale);
      });
    });

    describe("Reopen sale", async () => {
      it("should approve quantity1token for crowdsale contract", async () => {});

      it("should open a new sale", async () => {
        await cocContract
          .connect(account1)
          .approve(crowdsaleContract.address, quantityPreSale);

        now = Math.trunc(Date.now() / 1000);
        balanceFirstCreateSale = await cocContract.balanceOf(account1.address);
        await crowdsaleContract
          .connect(account1)
          .createSale(now + 100, now + 3000, quantityPreSale, pricePreSale);

        const lastSaleIndex = await crowdsaleContract.getLastSaleIndex();
        const infoSale = await crowdsaleContract.getInfoSale(lastSaleIndex);
        expect(infoSale.quantity).to.be.equal(quantityPreSale);
      });
    });

    let valueSend: BigNumber;
    describe("Buy token", async () => {
      it("should buy quantity 1 of token with account 4", async () => {
        for (let i = 0; i < 1000; i++) {
          await hardhat.network.provider.send("evm_mine");
        }

        const infoSaleFirst = await crowdsaleContract.getInfoSale(2);
        let balanceAccount4First = await cocContract.balanceOf(
          account4.address
        );

        valueSend = pricePreSale
          .mul(quantityBuy1)
          .div(10 ** 15)
          .div(10 ** 3);
        await crowdsaleContract
          .connect(account4)
          .buy(quantityBuy1._hex, "", { value: valueSend });

        let balanceAccount4After: BigNumber = await cocContract.balanceOf(
          account4.address
        );
        expect(balanceAccount4After).to.be.equal(
          balanceAccount4First.add(quantityBuy1)
        );

        const infoSale = await crowdsaleContract.getInfoSale(2);
        expect(infoSale.quantity).to.be.equal(
          infoSaleFirst.quantity.sub(quantityBuy1)
        );
      });

      it("Check balance contract", async () => {
        let balanceContract = await crowdsaleContract.getBalance();
        expect(balanceContract).to.be.equal(valueSend);
      });
    });
  });

  describe("Testing referrals", async () => {
    describe("Add referralCode", async () => {
      it("Add referral code 1 associated with account 4", async () => {
        await crowdsaleContract.addReferralCode(
          account4.address,
          referralCode1,
          rateReferralCode1
        );

        let referralCodeAccount4: string[] =
          await crowdsaleContract.getReferralCodeByAddress(account4.address);
        expect(referralCodeAccount4.length).to.be.equal(1);

        let referralCode1Info = await crowdsaleContract.getReferralCodeInfo(
          referralCode1
        );
        expect(referralCode1Info.referralAddress).to.be.equal(account4.address);
        expect(referralCode1Info.rate).to.be.equal(rateReferralCode1);
        expect(referralCode1Info.active).to.be.true;
      });

      it("Add referral code that already exist and catch revert", async () => {
        await catchRevert(
          crowdsaleContract.addReferralCode(
            account5.address,
            referralCode1,
            rateReferralCode1
          )
        );
      });

      it("Disable referral code", async () => {
        await crowdsaleContract.disableReferralCode(referralCode1);
        let referralCode1Info = await crowdsaleContract.getReferralCodeInfo(
          referralCode1
        );
        expect(referralCode1Info.referralAddress).to.be.equal(account4.address);
        expect(referralCode1Info.rate).to.be.equal(10);
        expect(referralCode1Info.active).to.be.false;
      });

      it("Add referral code that already exist but after close it and catch revert", async () => {
        await catchRevert(
          crowdsaleContract.addReferralCode(
            account4.address,
            referralCode1,
            rateReferralCode1
          )
        );
      });

      it("Add referral code 2 associated with account 4", async () => {
        await crowdsaleContract.addReferralCode(
          account4.address,
          referralCode2,
          rateReferralCode2
        );

        let referralCodeAccount4: string[] =
          await crowdsaleContract.getReferralCodeByAddress(account4.address);
        expect(referralCodeAccount4.length).to.be.equal(2);

        let referralCode1Info = await crowdsaleContract.getReferralCodeInfo(
          referralCode2
        );
        expect(referralCode1Info.referralAddress).to.be.equal(account4.address);
        expect(referralCode1Info.rate).to.be.equal(rateReferralCode2);
        expect(referralCode1Info.active).to.be.true;
      });

      it("Add referral code 3 associated with account 5", async () => {
        await crowdsaleContract.addReferralCode(
          account5.address,
          referralCode3,
          rateReferralCode3
        );

        let referralCodeAccount5: string[] =
          await crowdsaleContract.getReferralCodeByAddress(account5.address);
        expect(referralCodeAccount5.length).to.be.equal(1);

        let referralCode1Info = await crowdsaleContract.getReferralCodeInfo(
          referralCode3
        );
        expect(referralCode1Info.referralAddress).to.be.equal(account5.address);
        expect(referralCode1Info.rate).to.be.equal(rateReferralCode3);
        expect(referralCode1Info.active).to.be.true;
      });
    });

    describe("Buy token with referralCode", async () => {
      let balanceAfterBuyTokenWithReferrals: BigNumber;
      let valueBnbSend1: BigNumber;
      it("should buy quantity 1 of token with account 3 and referralCode2", async () => {
        for (let i = 0; i < 1000; i++) {
          await hardhat.network.provider.send("evm_mine");
        }

        const infoSaleFirst = await crowdsaleContract.getInfoSale(2);
        let balanceAccount3First = await cocContract.balanceOf(
          account3.address
        );

        valueBnbSend1 = pricePreSale
          .mul(quantityBuy1)
          .div(10 ** 15)
          .div(10 ** 3);
        await crowdsaleContract
          .connect(account3)
          .buy(quantityBuy1._hex, "referralCode2", { value: valueBnbSend1 });

        let balanceAccount3After: BigNumber = await cocContract.balanceOf(
          account3.address
        );
        expect(balanceAccount3After).to.be.equal(
          balanceAccount3First.add(quantityBuy1)
        );

        const infoSale = await crowdsaleContract.getInfoSale(2);
        expect(infoSale.quantity).to.be.equal(
          infoSaleFirst.quantity.sub(quantityBuy1)
        );
      });

      let expectedBnbEarned: BigNumber;
      it("should check bnb earn by owner of referralCode2", async () => {
        let referralCodeInfo = await crowdsaleContract.getReferralCodeInfo(
          referralCode2
        );

        let bnbEarned = await crowdsaleContract.getBnbEarnedByAddress(
          referralCodeInfo.referralAddress
        );
        expectedBnbEarned = valueBnbSend1.div(100).mul(referralCodeInfo.rate);
        expect(bnbEarned).to.be.equal(expectedBnbEarned);
      });

      it("Check balance contract", async () => {
        let balanceContract = await crowdsaleContract.getBalance();
        console.log("value bnb send");
        console.log(hardhat.Web3.utils.hexToNumber(valueBnbSend1._hex));
        console.log("expected bnb earned");
        console.log(hardhat.Web3.utils.hexToNumber(expectedBnbEarned._hex));
        expect(balanceContract).to.be.equal(
          valueBnbSend1.sub(expectedBnbEarned)
        );
      });

      it("should buy quantity 1 of token with account 1 and referralCode3", async () => {
        const infoSaleFirst = await crowdsaleContract.getInfoSale(2);
        let balanceAccount1First = await cocContract.balanceOf(
          account1.address
        );

        valueBnbSend1 = pricePreSale
          .mul(quantityBuy1)
          .div(10 ** 15)
          .div(10 ** 3);
        await crowdsaleContract
          .connect(account1)
          .buy(quantityBuy1._hex, "referralCode3", { value: valueBnbSend1 });

        let balanceAccount1After: BigNumber = await cocContract.balanceOf(
          account1.address
        );
        expect(balanceAccount1After).to.be.equal(
          balanceAccount1First.add(quantityBuy1)
        );

        const infoSale = await crowdsaleContract.getInfoSale(2);
        expect(infoSale.quantity).to.be.equal(
          infoSaleFirst.quantity.sub(quantityBuy1)
        );
      });

      it("should check bnb earn by owner of referralCode3", async () => {
        let referralCodeInfo = await crowdsaleContract.getReferralCodeInfo(
          referralCode3
        );

        let bnbEarned = await crowdsaleContract.getBnbEarnedByAddress(
          referralCodeInfo.referralAddress
        );
        let expectedBnbEarned = valueBnbSend1
          .div(100)
          .mul(referralCodeInfo.rate);
        expect(bnbEarned).to.be.equal(expectedBnbEarned);
      });
    });
  });

  describe("Testing withdraw", async () => {
    it("should mine some block and close the sale with passing end date", async () => {
      for (let i = 0; i < 3000 + 50; i++) {
        await hardhat.network.provider.send("evm_mine");
      }
    });

    it("should withdraw token / or force close", async () => {
      let infoSale = await crowdsaleContract.getInfoSale(2);
      expect(infoSale.quantity).to.be.equal(
        quantityPreSale.sub(quantityBuy1).sub(quantityBuy1).sub(quantityBuy1)
      );

      let balanceAccount1First = await cocContract.balanceOf(account1.address);
      // await crowdsaleContract.connect(account1).forceClose();
      const lastSaleIndex = crowdsaleContract.getLastSaleIndex();
      await crowdsaleContract.connect(account1).withdrawToken(lastSaleIndex);
      let balanceAccount1After = await cocContract.balanceOf(account1.address);
      expect(balanceAccount1After).to.be.equal(
        balanceAccount1First.add(infoSale.quantity)
      );
      infoSale = await crowdsaleContract.getInfoSale(2);
      expect(infoSale.quantity).to.be.equal(0);
    });

    it("should withdraw bnb of sale", async () => {
      await crowdsaleContract.connect(account1).withdrawBNB();
    });

    it("should withdraw bnb of referral account4 ", async () => {
      let bnbBalanceAccount4First: BigNumber = await account4.getBalance();
      let bnbEarned = await crowdsaleContract.getBnbEarnedByAddress(
        account4.address
      );
      let result = await crowdsaleContract
        .connect(account4)
        .withdrawReferralBNB();

      let bnbBalanceAccount4After: BigNumber = await account4.getBalance();
      // expect(bnbBalanceAccount4After).to.be.equal(bnbBalanceAccount4First.sub(result.gasPrice).add(bnbEarned)) // todo fix with gas price
      let bnbEarnedAfter = await crowdsaleContract.getBnbEarnedByAddress(
        account4.address
      );
      expect(bnbEarnedAfter).to.be.equal(0);
    });

    it("should try again withdraw bnb of referrals account4 and catch revert", async () => {
      await catchRevert(
        crowdsaleContract.connect(account4).withdrawReferralBNB()
      );
    });

    it("should withdraw bnb of referral account5 ", async () => {
      let bnbBalanceAccount5First: BigNumber = await account5.getBalance();
      let bnbEarned = await crowdsaleContract.getBnbEarnedByAddress(
        account5.address
      );
      let result = await crowdsaleContract
        .connect(account5)
        .withdrawReferralBNB();

      let bnbBalanceAccount5After: BigNumber = await account5.getBalance();
      // expect(bnbBalanceAccount5After).to.be.equal(bnbBalanceAccount5First.sub(result.gasPrice).add(bnbEarned)) // todo fix with gas price
      let bnbEarnedAfter = await crowdsaleContract.getBnbEarnedByAddress(
        account5.address
      );
      expect(bnbEarnedAfter).to.be.equal(0);
    });

    it("should try again withdraw bnb of referrals ( account4 ) and catch revert", async () => {
      await catchRevert(
        crowdsaleContract.connect(account4).withdrawReferralBNB()
      );
    });
  });
  */
});
