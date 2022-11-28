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
import { parse } from "path/posix";
let catchRevert = require("./utils/exceptions.ts").catchRevert;
let catchRevertWithoutReason =
  require("./utils/exceptions.ts").catchRevertWithoutReason;

let deployer: any;
let account1: any;
let account2: any;
let admin: any;
let farm: Contract;
let vault: Contract;
let coc: Contract;
const treasury = "0x000000000000000000000000000000000000dEaD";
const farmFund = ethers.utils.parseEther("1000");
const blockReward = ethers.utils.parseEther("1"); // Adjust block reward here
const startingBlock = 50; // Defines starting date for calculating the rewardì
const depositAmount = ethers.utils.parseEther("1000");
const poolId = 0;

before(async function () {
  [deployer, account1, account2, admin] =
    await ethers.getSigners();
});

describe("Testing COC Vault", async () => {
    describe("Setup", async () => {
        it("Should deploy COC", async () => {
            const COCFactory = await ethers.getContractFactory("COC");
            coc = await COCFactory.deploy("COC", "COC", 18, 3, 3);
            console.log("COC Address:", coc.address);

            await coc.transfer(account1.address, ethers.utils.parseEther("10000000"));
            await coc.transfer(account2.address, ethers.utils.parseEther("10000000"));
        })

        it("Should deploy MasterChef", async () => {
            const farmFactory = await ethers.getContractFactory("CocMasterChef");
            farm = await farmFactory.deploy(coc.address, blockReward, startingBlock);
            console.log("Masterchef addres:", farm.address);

            await coc.excludeFromFee(farm.address);
        })

        it("Should deploy COC Vault", async () => {
            const autoCocFactory = await ethers.getContractFactory("AutoCOC");
            vault = await autoCocFactory.deploy(coc.address, farm.address, admin.address, treasury);
            console.log("COC Vault deployed at:", vault.address);

            await coc.excludeFromFee(vault.address);
        })

        it("Should fund the farm", async () => {
            await coc.approve(farm.address, farmFund);
            await farm.fund(farmFund);
        })

        it("Vault is deployed correctly", async () => {
            const effAdmin = await vault.admin();
            const effTreasury = await vault.treasury();
            const effMasterChef = await vault.masterchef();
            const effToken = await vault.token();
            const effReceiptToken = await vault.receiptToken();

            expect(effAdmin).to.be.equal(admin.address);
            expect(effTreasury).to.be.equal(treasury);
            expect(effMasterChef).to.be.equal(farm.address);
            expect(effToken).to.be.equal(coc.address);
            expect(effReceiptToken).to.be.equal(coc.address);
        })

        it("Starting block is correct", async () => {
            const effStartBlock = await farm.startBlock();
            console.log("Start block:", effStartBlock.toString());
            expect(effStartBlock.toNumber()).to.be.equal(startingBlock);
        })

        it("End block is correct", async () => {
            const effStartBlock = await farm.startBlock();
            const effEndBlock = await farm.endBlock();
            const expectedEndBlock = effStartBlock.add(farmFund.div(blockReward));

            console.log("Effective end block:", effEndBlock.toString());
            console.log("Expected end block:", expectedEndBlock.toString());
            expect(effEndBlock).to.be.equal(expectedEndBlock);
        })

        it("Block rewards is correct", async () => {
            const reward = await farm.cakePerBlock();
            console.log("Reward per block is", ethers.utils.formatEther(reward));
            expect(reward.toString()).to.be.equal(blockReward)
        })

        it("Pool is correct", async () => {
            const pool = await farm.poolInfo(poolId);

            expect(pool.lpToken).to.be.equal(coc.address);
            expect(pool.allocPoint.toString()).to.be.equal('1000');
            expect(pool.lastRewardBlock.toNumber()).to.be.equal(startingBlock);
        })
    })

    describe("Testing deposits before start block", async () => {
        it("Account1 deposits 1000 COC", async () => {
            await coc.connect(account1).approve(vault.address, depositAmount);
            await vault.connect(account1).deposit(depositAmount);
        })

        it("Account1 share are correct", async () => {
            const info = await vault.userInfo(account1.address);
            const totalShares = await vault.totalShares();

            expect(info.shares.toString()).to.be.equal(depositAmount);
            expect(info.shares).to.be.equal(totalShares);
        })

        it("MasterChef COC balance is correct", async () => {
            let balance = await coc.balanceOf(farm.address);
            balance = balance.sub(farmFund);

            expect(balance.toString()).to.be.equal(depositAmount);
        })

        it("Vault COC balance is correct", async () => {
            const balance = await coc.balanceOf(vault.address);

            expect(balance.toString()).to.be.equal('0');
        })

        it("Pending rewards are zero", async () => {
            const pending = await vault.calculateTotalPendingCocRewards();

            expect(pending.toString()).to.be.equal('0');
        })
    })

    describe("Checking rewards with a single address", async () => {
        it("10 blocks passes...", async () => {
            for (let i = 0; i < 10; i++) {
                await ethers.provider.send('evm_mine', []);
            }

            const tenDays = 8 * 24 * 60 * 60;
            const blockNumber = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNumber);
            console.log(blockNumber)
            await ethers.provider.send('evm_mine', [block.timestamp + tenDays]);
        })

        it("Pending rewards are correct", async () => {
            const pending = await vault.calculateTotalPendingCocRewards();
            const balance = await vault.balanceOf();
        })

        it("Account1 withdraws", async () => {
            const expectedRewards = blockReward.mul(11); // 11 blocks * block reward
            
            const oldBalance = await coc.balanceOf(account1.address);
            await vault.connect(account1).withdraw(depositAmount);
            const newBalance = await coc.balanceOf(account1.address);
            const rewards = newBalance.sub(oldBalance).sub(depositAmount);

            console.log("Withdrawn rewards:", ethers.utils.formatEther(rewards.toString()));
        })

        it("Treasury has no rewards", async () => {
            const balance = await coc.balanceOf(treasury);

            expect(balance.toNumber()).to.be.equal(0);
        })

        it("Vault has rewards", async () => {
            const vBal = await coc.balanceOf(vault.address);
            const fBal = await coc.balanceOf(farm.address);

            console.log("Vault COC balance:", ethers.utils.formatEther(vBal.toString()));
            console.log("Farm COC balance", ethers.utils.formatEther(fBal.toString()));
        })
    })
})