// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Test-only token. Do not deploy to production.
contract MockDogzy is ERC20 {
    constructor() ERC20("Dogzy", "DOGZY") {
        _mint(msg.sender, 1_000_000 ether);
    }
}
