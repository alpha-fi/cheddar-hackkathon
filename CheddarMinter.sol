// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importing ERC20, ERC20Burnable, Ownable, and SafeMath from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CheddarToken is ERC20, ERC20Burnable, Ownable(msg.sender) {
    using SafeMath for uint256;

    uint256 private constant DAY_IN_SECONDS = 86400;

    address public admin;
    address public minter;
    bool public active = true;

    uint256 public dailyQuota;
    uint256 public userQuota;

    mapping(address => uint256) public lastMintDay;
    mapping(address => uint256) public userDailyMinted;

    uint256 public todayMinted;
    uint256 public currentDay;

    constructor(
        string memory name,
        string memory symbol,
        address _admin,
        address _minter,
        uint256 _dailyQuota,
        uint256 _userQuota
    ) ERC20(name, symbol) {
        admin = _admin;
        minter = _minter;
        dailyQuota = _dailyQuota;
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
        uint256 userAmount = amount - referralAmount;

        require(todayMinted + amount <= dailyQuota, "Daily mint quota exceeded");
        todayMinted += amount;

        if (lastMintDay[recipient] != today) {
            userDailyMinted[recipient] = 0;
        }

        uint256 alreadyMinted = userDailyMinted[recipient];
        require(alreadyMinted < userQuota, "User daily quota exceeded");
        uint256 mintAmount = (userQuota - alreadyMinted) < userAmount ? (userQuota - alreadyMinted) : userAmount;

        userDailyMinted[recipient] += mintAmount;
        _mint(recipient, mintAmount);

        if (referral != address(0)) {
            _mint(referral, referralAmount);
        }

        return (mintAmount, referralAmount);
    }

    function toggleActive() public {
        require(msg.sender == admin, "Caller is not the admin");
        active = !active;
    }

    function changeMinter(address newMinter) public {
        require(msg.sender == admin, "Caller is not the admin");
        minter = newMinter;
    }
}
