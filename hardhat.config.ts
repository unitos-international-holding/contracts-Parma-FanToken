import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-spdx-license-identifier";
import * as dotenv from "dotenv";

//require('solidity-coverage');

dotenv.config();
const { PRIVKEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: process.env.PRIVKEY !== undefined ? [process.env.PRIVKEY] : [],
    },
    testnet: {
      url: "https://speedy-nodes-nyc.moralis.io/40d4cf0d9beaaf4ecdc0775f/bsc/testnet",
      chainId: 97,
      accounts: process.env.PRIVKEY !== undefined ? [process.env.PRIVKEY] : [],
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
      accounts: process.env.PRIVKEY !== undefined ? [process.env.PRIVKEY] : [],
    },
    hardhat: {
      forking: {
        //url: "https://speedy-nodes-nyc.moralis.io/40d4cf0d9beaaf4ecdc0775f/bsc/mainnet",
        url: "https://bsc-dataseed.binance.org/",
      },
    },
  },
  etherscan: {
    apiKey: "6QCVUSXCEEIRV7X3JQM94SDF3HG87ABKWG",
  },
  gasReporter: {
    enabled: true,
    gasPrice: 5,
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    spacing: 2,
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: true,
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
};
