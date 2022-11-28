import hardhat from "hardhat";
const { ethers } = hardhat;
import { expect } from "chai";
const { expectRevert, time } = require('@openzeppelin/test-helpers');
import { Contract } from "@ethersproject/contracts";
import { start } from "repl";
import { BigNumber } from "ethers";

let deployer: any;
let account1: any;
let account2: any;

before(async function () {
  [deployer, account1, account2] =
	await ethers.getSigners();
});

let coc: Contract;
let vesting: Contract;
let initialBlock: number;
let timestamp;
// Vesting Details
const startBlock = 20;
const initialFund = ethers.utils.parseEther("10000");
const depositAmount = ethers.utils.parseEther("1000");
const initialBaseReward = ethers.utils.parseEther("0.00001");
const initialRewardAfterOneMonth = ethers.utils.parseEther("0.0001");
const initialRewardAfterThreeMonths = ethers.utils.parseEther("0.001");
const initialRewardAfterSixMonths = ethers.utils.parseEther("0.001");
const initialRewardAfterOneYear = ethers.utils.parseEther("0.01");
const secondBaseReward = ethers.utils.parseEther("0.00005");
const secondRewardAfterOneMonth = ethers.utils.parseEther("0.0005");
const secondRewardAfterThreeMonths = ethers.utils.parseEther("0.005");
const secondRewardAfterSixMonths = ethers.utils.parseEther("0.05");
const secondRewardAfterOneYear = ethers.utils.parseEther("0.5");

