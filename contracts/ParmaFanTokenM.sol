// SPDX-License-Identifier: ISC

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "/contracts/ParmaFanToken.sol";

pragma solidity ^0.8.4;

contract ParmaFanTokenM is Context, Ownable {
    using SafeMath for uint256;

    mapping(address => bool) private _blacklistAddress;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    uint8 private _decimals;
    string private _name;
    string private _symbol;

    address private _ParmaFanTokenAddress;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 totalSupply_, address parmaFanTokenAddress_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = totalSupply_;
        _ParmaFanTokenAddress = parmaFanTokenAddress_;
    }
    
}
