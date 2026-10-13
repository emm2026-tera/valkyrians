// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DogzyToken
/// @notice Standard ERC-20 with a fixed supply minted once to `initialHolder`. No mint function.
contract DogzyToken is ERC20 {
    constructor(address initialHolder, uint256 initialSupply) ERC20("Dogzy", "DOGZY") {
        _mint(initialHolder, initialSupply);
    }
}
