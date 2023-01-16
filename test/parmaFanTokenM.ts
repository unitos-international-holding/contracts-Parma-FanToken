import hardhat from "hardhat";

const { expect } = require("chai");
import { network, ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let deployer: SignerWithAddress;
let account1: SignerWithAddress;
let account2: SignerWithAddress;
let account3: SignerWithAddress;
let account4: SignerWithAddress;
let account5: SignerWithAddress;

let parmaFanToken: Contract;
let parmaFanTokenM: Contract;

let amountVesting = ethers.utils.parseUnits("1000", 18);

before(async function () {
  [deployer, account1, account2, account3, account4, account5] =
    await ethers.getSigners();
});

function getUmanDate(timestamp: string) {
  let date = new Date(Number(timestamp) * 1000);
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let hours = date.getHours();
  let minutes = date.getMinutes();

  let dateFormatted =
    day + "/" + month + "/" + year + " - " + hours + ":" + minutes;
  return dateFormatted;
}

async function balanceOfAccount() {
  //Print the balances of ParmaFanToken
  console.log("BALANCES OF ParmaFanToken");
  console.log(
    "Deployer Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanToken.balanceOf(deployer.address)).toString(),
      18
    )
  );
  console.log(
    "Account1 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanToken.balanceOf(account1.address)).toString(),
      18
    )
  );
  console.log(
    "Account2 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanToken.balanceOf(account2.address)).toString(),
      18
    )
  );
  console.log(
    "Account3 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanToken.balanceOf(account3.address)).toString(),
      18
    )
  );
  console.log(
    "Account4 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanToken.balanceOf(account4.address)).toString(),
      18
    )
  );
  //Print the balances of ParmaFanTokenM
  console.log("BALANCES OF ParmaFanTokenM");
  console.log(
    "Deployer Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.balanceOf(deployer.address)).toString(),
      18
    )
  );
  console.log(
    "Account1 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.balanceOf(account1.address)).toString(),
      18
    )
  );
  console.log(
    "Account2 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.balanceOf(account2.address)).toString(),
      18
    )
  );
  console.log(
    "Account3 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.balanceOf(account3.address)).toString(),
      18
    )
  );
  console.log(
    "Account4 Balance: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.balanceOf(account4.address)).toString(),
      18
    )
  );
}

async function publicVaribles() {
  console.log("ParmaFanTokenM contract public variables");
  console.log(
    "parmaFanTokenAddress: ",
    await parmaFanTokenM.parmaFanTokenAddress()
  );
  console.log(
    "ParmaFanTokenLocked: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.ParmaFanTokenLocked()).toString(),
      18
    )
  );
  console.log(
    "totalVestingAmount: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.totalVestingAmount()).toString(),
      18
    )
  );
  console.log(
    "totalRedeemedAmount: ",
    ethers.utils.formatUnits(
      (await parmaFanTokenM.totalRedeemedAmount()).toString(),
      18
    )
  );
}

