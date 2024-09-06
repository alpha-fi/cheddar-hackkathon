// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CheddarToken is ERC20, ERC20Burnable, Ownable(msg.sender) {
    uint256 private constant DAY_IN_SECONDS = 86400;

    address public minter;
    bool public active = true;

    uint256 public dailyQuota = 555; // Default daily quota set to 555
    uint256 public userQuota;

    mapping(address => uint256) public userLastMintDay;
    mapping(address => uint256) public userDailyMinted;

    uint256 public todayMinted;
    uint256 public currentDay;

    constructor(
        string memory name,
        address _minter,
        uint256 _userQuota
    ) ERC20(name, "Cheddar") {
        minter = _minter;
        userQuota = _userQuota;
        currentDay = block.timestamp / DAY_IN_SECONDS;
    }

    function mint(address recipient, uint256 amount, address referral) public returns (uint256, uint256) {
        require(msg.sender == minter, "Caller is not the minter");
        require(active, "Contract is deactivated");
        uint256 today = block.timestamp / DAY_IN_SECONDS;
        if (today != currentDay) {
            todayMinted = 0;
            currentDay = today;
        }

        uint256 referralAmount = referral != address(0) ? amount / 20 : 0;
        if (referral != address(0)) {
            _mint(referral, referralAmount);
        }

        uint256 userAmount = amount - referralAmount;
        require(todayMinted + amount <= dailyQuota, "Daily mint quota exceeded");
        todayMinted += amount;

        if (userLastMintDay[recipient] != today) {
            userDailyMinted[recipient] = 0;
        }

        uint256 alreadyMinted = userDailyMinted[recipient];
        if (alreadyMinted >= userQuota) {
            return (0, referralAmount); // User has reached their quota, no minting for the user but referral processed.
        }

        uint256 mintAmount = (userQuota - alreadyMinted < userAmount) ? (userQuota - alreadyMinted) : userAmount;
        userDailyMinted[recipient] += mintAmount;
        _mint(recipient, mintAmount);

        return (mintAmount, referralAmount);
    }

    function toggleActive() public onlyOwner {
        active = !active;
    }

    function changeMinter(address newMinter) public onlyOwner {
        minter = newMinter;
    }

    function setDailyQuota(uint256 newDailyQuota) public onlyOwner {
        dailyQuota = newDailyQuota;
    }

    function setUserQuota(uint256 newUserQuota) public onlyOwner {
        userQuota = newUserQuota;
    }
}
