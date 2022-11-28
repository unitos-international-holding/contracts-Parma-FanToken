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
import { _toEscapedUtf8String } from "ethers/lib/utils";
let catchRevert = require("./utils/exceptions.ts").catchRevert;
let catchRevertWithoutReason = require("./utils/exceptions.ts").catchRevertWithoutReason;
let routerABI = require("../abi/PancakeRouter02.json");
let pairABI = require("../abi/PancakePair.json");
let wrapperABI = require("../abi/WBNB.json");

let deployer: any;
let account1: any;
let account2: any;
let account3: any;
let dev: any;
let charity: any;
let treasury: any;
let eft: Contract;
let cocContract: Contract;
let router: Contract;

const totalSupply = ethers.utils.parseEther("400000000");

const pcsRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const coc = "0xbDC3b3639f7AA19e623A4d603A3Fb7Ab20115A91";
const wbnb = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";


before(async function () {
	[deployer, account1, account2, account3, dev, charity, treasury] = await ethers.getSigners();
	
	const factory = await ethers.getContractFactory("COC");
	cocContract = await factory.attach(coc);
});

describe.only("Testing EFT", async () => {
	describe("Setup", async () => {
		it("Deploy EFT", async () => {
			const factory = await ethers.getContractFactory("ErboFarmToken");
			eft = await factory.deploy(dev.address, charity.address);
		})

		it("Details are correct", async () => {
			const name = await eft.name();
			const symbol = await eft.symbol();
			const decimals = await eft.decimals();
			const supply = await eft.totalSupply();

			expect(name).to.be.equal("Erbo Farm Token");
			expect(symbol).to.be.equal("EFT");
			expect(decimals).to.be.equal(18);
			expect(supply).to.be.equal(ethers.utils.parseEther("400000000"));
		})

		it("LP info are correct", async () => {
			const effRouter = await eft.uniswapV2Router();
			const effCoc = await eft.coc();

			expect(effRouter).to.be.equal(pcsRouter);
			expect(effCoc).to.be.equal(coc);
		})

		it("Dev and charity are correct", async () => {
			const effDev = await eft.dev();
			const effCharity = await eft.charity();

			expect(effDev).to.be.equal(dev.address);
			expect(effCharity).to.be.equal(charity.address);
		})

		it("Owner has total supply", async () => {
			const balance = await eft.balanceOf(deployer.address);

			expect(balance).to.be.equal(totalSupply);
		})
	})

	describe("Deployer adds liquidity", async () => {

		it("Create router", async () => {
			router = new ethers.Contract(pcsRouter, routerABI, deployer);
		})

		it("Deployer adds liquidity | 1 BNB = 1000 EFT", async () => {
			const bnbAmount = ethers.utils.parseEther("20");
			const eftAmount = ethers.utils.parseEther("20000");

			await eft.approve(pcsRouter, eftAmount);
			await router.addLiquidityETH(eft.address, eftAmount, eftAmount, bnbAmount, deployer.address, 999999999999999, {value: bnbAmount});
		})
	})

	describe("Testing tranfers", async () => {
		const amount = ethers.utils.parseEther("100000");

		it("Deployer to account1 for 100000 EFT", async () => {
			const senderBefore = await eft.balanceOf(deployer.address);
			const recipientBefore = await eft.balanceOf(account1.address);
			await eft.transfer(account1.address, amount);
			const senderAfter = await eft.balanceOf(deployer.address);
			const recipientAfter = await eft.balanceOf(account1.address);

			console.log("Recipient recieved:", ethers.utils.formatEther(recipientAfter.sub(recipientBefore)));
		})

		it("Account1 to account2 for 100000 EFT", async () => {
			const senderBefore = await eft.balanceOf(account1.address);
			const recipientBefore = await eft.balanceOf(account2.address);
			await eft.connect(account1).transfer(account2.address, amount);
			const senderAfter = await eft.balanceOf(account1.address);
			const recipientAfter = await eft.balanceOf(account2.address);

			console.log("Sender sent:", ethers.utils.formatEther(senderAfter.sub(senderBefore)));
			console.log("Recipient recieved:", ethers.utils.formatEther(recipientAfter.sub(recipientBefore)));
		})

		it("Account2 to account1 for 1000 EFT", async () => {
			const testAmount = ethers.utils.parseEther("1000");

			const senderBefore = await eft.balanceOf(account2.address);
			const recipientBefore = await eft.balanceOf(deployer.address);
			await eft.connect(account2).transfer(deployer.address, testAmount);
			const senderAfter = await eft.balanceOf(account2.address);
			const recipientAfter = await eft.balanceOf(deployer.address);

			console.log("Sender sent:", ethers.utils.formatEther(senderAfter.sub(senderBefore)));
			console.log("Recipient recieved:", ethers.utils.formatEther(recipientAfter.sub(recipientBefore)));
		})

	})
})