describe("ParmaFanTokenM Testing", function () {
  //Deploying the contracts
  it("Should deploy the contracts", async function () {
    const ParmaFanToken = await ethers.getContractFactory("ParmaFanToken");
    parmaFanToken = await ParmaFanToken.deploy("ParmaFanToken", "PFT");
    await parmaFanToken.deployed();

    const ParmaFanTokenM = await ethers.getContractFactory(
      "ParmaFanTokenM"
    );
    parmaFanTokenM = await ParmaFanTokenM.deploy(
      "ParmaFanTokenM",
      "PFTM",
      parmaFanToken.address
    );
    await parmaFanTokenM.deployed();
  });

  //Print deployer balance and address of the contracts
  it("Should print the balances", async function () {
    console.log(
      "Deployer Balance: ",
      ethers.utils.formatUnits(
        (await parmaFanToken.balanceOf(deployer.address)).toString(),
        18
      )
    );
    console.log("ParmaFanToken Address: ", parmaFanToken.address);
    console.log("ParmFanTokenM Address: ", parmaFanTokenM.address);
  });

  //Locking  10.000 ParmaFanToken into ParmaFanTokenM
  it("Should lock the ParmaFanToken into ParmaFanTokenM", async function () {
    //Approve the transfer of 10.000 PFT to the ParmaFanTokenM contract
    await parmaFanToken.approve(
      parmaFanTokenM.address,
      ethers.utils.parseUnits("10000", 18)
    );
    //Lock the 10.000 PFT into the ParmaFanTokenM contract
    await parmaFanTokenM.lockTokens(ethers.utils.parseUnits("10000", 18));
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Try to lock another ParmaFanToken into ParmaFanTokenM
  it("Security: try to lock another amount of ParmaFanToken into ParmaFanTokenM", async function () {
    try {
      await parmaFanToken.approve(
        parmaFanTokenM.address,
        ethers.utils.parseUnits("10000", 18)
      );
      await parmaFanTokenM.lockTokens(ethers.utils.parseUnits("10000", 18));
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Try to lock ParmaFanToken by a non-owner account
  it("Security: try to lock ParmaFanToken by a non-owner account", async function () {
    try {
      await parmaFanToken
        .connect(account1)
        .approve(parmaFanTokenM.address, ethers.utils.parseUnits("10000", 18));
      await parmaFanTokenM
        .connect(account1)
        .lockTokens(ethers.utils.parseUnits("10000", 18));
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Try to transfer ParmaFanTokenM of address1 to address2
  it("Security: try to transfer ParmaFanTokenM of address1 to address2", async function () {
    try {
      await parmaFanTokenM
        .connect(account1)
        .transfer(account2.address, ethers.utils.parseUnits("100", 18));
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Try to transferFrom ParmaFanTokenM of address1 to address2
  it("Security: try to transferFrom ParmaFanTokenM of address1 to address2", async function () {
    try {
      await parmaFanTokenM
        .connect(account1)
        .approve(account2.address, ethers.utils.parseUnits("100", 18));
      await parmaFanTokenM
        .connect(account1)
        .transferFrom(
          account1.address,
          account2.address,
          ethers.utils.parseUnits("100", 18)
        );
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Print the locked tokens in PamraFanTokenM contract
  it("Should print the locked tokens in ParmaFanTokenM contract", async function () {
    console.log(
      "Locked ParmaFanTokens into ParmaFanTokensM Contract: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getLockedTokens()).toString(),
        18
      )
    );
  });

  //Vesting 1000 ParmaFanTokenM to account1 with vesting type 1
  it("Should vest 1000 ParmaFanTokenM to account1 with vesting type 1", async function () {
    await parmaFanTokenM.vestTokens(account1.address, amountVesting, 1);
  });
  //Vesting 1000 ParmaFanTokenM to account2 with vesting type 2
  it("Should vest 1000 ParmaFanTokenM to account2 with vesting type 2", async function () {
    await parmaFanTokenM.vestTokens(account2.address, amountVesting, 2);
  });
  //Vesting 1000 ParmaFanTokenM to account3 with vesting type 3
  it("Should vest 1000 ParmaFanTokenM to account3 with vesting type 3", async function () {
    await parmaFanTokenM.vestTokens(account3.address, amountVesting, 3);
  });
  //Vesting 1000 ParmaFanTokenM to account4 with vesting type 4
  it("Should vest 1000 ParmaFanTokenM to account4 with vesting type 4", async function () {
    await parmaFanTokenM.vestTokens(account4.address, amountVesting, 4);
  });

  //Print the balances of the accounts
  it("Should print the balances of the accounts", async function () {
    await balanceOfAccount();
  });

  //Print the public variables of ParmaFanTokenM contract
  it("Should print the public variables of ParmaFanTokenM contract", async function () {
    await publicVaribles();

    //Print the vesting data of struct of account1
    console.log("Vesting data of account1");
    console.log(
      "account1 details: ",
      "\n",
      "address: ",
      account1.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account1.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account1.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account1.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account1.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account1.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account1.address)).locked
    );
    //Print the vesting data of struct of account2
    console.log("Vesting data of account2");
    console.log(
      "account2 details: ",
      "\n",
      "address: ",
      account2.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account2.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account2.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account2.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account2.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account2.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account2.address)).locked
    );
    //Print the vesting data of struct of account3
    console.log("Vesting data of account3");
    console.log(
      "account3 details: ",
      "\n",
      "address: ",
      account3.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account3.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account3.address)).locked
    );
    //Print the vesting data of struct of account4
    console.log("Vesting data of account4");
    console.log(
      "account4 details: ",
      "\n",
      "address: ",
      account4.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account4.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account4.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account4.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account4.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account4.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account4.address)).locked
    );
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Try to vesting to account already vested
  it("Security: try to vest to account already vested", async function () {
    try {
      await parmaFanTokenM.vestTokens(account1.address, amountVesting, 1);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  // Try to vesting to account with amount 0
  it("Security: try to vest to account with amount 0", async function () {
    try {
      await parmaFanTokenM.vestTokens(account5.address, 0, 1);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  // Try to vesting to account with vesting type 0
  it("Security: try to vest to account with vesting type 0", async function () {
    try {
      await parmaFanTokenM.vestTokens(account5.address, amountVesting, 0);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  // Try to vesting to account with vesting type 5
  it("Security: try to vest to account with vesting type 5", async function () {
    try {
      await parmaFanTokenM.vestTokens(account5.address, amountVesting, 5);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  // Try to vesting to zero address
  it("Security: try to vest to zero address", async function () {
    try {
      await parmaFanTokenM.vestTokens(
        ethers.constants.AddressZero,
        amountVesting,
        1
      );
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to vestTokens by account5 (not admin)
  it("Security: try to vestTokens by account5 (not admin)", async function () {
    try {
      await parmaFanTokenM.connect(account5).vestTokens(account5.address, 1, 1);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Blacklist account0 and try to vesting to account5
  it("Security: blacklist account5 and try to vest to account0", async function () {
    await parmaFanToken.addAddressToBlacklist(account5.address);
    try {
      await parmaFanTokenM.vestTokens(account5.address, amountVesting, 1);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens by account5 (not vested) by admin
  it("Security: try to unlock tokens by account5 (not vested) by admin", async function () {
    try {
      await parmaFanTokenM.redeemVesting(account5.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens by account5 (not vested) by account5
  it("Security: try to unlock tokens by account5 (not vested) by account5", async function () {
    try {
      await parmaFanTokenM.connect(account5).redeemVesting(account5.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });

  /* --------------------------- End Security Tests --------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                           Testing Vesting Type 3                           */
  /*               100% locked, can be unlocked in one go by admin              */
  /* -------------------------------------------------------------------------- */

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens by account1 of account3
  it("Security: try to unlock tokens by account1 of account3", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens by account3 (not admin)
  it("Security: try to unlock tokens by account3 (not admin)", async function () {
    try {
      await parmaFanTokenM.connect(account3).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Unlock tokens of account3 by admin
  it("Unlock tokens of account3 by admin", async function () {
    await parmaFanTokenM.redeemVesting(account3.address);
  });
  //Print update vesting data of account3 and contract public variables
  it("Print update vesting data of account3 and contract public variables", async function () {
    await publicVaribles();

    console.log("Vesting data of account3");
    console.log(
      "account3 details: ",
      "\n",
      "address: ",
      account3.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account3.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account3.address)).locked
    );
  });
  //Print the balance of account
  it("Print the balance of account", async function () {
    await balanceOfAccount();
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens by account3 (already unlocked)
  it("Security: try to unlock tokens by account3 (already unlocked)", async function () {
    try {
      await parmaFanTokenM.redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 30");
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens by account1 of account1
  it("Security: try to unlock tokens by account1 of account1", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 60");
  });

  /* -------------------------------------------------------------------------- */
  /*                           Testing Vesting Type 2                           */
  /* -------------------------------------------------------------------------- *

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens by account1 of account2
  it("Security: try to unlock tokens by account1 of account2", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account2.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Redeem tokens of account2 by account2
  it("Redeem tokens of account2", async function () {
    await parmaFanTokenM.connect(account2).redeemVesting(account2.address);
  });
  //Print update vesting data of account2 and contract public variables
  it("Print update vesting data of account2 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });
  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account2
  it("Security: try to unlock tokens already unlocked by account2", async function () {
    try {
      await parmaFanTokenM.connect(account2).redeemVesting(account2.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 90");
  });

  /* -------------------------------------------------------------------------- */
  /*                            Token Vesting Type 1                            */
  /* -------------------------------------------------------------------------- */

  //Redeem tokens of account1 by account1
  it("Redeem tokens of account1", async function () {
    await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
  });
  //Print update vesting data of account1 and contract public variables
  it("Print update vesting data of account1 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account1
  it("Security: try to unlock tokens already unlocked by account1", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 120");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 150");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 180");
  });

  //Redeem tokens of account1 by account1
  it("Redeem tokens of account1", async function () {
    await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
  });
  //Redeem tokens of account2 by account2
  it("Redeem tokens of account2", async function () {
    await parmaFanTokenM.connect(account2).redeemVesting(account2.address);
  });
  //Print update vesting data of account and contract public variables
  it("Print update vesting data of account and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });

  /* -------------------------------------------------------------------------- */
  /*                            Token Vesting Type 4                            */
  /* -------------------------------------------------------------------------- */
  //Redeem tokens of account4 by account4
  it("Redeem tokens of account4", async function () {
    await parmaFanTokenM.connect(account4).redeemVesting(account4.address);
  });
  //Print update vesting data of account4 and contract public variables
  it("Print update vesting data of account4 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account4
  it("Security: try to unlock tokens already unlocked by account4", async function () {
    try {
      await parmaFanTokenM.connect(account4).redeemVesting(account4.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens by account1 of account4
  it("Security: try to unlock tokens by account1 of account4", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account4.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 210");
    console.log("account 2 have finished vesting time");
  });
  //Redeem tokens of account2 by account2
  it("Redeem tokens of account2", async function () {
    await parmaFanTokenM.connect(account2).redeemVesting(account2.address);
  });
  //Print update vesting data of account2 and contract public variables
  it("Print update vesting data of account2 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account3
  it("Security: try to unlock tokens already unlocked by account3", async function () {
    try {
      await parmaFanTokenM.connect(account3).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens by account1 of account3
  it("Security: try to unlock tokens by account1 of account3", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 240");
  });

  /* ----------------------------- Security Tests ----------------------------- */
  //Try to unlock token of account3 by account3 after vesting time
  it("Try to unlock token of account3 by account3 after vesting time", async function () {
    try {
      await parmaFanTokenM.connect(account3).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /* --------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 270");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 300");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 330");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 360");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 390");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 420");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 450");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 480");
    console.log("account 1 have finished vesting time");
  });

  //Redeem tokens of account1 by account1
  it("Redeem tokens of account1", async function () {
    await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
  });
  //Print update vesting data of account1 and contract public variables
  it("Print update vesting data of account1 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });
  /*----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account1
  it("Security: try to unlock tokens already unlocked by account1", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /*--------------------------- End Security Tests --------------------------- */

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 510");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 540");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 570");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 600");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 630");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 660");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 690");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 720");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 750");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 780");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 810");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 840");
  });

  //Redeem tokens of account4 by account4
  it("Redeem tokens of account4", async function () {
    await parmaFanTokenM.connect(account4).redeemVesting(account4.address);
  });
  //Print update vesting data of account4 and contract public variables
  it("Print update vesting data of account4 and contract public variables", async function () {
    await publicVaribles();
    await balanceOfAccount();
  });

  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 870");
  });
  //Fast forward 30 days
  it("Fast forward 30 days", async function () {
    await ethers.provider.send("evm_increaseTime", [2592000]);
    await ethers.provider.send("evm_mine", []);
    console.log("Total days passed: 900");
  });

  /*----------------------------- Security Tests ----------------------------- */
  //Security: try to unlock tokens already unlocked by account1
  it("Security: try to unlock tokens already unlocked by account1", async function () {
    try {
      await parmaFanTokenM.connect(account1).redeemVesting(account1.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens already unlocked by account2
  it("Security: try to unlock tokens already unlocked by account2", async function () {
    try {
      await parmaFanTokenM.connect(account2).redeemVesting(account2.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens already unlocked by account3
  it("Security: try to unlock tokens already unlocked by account3", async function () {
    try {
      await parmaFanTokenM.connect(account3).redeemVesting(account3.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  //Security: try to unlock tokens already unlocked by account4
  it("Security: try to unlock tokens already unlocked by account4", async function () {
    try {
      await parmaFanTokenM.connect(account4).redeemVesting(account4.address);
    } catch (error: any) {
      console.log("Error: ", error.message);
    }
  });
  /*--------------------------- End Security Tests --------------------------- */

  //Print the balances of the accounts
  it("Should print the balances of the accounts", async function () {
    await balanceOfAccount();
  });

  //Print the public variables of ParmaFanTokenM contract
  it("Should print the public variables of ParmaFanTokenM contract", async function () {
    await publicVaribles();

    //Print the vesting data of struct of account1
    console.log("Vesting data of account1");
    console.log(
      "account1 details: ",
      "\n",
      "address: ",
      account1.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account1.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account1.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account1.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account1.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account1.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account1.address)).locked
    );
    //Print the vesting data of struct of account2
    console.log("Vesting data of account2");
    console.log(
      "account2 details: ",
      "\n",
      "address: ",
      account2.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account2.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account2.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account2.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account2.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account2.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account2.address)).locked
    );
    //Print the vesting data of struct of account3
    console.log("Vesting data of account3");
    console.log(
      "account3 details: ",
      "\n",
      "address: ",
      account3.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account3.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account3.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account3.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account3.address)).locked
    );
    //Print the vesting data of struct of account4
    console.log("Vesting data of account4");
    console.log(
      "account4 details: ",
      "\n",
      "address: ",
      account4.address,
      "\n",
      "vestingType: ",
      ethers.utils.formatUnits(
        (await parmaFanTokenM.getAddressDetails(account4.address)).vestingType,
        0
      ),
      "\n",
      "start: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account4.address)).start,
          0
        )
      ),
      "\n",
      "cliff: ",
      getUmanDate(
        ethers.utils.formatUnits(
          (await parmaFanTokenM.getAddressDetails(account4.address)).cliff,
          0
        )
      ),
      "\n",
      "amount: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account4.address)
        ).amount.toString(),
        18
      ),
      "\n",
      "redeemed: ",
      ethers.utils.formatUnits(
        (
          await parmaFanTokenM.getAddressDetails(account4.address)
        ).redeemed.toString(),
        18
      ),
      "\n",
      "locked: ",
      (await parmaFanTokenM.getAddressDetails(account4.address)).locked
    );
  });
});
