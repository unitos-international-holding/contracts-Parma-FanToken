// SPDX-License-Identifier: ISC
// Developed by: Scaling Parrots

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./ParmaFanToken.sol";

pragma solidity ^0.8.4;

contract ParmaFanTokenM_backup is ERC20, AccessControl {
    using SafeMath for uint256;

    address public parmaFanTokenAddress;
    uint256 public ParmaFanTokenLocked;
    uint256 public totalVestingAmount;
    uint256 public totalRedeemedAmount;
    bool private lockTokensStatus = false;

    struct TokenVesting {
        uint256 vestingType;
        uint256 start;
        uint256 cliff;
        uint256 amount;
        uint256 redeemed;
        bool locked;
    }
    mapping(address => TokenVesting) private _vesting;

    event TokensLocked(address admin, uint256 amount);
    event TokensVested(
        address beneficiary,
        uint256 vestingType,
        uint256 start,
        uint256 cliff,
        uint256 amount
    );
    event TokensRedeemed(address beneficiary, uint256 amount);

    constructor(string memory name, string memory symbol ,address _parmaFanTokenAddress) ERC20(name, symbol) {
        parmaFanTokenAddress = _parmaFanTokenAddress;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    //Ovveride ERC20 transfer function to make ParmaFanTokenM non-transferable
    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        revert("ParmaFanTokenM: ParmaFanTokenM is non-transferable");
    }

    //Ovveride ERC20 transferFrom function to make ParmaFanTokenM non-transferable
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        revert("ParmaFanTokenM: ParmaFanTokenM is non-transferable");
    }

    function getLockedTokens() public view returns (uint256) {
        return ParmaFanToken(parmaFanTokenAddress).balanceOf(address(this));
    }

    function lockTokens(
        uint256 amount
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        uint256 lockedTokens = getLockedTokens();
        //require(!lockTokensStatus, "Tokens already lock");
        //require(lockedTokens <= 0 && totalSupply() <= 0, "Tokens already lock");

        //ParmaFanToken(parmaFanTokenAddress).approve(address(this), amount);
        ParmaFanToken(parmaFanTokenAddress).transferFrom(
            _msgSender(),
            address(this),
            amount
        );

        emit TokensLocked(_msgSender(), amount);

        ParmaFanTokenLocked += amount;
        lockTokensStatus = true;
        return lockTokensStatus;
    }

    /*
     * 1. 15% of the immediately unlocked value, from the 90th day the contract lets you unlock 5% for the next 17 months
     * 2. 20% of the immediately unlocked value, from the 60th day allows you to unlock 13.33% for the following 6 months
     * 3. 100% locked, can be unlocked in one go by admin
     * 4. 100% locked, unlockable at 5% per month from day 180 onwards.
     */
    function vestTokens(
        address beneficiary,
        uint256 amount,
        uint256 vestingType
    ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
        require(
            !_vesting[beneficiary].locked,
            "ParmaFanTokenM: Tokens are already locked"
        );
        require(
            vestingType > 0 && vestingType < 5,
            "ParmaFanTokenM: vesting type must be between 1 and 4"
        );
        require(
            beneficiary != address(0),
            "ERC20: transfer to the zero address"
        );
        require(amount > 0, "ERC20: amount must be greater than 0");
        require(
            !ParmaFanToken(parmaFanTokenAddress).isBlacklisted(beneficiary),
            "ParmaFanToken: beneficiary is in blacklist"
        );
        require(
            totalVestingAmount.add(amount) < getLockedTokens() + totalSupply(),
            "ParmaFanTokenM: totalVestingAmount is greater than ParmaFanTokenLocked"
        );

        if (vestingType == 1) {
            _vesting[beneficiary] = TokenVesting(
                1,
                block.timestamp,
                block.timestamp + 90 days,
                amount,
                amount.mul(15).div(100),
                true
            );
            // Transfer 15% of ParmaFanToken to the beneficiary
            ParmaFanToken(parmaFanTokenAddress).transfer(
                beneficiary,
                amount.mul(15).div(100)
            );
            // Mint 85% of amount in ParmaFanTokenM to the beneficiary
            _mint(beneficiary, amount.mul(85).div(100));

            totalVestingAmount.add(amount);

            emit TokensVested(
                beneficiary,
                1,
                block.timestamp,
                block.timestamp + 90 days,
                amount
            );
            return true;
        } else if (vestingType == 2) {
            _vesting[beneficiary] = TokenVesting(
                2,
                block.timestamp,
                block.timestamp + 60 days,
                amount,
                amount.mul(20).div(100),
                true
            );
            // Transfer 20% of ParmaFanToken to the beneficiary
            ParmaFanToken(parmaFanTokenAddress).transfer(
                beneficiary,
                amount.mul(20).div(100)
            );
            //Mint 80% of amount in ParmaFanTokenM to the beneficiary
            _mint(beneficiary, amount.mul(80).div(100));

            totalVestingAmount.add(amount);

            emit TokensVested(
                beneficiary,
                2,
                block.timestamp,
                block.timestamp + 60 days,
                amount
            );
            return true;
        } else if (vestingType == 3) {
            _vesting[beneficiary] = TokenVesting(
                3,
                block.timestamp,
                block.timestamp,
                amount,
                0,
                true
            );

            //Mint 100% of amount in ParmaFanTokenM to the beneficiary
            _mint(beneficiary, amount);

            totalVestingAmount.add(amount);

            emit TokensVested(
                beneficiary,
                3,
                block.timestamp,
                block.timestamp,
                amount
            );
            return true;
        } else if (vestingType == 4) {
            _vesting[beneficiary] = TokenVesting(
                4,
                block.timestamp,
                block.timestamp + 180 days,
                amount,
                0,
                true
            );

            //Mint 100% of amount in ParmaFanTokenM to the beneficiary
            _mint(beneficiary, amount);

            totalVestingAmount.add(amount);

            emit TokensVested(
                beneficiary,
                4,
                block.timestamp,
                block.timestamp + 180 days,
                amount
            );
            return true;
        }
        return false;
    }

    function redeemVesting(address beneficiary) public returns (uint256) {
        require(
            _vesting[beneficiary].locked,
            "ParmaFanTokenM: Tokens are not locked"
        );
        require(
            _vesting[beneficiary].amount - _vesting[beneficiary].redeemed > 0,
            "ParmaFanTokenM: No tokens to unlock"
        );

        uint256 amount = _calcTokenToUnlock(beneficiary);

        // Check if the beneficiary has enough ParmaFanTokenM to redeem
        require(
            balanceOf(beneficiary) >= amount,
            "ParmaFanTokenM: Not enough tokens to redeem"
        );

        if (_vesting[beneficiary].vestingType == 3) {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "ParmaFanTokenM: Only admin can redeem this vesting type"
            );
            // Send ParmaFanToken to the beneficiary
            ParmaFanToken(parmaFanTokenAddress).transfer(beneficiary, amount);
            //Burn ParmaFanTokenM from the beneficiary
            _burn(beneficiary, amount);

            _vesting[beneficiary].redeemed = _vesting[beneficiary].redeemed.add(
                amount
            );
            totalRedeemedAmount.add(amount);

            emit TokensRedeemed(beneficiary, amount);
            return amount;
        } else {
            require(
                beneficiary == msg.sender,
                "ParmaFanTokenM: Only beneficiary can redeem this vesting type"
            );
            // Send ParmaFanToken to the beneficiary
            ParmaFanToken(parmaFanTokenAddress).transfer(beneficiary, amount);
            //Burn ParmaFanTokenM from the msg.sender
            _burn(beneficiary, amount);

            _vesting[beneficiary].redeemed = _vesting[beneficiary].redeemed.add(
                amount
            );
            totalRedeemedAmount.add(amount);

            emit TokensRedeemed(beneficiary, amount);
            return amount;
        }
    }

    // Internal function

    function _calcTokenToUnlock(
        address beneficiary
    ) internal view returns (uint256) {
        require(
            _vesting[beneficiary].amount - _vesting[beneficiary].redeemed > 0,
            "ParmaFanTokenM: No tokens to unlock"
        );
        require(
            block.timestamp >= _vesting[beneficiary].cliff,
            "ParmaFanTokenM: Tokens are not unlockable yet"
        );

        uint256 amount;
        if (
            _vesting[beneficiary].vestingType == 1 ||
            _vesting[beneficiary].vestingType == 4
        ) {
            uint timeDiff = block.timestamp - _vesting[beneficiary].start;
            uint timeDiffInMonths = (timeDiff / 30 days) -
                (_vesting[beneficiary].cliff / 30 days);

            require(
                timeDiffInMonths > 0,
                "ParmaFanTokenM: Tokens are not unlockable yet"
            );

            uint256 monthlyRedemptions = _vesting[beneficiary]
                .amount
                .mul(5)
                .div(100);

            // 5% of the total amount of tokens to unlock every month
            uint256 totalAmountRedemptions = _vesting[beneficiary]
                .amount
                .mul(15)
                .div(100) / 5;
            uint256 amountRedemptions = (_vesting[beneficiary].amount -
                _vesting[beneficiary].redeemed) / 5;

            amount =
                (totalAmountRedemptions - amountRedemptions) *
                monthlyRedemptions;
        } else if (_vesting[beneficiary].vestingType == 2) {
            uint timeDiff = block.timestamp - _vesting[beneficiary].start;
            uint timeDiffInMonths = (timeDiff / 30 days) -
                (_vesting[beneficiary].cliff / 30 days);

            require(
                timeDiffInMonths > 0,
                "ParmaFanTokenM: Tokens are not unlockable yet"
            );

            uint256 monthlyRedemptions = _vesting[beneficiary]
                .amount
                .mul(1333)
                .div(10000);

            // 5% of the total amount of tokens to unlock every month
            uint256 totalAmountRedemptions = _vesting[beneficiary]
                .amount
                .mul(20)
                .div(1333);
            uint256 amountRedemptions = (_vesting[beneficiary].amount -
                _vesting[beneficiary].redeemed).mul(100).div(1333);

            amount =
                (totalAmountRedemptions - amountRedemptions) *
                monthlyRedemptions;
        } else if (_vesting[beneficiary].vestingType == 3) {
            amount = _vesting[beneficiary].amount;
        }

        return amount;
    }
}
