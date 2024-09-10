// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CheddarToken.sol";

contract CheddarMinter is CheddarToken {
    uint256 public dailyQuota;
    uint256 public userQuota;
    uint256 public dailyMints;
    uint256 public lastMintDay;

    struct UserDailyMint {
        uint256 day;
        uint256 minted;
    }

    mapping(address => UserDailyMint) public userMints;

    event TokensMinted(
        address indexed recipient,
        uint256 amount,
        address indexed referral,
        uint256 referralAmount
    );

    constructor(
        string memory name,
        string memory symbol,
        uint256 _dailyQuota,
        uint256 _userQuota
    ) CheddarToken(name, symbol) {
        dailyQuota = _dailyQuota;
        userQuota = _userQuota;
        lastMintDay = block.timestamp / 1 days;
    }

    /// @notice Set the minimum gas requirement for minting
    /// @dev This simulates the gas check from NEAR by requiring a certain minimum gas limit.
    modifier requireMinGas(uint256 minGas) {
        require(gasleft() >= minGas, "Insufficient gas for minting");
        _;
    }

    /// @notice Allows the minter to mint tokens to a recipient and optionally a referral
    /// @param recipient The address of the recipient
    /// @param amount The amount of tokens to mint
    /// @param referral The address of the referral (optional)
    function mint(
        address recipient,
        uint256 amount,
        address referral
    )
        external
        onlyMinter
        requireMinGas(30000) // Require at least 30,000 gas
    {
        uint256 currentDay = block.timestamp / 1 days;

        // Reset daily mints if a new day has started
        if (currentDay > lastMintDay) {
            lastMintDay = currentDay;
            dailyMints = 0;
        }

        // Ensure the daily quota is not exceeded
        require(dailyMints + amount <= dailyQuota, "Daily mint quota exceeded");

        // Check and update user's daily mint
        UserDailyMint storage userMint = userMints[recipient];
        if (userMint.day < currentDay) {
            userMint.day = currentDay;
            userMint.minted = 0;
        }

        uint256 referralMint = referral != address(0) ? amount / 20 : 0; // 5% to referral
        uint256 userAmount = amount - referralMint;

        // Ensure the user quota is not exceeded
        require(
            userMint.minted + userAmount <= userQuota,
            "User mint quota exceeded"
        );

        // Update daily and user mints
        dailyMints += amount;
        userMint.minted += userAmount;

        // Mint tokens to the recipient
        _mint(recipient, userAmount);

        // Mint tokens to the referral if provided
        if (referral != address(0)) {
            _mint(referral, referralMint);
        }

        emit TokensMinted(recipient, userAmount, referral, referralMint);
    }

    /// @notice Returns the user's mint data
    /// @param user The address of the user
    /// @return day The day the user minted
    /// @return minted The amount the user minted on that day
    function getUserMintData(
        address user
    ) external view returns (uint256 day, uint256 minted) {
        UserDailyMint storage userMint = userMints[user];
        return (userMint.day, userMint.minted);
    }

    /// @notice Returns the contract configuration
    /// @return minter The current minter address
    /// @return active The contract's active state
    /// @return dailyQuota The daily mint quota
    /// @return userQuota The per-user mint quota
    /// @return dailyMints The amount minted so far today
    function getConfig()
        external
        view
        returns (
            address minter,
            bool active,
            uint256 dailyQuota,
            uint256 userQuota,
            uint256 dailyMints
        )
    {
        return (minter, active, dailyQuota, userQuota, dailyMints);
    }
}
