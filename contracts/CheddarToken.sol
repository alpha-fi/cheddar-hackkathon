// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CheddarToken is ERC20, Ownable {
    address public minter;
    bool public active;

    event MinterChanged(address indexed newMinter);
    event ActiveStatusChanged(bool active);

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        minter = _msgSender(); // Owner is the initial minter
        active = true;
    }

    modifier onlyMinter() {
        require(
            _msgSender() == minter,
            "Only the minter can call this function"
        );
        require(active, "Contract is inactive");
        _;
    }

    /// @notice Allows the admin (owner) to change the minter address
    /// @param newMinter The address of the new minter
    function adminChangeMinter(address newMinter) external onlyOwner {
        minter = newMinter;
        emit MinterChanged(newMinter);
    }

    /// @notice Allows the admin (owner) to toggle the contract's active state
    function toggleActive() external onlyOwner {
        active = !active;
        emit ActiveStatusChanged(active);
    }

    /// @notice Allows the minter to mint new tokens
    /// @param to The address to receive the minted tokens
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
