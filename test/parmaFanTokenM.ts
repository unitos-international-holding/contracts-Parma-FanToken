import hardhat from "hardhat";

const { ethers, network } = hardhat;

import { expect } from 'chai';
import { Contract } from "@ethersproject/contracts";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const catchRevert = require("./utils/exceptions.ts").catchRevert;
const { expectRevert } = require('@openzeppelin/test-helpers');

let deployer: SignerWithAddress;
let account1: SignerWithAddress;
let account2: SignerWithAddress;
let account3: SignerWithAddress;
let account4: SignerWithAddress;

let parmaFanToken: Contract;
let parmaFanTokenM: Contract;

let nameParmaFanToken = "Parma Fan Token"
let symbolParmaFanToken = "PFT"
let nameParmaFanTokenM = "Parma Fan Token M"
let symbolParmaFanTokenM = "PFTM"

let amountLockType1 = ethers.utils.parseEther("100")
let amountLockType2 = ethers.utils.parseEther("100")
let amountLockType3 = ethers.utils.parseEther("100")
let amountLockType4 = ethers.utils.parseEther("100")

let timestampOneDay = 86400
let timestampOneMonth = 2629743

before(async function() {
    [deployer, account1, account2, account3, account4] = await ethers.getSigners();
});

describe("Testing Parma fan token M...", async () => {

    describe("Setup contract", async () => {

        it("Should deploy parma fan token ", async () => {
            let factory = await ethers.getContractFactory("ParmaFanToken")
            parmaFanToken = await factory.deploy(nameParmaFanToken, symbolParmaFanToken)
        })

        it("Should deploy parma fan token M", async () => {
            let factory = await ethers.getContractFactory("ParmaFanTokenM")
            parmaFanTokenM = await factory.deploy(nameParmaFanTokenM, symbolParmaFanToken, parmaFanToken.address)
            expect(await parmaFanTokenM.parmaFanTokenAddress()).to.be.equal(parmaFanToken.address);
        })

    })

    describe("Fund contract", async () => {

        it("Fund Parma token M with Parma token", async () => {
            let amountToFound = amountLockType1.add(amountLockType2).add((amountLockType3)).add(amountLockType4)
            let tx = await parmaFanToken.connect(deployer).transfer(parmaFanTokenM.address, amountToFound);
            await tx.wait();
            expect(await parmaFanToken.balanceOf(parmaFanTokenM.address)).to.be.equal(amountToFound);
        })

    })

    describe("Lock", async () => {

        it("Should lock token with vesting type 1", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            let tx = await parmaFanTokenM.deliverToAccount(account1.address, amountLockType1, 1)
            await tx.wait();
            let amountTokenMDeliverExpected = amountLockType1.mul(85).div(100);
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore.add(amountTokenMDeliverExpected));
            expect(await parmaFanTokenM.balanceOf(account1.address)).to.be.equal(amountTokenMDeliverExpected)
        })

        it("Should lock token with vesting type 2", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            let tx = await parmaFanTokenM.deliverToAccount(account2.address, amountLockType2, 2)
            await tx.wait();
            let amountTokenMDeliverExpected = amountLockType2.mul(80).div(100);
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore.add(amountTokenMDeliverExpected));
            expect(await parmaFanTokenM.balanceOf(account2.address)).to.be.equal(amountTokenMDeliverExpected)
        })

        it("Should lock token with vesting type 3", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            let tx = await parmaFanTokenM.deliverToAccount(account3.address, amountLockType3, 3)
            await tx.wait();
            let amountTokenMDeliverExpected = amountLockType3;
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore.add(amountTokenMDeliverExpected));
            expect(await parmaFanTokenM.balanceOf(account3.address)).to.be.equal(amountTokenMDeliverExpected)
        })

        it("Should lock token with vesting type 4", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            let tx = await parmaFanTokenM.deliverToAccount(account4.address, amountLockType4, 4)
            await tx.wait();
            let amountTokenMDeliverExpected = amountLockType4;
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore.add(amountTokenMDeliverExpected));
            expect(await parmaFanTokenM.balanceOf(account4.address)).to.be.equal(amountTokenMDeliverExpected)
        })

        it("Should revert lock token with vesting type 1", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            await catchRevert(parmaFanTokenM.deliverToAccount(account1.address, amountLockType1, 1))
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore);
        })

        it("Should revert lock token with vesting type 2", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            await catchRevert(parmaFanTokenM.deliverToAccount(account2.address, amountLockType2, 2))
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore);
        })

        it("Should revert lock token with vesting type 3", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            await catchRevert(parmaFanTokenM.deliverToAccount(account3.address, amountLockType3, 3))
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore);
        })

        it("Should revert lock token with vesting type 4", async () => {
            let totalSupplyBefore = await parmaFanTokenM.totalSupply();
            await catchRevert(parmaFanTokenM.deliverToAccount(account4.address, amountLockType4, 4))
            expect(await parmaFanTokenM.totalSupply()).to.be.equal(totalSupplyBefore);
        })

    })

    describe("Unlock token", async () => {

        it("Unlock all type 1, 2, 3", async () => {
            for (let i = 0; i < 25; i++) {

                let blockNumber = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNumber)
                let newTimestamp = block.timestamp + (timestampOneMonth);

                await ethers.provider.send('evm_mine', [newTimestamp]);

                if (i > 1 && i < 19) {

                    let balanceBeforeSwap = await parmaFanToken.balanceOf(account1.address);
                    let tx = await parmaFanTokenM.connect(account1).swapTokenUnlock();
                    await tx.wait();

                    let tokenSwappedExpected = amountLockType1.mul(5).div(100);
                    expect(await parmaFanToken.balanceOf(account1.address)).to.be.equal(balanceBeforeSwap.add(tokenSwappedExpected))

                }
                if (i > 0 && i < 8) {

                    let balanceBeforeSwap = await parmaFanToken.balanceOf(account2.address);
                    let tx = await parmaFanTokenM.connect(account2).swapTokenUnlock();
                    await tx.wait();
                    let tokenSwappedExpected = amountLockType2.mul(1333).div(10000);
                    if (i < 7) {
                        expect(await parmaFanToken.balanceOf(account2.address)).to.be.equal(balanceBeforeSwap.add(tokenSwappedExpected))
                    }

                }

                if (i > 4) {

                    let balanceBeforeSwap = await parmaFanToken.balanceOf(account3.address);
                    let tx = await parmaFanTokenM.connect(account3).swapTokenUnlock();
                    await tx.wait();

                    let tokenSwappedExpected = amountLockType3.mul(5).div(100);
                    expect(await parmaFanToken.balanceOf(account3.address)).to.be.equal(balanceBeforeSwap.add(tokenSwappedExpected))

                }
            }
        })

        it("Unlock type 4", async () => {
            let tx = await parmaFanTokenM.unlockSwap(account4.address);
            await tx.wait();

            let balanceBeforeSwap = await parmaFanToken.balanceOf(account4.address);
            tx = await parmaFanTokenM.connect(account4).swapTokenUnlock();
            await tx.wait();

            let tokenSwappedExpected = amountLockType4;
            expect(await parmaFanToken.balanceOf(account4.address)).to.be.equal(balanceBeforeSwap.add(tokenSwappedExpected))

        })

        it("Revert unlock type 1", async () => {
            let balanceBeforeSwap = await parmaFanToken.balanceOf(account1.address);
            await catchRevert(parmaFanTokenM.connect(account1).swapTokenUnlock());

            expect(await parmaFanToken.balanceOf(account1.address)).to.be.equal(balanceBeforeSwap)
        })

        it("Revert unlock type 2", async () => {
            let balanceBeforeSwap = await parmaFanToken.balanceOf(account2.address);
            await catchRevert(parmaFanTokenM.connect(account2).swapTokenUnlock());

            expect(await parmaFanToken.balanceOf(account2.address)).to.be.equal(balanceBeforeSwap)
        })

        it("Revert unlock type 3", async () => {
            let balanceBeforeSwap = await parmaFanToken.balanceOf(account3.address);
            await catchRevert(parmaFanTokenM.connect(account3).swapTokenUnlock());

            expect(await parmaFanToken.balanceOf(account3.address)).to.be.equal(balanceBeforeSwap)
        })

        it("Revert unlock type 4", async () => {
            await catchRevert(parmaFanTokenM.unlockSwap(account4.address));

            let balanceBeforeSwap = await parmaFanToken.balanceOf(account4.address);
            await catchRevert(parmaFanTokenM.connect(account4).swapTokenUnlock());

            expect(await parmaFanToken.balanceOf(account4.address)).to.be.equal(balanceBeforeSwap)

        })

    })

    describe("Check balance", async () => {

        it("Check balance", async () => {
            let balanceAccount1 = await parmaFanToken.balanceOf(account1.address);
            console.log("Final balance account 1 is: ", ethers.utils.formatEther(balanceAccount1))

            let balanceAccount2 = await parmaFanToken.balanceOf(account2.address);
            console.log("Final balance account 2 is: ", ethers.utils.formatEther(balanceAccount2))

            let balanceAccount3 = await parmaFanToken.balanceOf(account3.address);
            console.log("Final balance account 3 is: ", ethers.utils.formatEther(balanceAccount3))

            let balanceAccount4 = await parmaFanToken.balanceOf(account4.address);
            console.log("Final balance account 4 is: ", ethers.utils.formatEther(balanceAccount4))
        })

    })

})
