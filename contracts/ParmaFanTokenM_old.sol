// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ParmaFanToken.sol";

contract ParmaFanTokenM_old is AccessControl, ERC20 {
    using SafeMath for uint256;

    address public parmaFanTokenAddress;

    struct LockInfo {
        uint256 amountUnlock;
        uint256 swapped;
        uint256 timestampLock;
        bool lockedByAdmin;
        bool unlockManual;
    }

    mapping(address => LockInfo) _addressLockInfo;

    uint256 TIME_ONE_MONTH = 2629743;
    uint256 TIME_SIX_MONTH = TIME_ONE_MONTH * 6;

    event BalanceUnlocked(address indexed from, address indexed addressUnlocked);
    event ParmaMSwapped(address indexed from, uint256 amount);

    constructor(string memory _name, string memory _symbol, address _parmaFanTokenAddress) ERC20(_name, _symbol) {
        parmaFanTokenAddress = _parmaFanTokenAddress;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function changeParmaToken(
        address _tokenContract
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
        parmaFanTokenAddress = _tokenContract;
        return true;
    }

    /**
     * @dev Return Parma Fan Token balance locked in contract Parma M
     */
    function getTokenLockedInContract() public view returns (uint256) {
        return ParmaFanToken(parmaFanTokenAddress).balanceOf(address(this));
    }

    /**
    * @dev Send quantity of `amount_` in balance address `to_`
    * Emit `Transfer`
    *
    * Requirements
    * - Caller **MUST** is an admin
    * - User have not already token locked, `balanceOf` == 0
    * - Balance locked in contract **MUST** be > to `amount_`
    */
    function deliverToAccount(address _to, uint _amount, uint _type) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        require(balanceOf(_to) == 0, "ParmaFanTokenM: user have already token locked");
        require(_type > 0 && _type < 5, "ParmaFanTokenM: user have already token locked");

        uint256 tokenLocked = getTokenLockedInContract();
        require((tokenLocked - totalSupply() + 1) > _amount, "ParmaFanTokenM: Balance enough of token locked");

        LockInfo memory lockInfoAddress;
        uint amountToMint;
        uint amountToSend;
        if(_type == 1) {
            amountToMint = _amount.mul(85).div(100);
            amountToSend = _amount.mul(15).div(100);

            lockInfoAddress.amountUnlock = _amount.mul(5).div(100);
            lockInfoAddress.timestampLock = block.timestamp + TIME_ONE_MONTH * 2;
            lockInfoAddress.lockedByAdmin = false;
            lockInfoAddress.unlockManual = false;
            lockInfoAddress.swapped = 0;

        }
        if(_type == 2) {
            amountToMint = _amount.mul(80).div(100);
            amountToSend = _amount.mul(20).div(100);

            lockInfoAddress.amountUnlock = _amount.mul(1333).div(10000);
            lockInfoAddress.timestampLock = block.timestamp + TIME_ONE_MONTH;
            lockInfoAddress.lockedByAdmin = false;
            lockInfoAddress.unlockManual = false;
            lockInfoAddress.swapped = 0;

        }
        if(_type == 3) {
            amountToMint = _amount;
            amountToSend = 0;

            lockInfoAddress.amountUnlock = _amount.mul(5).div(100);
            lockInfoAddress.timestampLock = block.timestamp + TIME_ONE_MONTH * 5;
            lockInfoAddress.lockedByAdmin = false;
            lockInfoAddress.unlockManual = false;
            lockInfoAddress.swapped = 0;

        }
        if(_type == 4) {
            amountToMint = _amount;
            amountToSend = 0;

            lockInfoAddress.amountUnlock = _amount;
            lockInfoAddress.timestampLock = 0;
            lockInfoAddress.lockedByAdmin = true;
            lockInfoAddress.unlockManual = true;
            lockInfoAddress.swapped = 0;

        }

        _addressLockInfo[_to] = lockInfoAddress;

        if(amountToSend > 0 ) {
            ParmaFanToken(parmaFanTokenAddress).transfer(_to, amountToSend);
        }

        if(amountToMint != 0) {
            _mint(_to, amountToMint);
        }

        return true;
    }

    /**
    * @dev Returns info of lock token by `owner_` address
    * order of return `amountUnlock`, `timestampUnlock`, `lockedByAdmin`, `unlockManual`
    */
    function getInfoLockedByAddress(address owner_) public view returns(uint256, uint256, bool, bool) {
        uint256 amountUnlock = _addressLockInfo[owner_].amountUnlock;
        uint256 timestampUnlock = _addressLockInfo[owner_].timestampLock;
        bool lockedByAdmin = _addressLockInfo[owner_].lockedByAdmin;
        bool unlockManual = _addressLockInfo[owner_].unlockManual;

        return (amountUnlock, timestampUnlock, lockedByAdmin, unlockManual);
    }

    /**
    * @dev Returns how much token are unlocked by `owner_`
    */
    function getTokenUnlock(address _owner) public view returns(uint256) {
        LockInfo memory lockInfoAddress = _addressLockInfo[_owner];

        if (lockInfoAddress.lockedByAdmin) {
            return 0;
        }
        if (lockInfoAddress.unlockManual) {
            return lockInfoAddress.amountUnlock;
        }

        if (block.timestamp < lockInfoAddress.timestampLock) {
            return 0;
        }
        uint256 rate = (block.timestamp - lockInfoAddress.timestampLock) / TIME_ONE_MONTH;
        if (rate == 0) {
            return 0;
        }
        if (((lockInfoAddress.amountUnlock * rate) - lockInfoAddress.swapped) > balanceOf(_owner)) {
            return balanceOf(_owner);
        }
        return (lockInfoAddress.amountUnlock * rate) - lockInfoAddress.swapped;
    }

    /**
    * @dev Unlock manual swap for `unlockAddress_`
    *
    * Emit `BalanceUnlocked`
    *
    * Requirements:
    * - Swap **MUST** be locked by admin to can unlock it
    */
    function unlockSwap(address unlockAddress_) public onlyRole(DEFAULT_ADMIN_ROLE) returns(bool) {
        require(_addressLockInfo[unlockAddress_].lockedByAdmin, "ParmaFanTokenM: Address amount is not locked by admin");

        _addressLockInfo[unlockAddress_].lockedByAdmin = false;
        emit BalanceUnlocked(_msgSender(), unlockAddress_);
        return true;
    }

    /**
    * @dev Swap tokenM unlock in caller address to Token caller address
    *
    * Emit `TokenMSwapped`
    *
    * Requirements
    * - Token **MUST** be unlocked
    */
    function swapTokenUnlock() public returns(bool) {
        require(balanceOf(msg.sender) > 0, "ParmaFanTokenM: balance of sender is 0");

        LockInfo memory lockInfoAddress = _addressLockInfo[_msgSender()];
        require(block.timestamp > lockInfoAddress.timestampLock, "ParmaFanTokenM: token is already locked");
        require(!lockInfoAddress.lockedByAdmin, "ParmaFanTokenM: swap is already locked by admin");
        uint256 tokenToUnlock = getTokenUnlock(msg.sender);

        ParmaFanToken(parmaFanTokenAddress).transfer(msg.sender, tokenToUnlock);

        _addressLockInfo[msg.sender].swapped = _addressLockInfo[msg.sender].swapped + tokenToUnlock;
        _burn(msg.sender, tokenToUnlock);

        emit ParmaMSwapped(msg.sender, tokenToUnlock);

        return true;
    }

}