describe.only("Testing Vesting contract", async () => {
  	describe("Setup", async () => {
		it("should deploy COC", async () => {
			const COCFactory = await ethers.getContractFactory("COC");
			coc = await COCFactory.deploy("COC", "COC", 18, 3, 3);

			await coc.transfer(account1.address, ethers.utils.parseEther("10000000"));
			await coc.transfer(account2.address, ethers.utils.parseEther("10000000"));
		})

	  	it("should deploy Vesting", async () => {
			  initialBlock = await ethers.provider.getBlockNumber();
			const factory = await ethers.getContractFactory("COCVesting");
			vesting = await factory.deploy(coc.address, initialBlock + startBlock, initialBaseReward,
				initialRewardAfterOneMonth, initialRewardAfterThreeMonths, initialRewardAfterSixMonths, initialRewardAfterOneYear);

			await coc.excludeFromFee(vesting.address);
	  	})

		
		it("rewards after deploy are correct", async () => {
			const baseReward = await vesting.rewardsBase();
			const afterOneMonth = await vesting.rewardsAfterOneMonth();
			const afterThreeMonths = await vesting.rewardsAfterThreeMonths();
			const afterSixMonths = await vesting.rewardsAfterSixMonths();
			const afterOneYear = await vesting.rewardsAfterOneYear();

			expect(baseReward).to.be.equal(initialBaseReward);
			expect(afterOneMonth).to.be.equal(initialRewardAfterOneMonth);
			expect(afterThreeMonths).to.be.equal(initialRewardAfterThreeMonths);
			expect(afterSixMonths).to.be.equal(initialRewardAfterSixMonths);
			expect(afterOneYear).to.be.equal(initialRewardAfterOneYear);
		})

	  	it("should fund Vesting with 10000 COC", async () => {
			await coc.approve(vesting.address, initialFund);
			await vesting.fund(initialFund);
	  	})

	  	it("Vesting has 10000 COC", async () => {
			const balance = await coc.balanceOf(vesting.address);

			expect(balance.toString()).to.be.equal(initialFund);
	  	})

	  	it("available rewards are correct", async () => {
			const available = await vesting.availableRewards();

			expect(available).to.be.equal(initialFund);
	  	})

	  	it("users cannot deposit before start block", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await expectRevert(vesting.connect(account1).deposit(depositAmount, 2), "VM Exception while processing transaction: reverted with reason string 'COCVesting: cannot deposit yet'");
	 	 })

	  	it("time passes...", async () => {

			const current = await ethers.provider.getBlockNumber();
			const block = await ethers.provider.getBlock(current);
			timestamp = block.timestamp + 3;

			for(let i = 0; i < startBlock; i++) {
				await ethers.provider.send('evm_mine', [timestamp]);
				timestamp = timestamp + 3
			}
	  	})
  	})

  describe("Testing deposits", async () => {
	  	const days = 2;
	  	let lockId: any;

		it("Account1 deposits 1000 COC", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, days);
		})

		it("Vesting COC Balance is 11000", async () => {
			const balance = await coc.balanceOf(vesting.address);
			const expected = ethers.utils.parseEther("11000");

			expect(balance.toString()).to.be.equal(expected);
		})

		it("deposited COC for account1 is correct", async () => {
			const deposited = await vesting.depositedCoc(account1.address);	

			expect(deposited).to.be.equal(depositAmount)
		})

		it("lock id is 0", async () => {
			lockId = await vesting.locksByAddress(account1.address, 0);
			
			expect(lockId).to.be.equal(0);
		})

		it("lock 0 is correct", async () => {
			const lock = await vesting.locks(lockId);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(2 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(initialBaseReward);
			expect(lock.amount).to.be.equal(depositAmount);
		})

	  	it("Account1 cannot withdraw before 2 days", async () => {
		  	await expectRevert(vesting.connect(account1).withdraw(lockId), "COCVesting: COC still locked");
	  	})
  })

  describe("Testing withdraw", async () => {
	  	const lockId = 0;
	  	let expectedRewards: any;

	  	it("time passes...", async () => {
		  	const threeDays = 3 * 24 * 60 * 60;
			const current = await ethers.provider.getBlockNumber()
			const block = await ethers.provider.getBlock(current)
			const timestamp = block.timestamp

		  	await ethers.provider.send('evm_mine', [timestamp + threeDays]);
	  	})

	  	it("Account2 cannot withdraw funds of account1", async () => {
			await expectRevert(vesting.connect(account2).withdraw(lockId), "COCVesting: not your lock");
	  	})

	  	it("Account1 withdraws", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(lockId);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			expectedRewards = depositAmount.mul(initialBaseReward).mul(2).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})

	  	it("available rewards are correct", async () => {
			const available = await vesting.availableRewards();

			expect(available).to.be.equal(initialFund.sub(expectedRewards));
		})

		it("deposited COC for account1 is correct", async () => {
			const deposited = await vesting.depositedCoc(account1.address);	

			expect(deposited.toString()).to.be.equal('0')
		})

		it("Account1 cannot withdraw multiple times", async () => {
			await expectRevert(vesting.connect(account1).withdraw(lockId), "COCVesting: lock already claimed");
		})
  	})

	describe("Testing reward change", async () => {
		it("Only owner can change rewards", async () => {
			await expectRevert(vesting.connect(account2).setBaseReward(secondBaseReward), "Ownable: caller is not the owner");
			await expectRevert(vesting.connect(account2).setRewardsAfterOneMonth(secondRewardAfterOneMonth), "Ownable: caller is not the owner");
			await expectRevert(vesting.connect(account2).setRewardsAfterThreeMonths(secondRewardAfterThreeMonths), "Ownable: caller is not the owner");
			await expectRevert(vesting.connect(account2).setRewardsAfterSixMonths(secondRewardAfterSixMonths), "Ownable: caller is not the owner");
			await expectRevert(vesting.connect(account2).setRewardsAfterOneYear(secondRewardAfterOneYear), "Ownable: caller is not the owner");
		})

		it("owner change rewards", async () => {
			await vesting.connect(deployer).setBaseReward(secondBaseReward);
			await vesting.connect(deployer).setRewardsAfterOneMonth(secondRewardAfterOneMonth);
			await vesting.connect(deployer).setRewardsAfterThreeMonths(secondRewardAfterThreeMonths);
			await vesting.connect(deployer).setRewardsAfterSixMonths(secondRewardAfterSixMonths);
			await vesting.connect(deployer).setRewardsAfterOneYear(secondRewardAfterOneYear);
		})

		it("rewards after change are correct", async () => {
			const baseReward = await vesting.rewardsBase();
			const afterOneMonth = await vesting.rewardsAfterOneMonth();
			const afterThreeMonths = await vesting.rewardsAfterThreeMonths();
			const afterSixMonths = await vesting.rewardsAfterSixMonths();
			const afterOneYear = await vesting.rewardsAfterOneYear();

			expect(baseReward).to.be.equal(secondBaseReward);
			expect(afterOneMonth).to.be.equal(secondRewardAfterOneMonth);
			expect(afterThreeMonths).to.be.equal(secondRewardAfterThreeMonths);
			expect(afterSixMonths).to.be.equal(secondRewardAfterSixMonths);
			expect(afterOneYear).to.be.equal(secondRewardAfterOneYear);
		})
	})

	describe("Testing multiple deposits", async () => {
		const firstDeposit = ethers.utils.parseEther("1000");
		const secondDeposit = ethers.utils.parseEther("5000");
		const firstDay = 10;
		const secondDay = 50;

		it("Account2 first deposit", async () => {
			await coc.connect(account2).approve(vesting.address, firstDeposit);
			await vesting.connect(account2).deposit(firstDeposit, firstDay);
		})

		it("deposited COC for account2 is correct", async () => {
			const deposited = await vesting.depositedCoc(account2.address);	

			expect(deposited.toString()).to.be.equal(firstDeposit)
		})

		it("Account2 second deposit", async () => {
			await coc.connect(account2).approve(vesting.address, secondDeposit);
			await vesting.connect(account2).deposit(secondDeposit, secondDay);
		})

		it("deposited COC for account2 is correct", async () => {
			const deposited = await vesting.depositedCoc(account2.address);	
			const expected = firstDeposit.add(secondDeposit);

			expect(deposited).to.be.equal(expected)
		})

		it("Lock 1 and 2 are made from account2", async () => {
			expect(await vesting.isLockOfAddress(1, account2.address)).to.be.true;
			expect(await vesting.isLockOfAddress(2, account2.address)).to.be.true;
			expect(await vesting.isLockOfAddress(1, account1.address)).to.be.false;
			expect(await vesting.isLockOfAddress(2, account1.address)).to.be.false;
		})

		it("Account2 cannot withdraw", async () =>{
			await expectRevert(vesting.connect(account2).withdraw(1), "COCVesting: COC still locked");
			await expectRevert(vesting.connect(account2).withdraw(2), "COCVesting: COC still locked");
		})

		it("Account1 cannot withdraw from account2 locks", async () =>{
			await expectRevert(vesting.connect(account1).withdraw(1), "COCVesting: not your lock");
			await expectRevert(vesting.connect(account1).withdraw(2), "COCVesting: not your lock");
		})

		it("time passes...", async () => {
			const offset = 15 * 24 * 60 * 60;

			const current = await ethers.provider.getBlockNumber()
			const block = await ethers.provider.getBlock(current)
			const timestamp = block.timestamp

			await ethers.provider.send('evm_mine', [timestamp + offset]);
		})

		it("Account2 can withdraw from lock 1", async () => {
			const cocBefore = await coc.balanceOf(account2.address);
			await vesting.connect(account2).withdraw(1);
			const cocAfter = await coc.balanceOf(account2.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = firstDeposit.mul(secondBaseReward).mul(firstDay).div(divider);
			const expected = cocBefore.add(firstDeposit).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
		})

		it("deposited COC for account2 is correct", async () => {
			const deposited = await vesting.depositedCoc(account2.address);	

			expect(deposited.toString()).to.be.equal(secondDeposit);
		})

		it("Account2 cannot withdraw", async () =>{
			await expectRevert(vesting.connect(account2).withdraw(2), "COCVesting: COC still locked");
		})

		it("Account1 cannot withdraw from account2 locks", async () =>{
			await expectRevert(vesting.connect(account1).withdraw(2), "COCVesting: not your lock");
		})

		it("time passes...", async () => {
			const offset = 55 * 24 * 60 * 60;

			const current = await ethers.provider.getBlockNumber()
			const block = await ethers.provider.getBlock(current)
			const timestamp = block.timestamp

		  	await ethers.provider.send('evm_mine', [timestamp + offset]);
		})

		it("Account2 can withdraw from lock 2", async () => {
			const cocBefore = await coc.balanceOf(account2.address);
			await vesting.connect(account2).withdraw(2);
			const cocAfter = await coc.balanceOf(account2.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = secondDeposit.mul(secondRewardAfterOneMonth).mul(secondDay).div(divider);
			const expected = cocBefore.add(secondDeposit).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
		})

		it("deposited COC for account2 is correct", async () => {
			const deposited = await vesting.depositedCoc(account2.address);	

			expect(deposited.toString()).to.be.equal('0')
		})

		it("Account2 cannot withdraw multiple times", async () => {
			await expectRevert(vesting.connect(account2).withdraw(1), "COCVesting: lock already claimed");
			await expectRevert(vesting.connect(account2).withdraw(2), "COCVesting: lock already claimed");
		})

		it("locks id are stored correctly", async () => {
			const locks = await vesting.getLocksIdByAddress(account2.address);

			expect(locks[0]).to.be.equal(1);
			expect(locks[1]).to.be.equal(2);
		})
	})

	describe("Testing emergency withdraw", async () => {
		const depositAmount = ethers.utils.parseEther("1000");
		const days = 10;
		const lockId = 3;

		it("Account1 deposits 1000 COC", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, days);
		})

		it("15 days passes...", async () => {
			const offset = 70 * 24 * 60 * 60;

			const current = await ethers.provider.getBlockNumber()
			const block = await ethers.provider.getBlock(current)
			const timestamp = block.timestamp

		  	await ethers.provider.send('evm_mine', [timestamp + offset]);
		})

		it("Account1 emergency withdraw, no rewards are transferred", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).emergencyWithdraw(lockId);
			const cocAfter = await coc.balanceOf(account1.address);
			// expected = cocBefore + (deposit amount - penalty fee)
			const expected = cocBefore.add(depositAmount);

			expect(cocAfter).to.be.equal(expected);
		})

		it("Account1 cannot claim rewards after emergency withdraw", async () => {
			await expectRevert(vesting.connect(account1).withdraw(lockId), "COCVesting: lock already claimed");
		})

		it("Account2 cannot claim rewards to account1 locks", async () => {
			await expectRevert(vesting.connect(account2).withdraw(lockId), "COCVesting: not your lock");
		})

		it("Account1 has no COC in Vesting", async () => {
			const deposited = await vesting.depositedCoc(account1.address);

			expect(deposited.toNumber()).to.be.equal(0);
		})

		it("locks id are stored correctly", async () => {
			const locks = await vesting.getLocksIdByAddress(account1.address);

			expect(locks.length).to.be.equal(2);
			expect(locks[0]).to.be.equal(0);
			expect(locks[1]).to.be.equal(3);
		})
	})

	describe("Testing rewards withdraw", async () => {
		it("only owner can withdraw rewards", async () => {
			const available = await vesting.availableRewards();

			await expectRevert(vesting.connect(account2).emergencyWithdrawRewards(available), "Ownable: caller is not the owner");
		})

		it("emergency withdraw for rewards is correct", async () => {
			const cocBefore = await coc.balanceOf(deployer.address);
			const available = await vesting.availableRewards();

			// Cannot withdraw more than available rewards
			await expectRevert(vesting.connect(deployer).emergencyWithdrawRewards(available.add(1)), "COCVesting: not enough rewards");

			await vesting.connect(deployer).emergencyWithdrawRewards(available);
			const cocAfter = await coc.balanceOf(deployer.address);
			const expected = cocBefore.add(available);

			expect(cocAfter).to.be.equal(expected);
		})

		it("available rewards are 0", async () => {
			const available = await vesting.availableRewards();

			expect(available.toNumber()).to.be.equal(0);
		})
	})

	describe("Testing withdraw when rewards are not enough", async () => {
		const depositAmount = ethers.utils.parseEther("100000");
		const days = 365;
		const lockId = 4;
		const fundAmount = ethers.utils.parseEther("100");

		it("fund again vesting for other test", async () => {
			await coc.connect(deployer).approve(vesting.address, fundAmount);
			await vesting.connect(deployer).fund(fundAmount);
		})

		it("Account2 deposits 100000 COC", async () => {
			await coc.connect(account2).approve(vesting.address, depositAmount);
			await vesting.connect(account2).deposit(depositAmount, days);
		})

		it("time passes...", async () => {
			const offset = (71 + days) * 24 * 60 * 60;

			const current = await ethers.provider.getBlockNumber()
			const block = await ethers.provider.getBlock(current)
			const timestamp = block.timestamp

			await ethers.provider.send('evm_mine', [timestamp + offset]);
		})

		it("Account2 withdraws and receive all avaiable rewards", async () => {
			const cocBefore = await coc.balanceOf(account2.address);
			const available = await vesting.availableRewards();
			await vesting.connect(account2).withdraw(lockId);
			const cocAfter = await coc.balanceOf(account2.address);
			const expected = cocBefore.add(available).add(depositAmount);
			const divider = ethers.utils.parseEther("1"); // 1e18
			const optimaRewards = depositAmount.mul(secondRewardAfterOneYear).mul(days).div(divider);

			expect(cocAfter).to.be.equal(expected);
			expect(available).to.be.lt(optimaRewards);
			expect(available).to.be.equal(fundAmount);
		})

		it("available rewards are 0", async () => {
			const available = await vesting.availableRewards();

			expect(available.toNumber()).to.be.equal(0);
		})
	})

	describe("Lock generation with all periods", async () => {
		const depositAmount = ethers.utils.parseEther("1000");
		const fundAmount = ethers.utils.parseEther("10000000000");

		it("fund again vesting for other test", async () => {
			await coc.connect(deployer).approve(vesting.address, fundAmount);
			await vesting.connect(deployer).fund(fundAmount);
		})

		it("generate base reward lock", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, 1);
		})

		it("base lock is correct", async () => {
			const lock = await vesting.locks(5);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(1 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(secondBaseReward);
			expect(lock.amount).to.be.equal(depositAmount);
		})

		it("generate one month lock", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, 30);
		})

		it("one month lock is correct", async () => {
			const lock = await vesting.locks(6);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(30 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(secondRewardAfterOneMonth);
			expect(lock.amount).to.be.equal(depositAmount);
		})

		it("generate three months lock", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, 90);
		})

		it("three months lock is correct", async () => {
			const lock = await vesting.locks(7);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(90 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(secondRewardAfterThreeMonths);
			expect(lock.amount).to.be.equal(depositAmount);
		})

		it("generate six months lock", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, 180);
		})

		it("three months lock is correct", async () => {
			const lock = await vesting.locks(8);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(180 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(secondRewardAfterSixMonths);
			expect(lock.amount).to.be.equal(depositAmount);
		})

		it("generate one year lock", async () => {
			await coc.connect(account1).approve(vesting.address, depositAmount);
			await vesting.connect(account1).deposit(depositAmount, 365);
		})

		it("one year lock is correct", async () => {
			const lock = await vesting.locks(9);

			expect(lock.end.sub(lock.start)).to.be.equal(BigNumber.from(365 * 24 * 60 * 60));
			expect(lock.claimed).to.be.false;
			expect(lock.reward).to.be.equal(secondRewardAfterOneYear);
			expect(lock.amount).to.be.equal(depositAmount);
		})

		it("time passes...", async () => {
			const offset = 110000 * 24 * 60 * 60;
			const timestamp = Math.floor(Date.now() / 1000)

		  	await ethers.provider.send('evm_mine', [timestamp + offset]);
		})

		it("base reward lock withdraw is correct", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(5);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = depositAmount.mul(secondBaseReward).mul(1).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})

		it("one month lock withdraw is correct", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(6);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = depositAmount.mul(secondRewardAfterOneMonth).mul(30).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})

		it("three months lock withdraw is correct", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(7);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = depositAmount.mul(secondRewardAfterThreeMonths).mul(90).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})

		it("six months lock withdraw is correct", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(8);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = depositAmount.mul(secondRewardAfterSixMonths).mul(180).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})

		it("one year lock withdraw is correct", async () => {
			const cocBefore = await coc.balanceOf(account1.address);
			await vesting.connect(account1).withdraw(9);
			const cocAfter = await coc.balanceOf(account1.address);

			const divider = ethers.utils.parseEther("1"); // 1e18
			const expectedRewards = depositAmount.mul(secondRewardAfterOneYear).mul(365).div(divider);
			const expected = cocBefore.add(depositAmount).add(expectedRewards);

			console.log("Rewards:", ethers.utils.formatEther(expectedRewards));

			expect(cocAfter).to.be.equal(expected);
	  	})
	})

	describe("Testing coc address change", async () => {
		const newCoc = ethers.constants.AddressZero;

		it("only owner can change coc", async () => {
			await expectRevert(vesting.connect(account2).changeCoc(newCoc), "Ownable: caller is not the owner");
		})

		it("owner changes coc address", async () => {
			await vesting.connect(deployer).changeCoc(newCoc);
		})

		it("coc address is correct", async () => {
			const address = await vesting.coc();

			expect(address).to.be.equal(newCoc);
		})

		it("restore coc address for other tests", async () => {
			await vesting.connect(deployer).changeCoc(coc.address);
		})
	})

	describe.skip("Testing penalty address change", async () => {
		let initialPenalty: any;

		it("only owner can change penalty address", async () => {
			await expectRevert(vesting.connect(account2).changePenaltyAddress(account2.address), "Ownable: caller is not the owner");
		})

		it("save old penalty address", async () => {
			initialPenalty = await vesting.penaltyAddress();
		})

		it("owner changes penalty address", async () => {
			await vesting.connect(deployer).changePenaltyAddress(account2.address);
		})

		it("penalty address is correct", async () => {
			const address = await vesting.penaltyAddress();

			expect(address).to.be.equal(account2.address);
		})

		it("restore penalty address for other tests", async () => {
			await vesting.connect(deployer).changePenaltyAddress(initialPenalty);
		})
	})

	describe.skip("Testing penalty fee change", async () => {
		let initialPenalty: any;
		const secondPenaltyFee = 100;

		it("only owner can change penalty fee", async () => {
			await expectRevert(vesting.connect(account2).changePenaltyFee(secondPenaltyFee), "Ownable: caller is not the owner");
		})

		it("cannot set a too big fee", async () => {
			await expectRevert(vesting.connect(deployer).changePenaltyFee(10000), "COCVesting: invalid fee");
		})

		it("save old penalty fee", async () => {
			initialPenalty = await vesting.emergencyWithdrawPenalty();
		})

		it("owner changes penalty fee", async () => {
			await vesting.connect(deployer).changePenaltyFee(secondPenaltyFee);
		})

		it("penalty fee is correct", async () => {
			const fee = await vesting.emergencyWithdrawPenalty();

			expect(fee).to.be.equal(secondPenaltyFee);
		})

		it("restore penalty address for other tests", async () => {
			await vesting.connect(deployer).changePenaltyFee(initialPenalty);
		})
	})
});

