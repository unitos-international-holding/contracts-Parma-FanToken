import hardhat from "hardhat";
const { run, ethers, network } = hardhat;
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "@ethersproject/contracts";


let deployer : SignerWithAddress;
let account1 : SignerWithAddress;
let account2 : SignerWithAddress;

let parmaToken: Contract;

let name = "Parma FanToken";
let symbol = "PARMA"

async function main(): Promise<void> {
    [deployer] = await ethers.getSigners();
    console.log("Deployer address: ", deployer.address)
}

async function setupContractTest(): Promise<void> {
    let balanceBefore = await deployer.getBalance();
    let factory = await ethers.getContractFactory("ParmaFanToken");

    parmaToken = await factory.connect(deployer).deploy(name, symbol);

    await parmaToken.deployed();
    console.log("Parma token address: ", parmaToken.address)

    let balanceAfter = await deployer.getBalance();

    console.log("Cost deploy is: ", ethers.utils.formatEther(balanceBefore.sub(balanceAfter)))
}

async function verify(): Promise<void> {
    // Verifying contracts
    if (
        hardhat.network.name !== "hardhat" &&
        hardhat.network.name !== "localhost"
    ) {
        await new Promise((f) => setTimeout(f, 30000));

        await run("verify:verify", {
            address: parmaToken.address,
            constructorArguments: [name, symbol],
        });
    }
}

main()
    .then(async () => {
        await setupContractTest();
        await verify();
        process.exit(0)
    })
    .catch((error: Error) => {
        console.error(error);
        process.exit(1);
    });
