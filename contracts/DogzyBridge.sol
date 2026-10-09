// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title DogzyBridge
 * @notice Converts off-chain in-game Dogzy tokens (PlayStation game) into real
 *         DOGZY ERC-20 tokens sent to the player's wallet (Dogzy Family Universe).
 *
 * Flow:
 *  1. The game backend debits N in-game tokens from the player's account.
 *  2. The backend signs a voucher (player, gameAmount, nonce, deadline) with `signer`.
 *  3. The player calls `claim` -> contract verifies the signature and sends
 *     gameAmount * rate / RATE_DENOMINATOR real DOGZY from its reserve.
 * The reserve is funded by the owner with `fund`.
 */
contract DogzyBridge is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant RATE_DENOMINATOR = 1e6;

    IERC20 public immutable dogzy;
    address public signer;
    /// real DOGZY (in wei) per 1 in-game token, scaled by RATE_DENOMINATOR
    uint256 public rate;
    /// max in-game tokens per single claim (0 = unlimited)
    uint256 public maxClaim;

    mapping(bytes32 => bool) public usedVouchers;

    event Claimed(address indexed player, uint256 gameAmount, uint256 dogzyAmount, uint256 nonce);
    event SignerUpdated(address signer);
    event RateUpdated(uint256 rate);
    event MaxClaimUpdated(uint256 maxClaim);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error InvalidSignature();
    error VoucherUsed();
    error VoucherExpired();
    error ZeroAmount();
    error ZeroAddress();
    error ExceedsMaxClaim();

    constructor(IERC20 _dogzy, address _signer, uint256 _rate, address _owner) Ownable(_owner) {
        if (address(_dogzy) == address(0) || _signer == address(0)) revert ZeroAddress();
        dogzy = _dogzy;
        signer = _signer;
        rate = _rate;
    }

    function claim(uint256 gameAmount, uint256 nonce, uint256 deadline, bytes calldata signature)
        external
        nonReentrant
        whenNotPaused
    {
        if (gameAmount == 0) revert ZeroAmount();
        if (maxClaim != 0 && gameAmount > maxClaim) revert ExceedsMaxClaim();
        if (block.timestamp > deadline) revert VoucherExpired();

        bytes32 hash = voucherHash(msg.sender, gameAmount, nonce, deadline);
        if (usedVouchers[hash]) revert VoucherUsed();
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(hash);
        if (ECDSA.recover(digest, signature) != signer) revert InvalidSignature();

        usedVouchers[hash] = true;
        uint256 out = (gameAmount * rate) / RATE_DENOMINATOR;
        if (out == 0) revert ZeroAmount();
        dogzy.safeTransfer(msg.sender, out);
        emit Claimed(msg.sender, gameAmount, out, nonce);
    }

    function voucherHash(address player, uint256 gameAmount, uint256 nonce, uint256 deadline)
        public
        view
        returns (bytes32)
    {
        return keccak256(abi.encode(block.chainid, address(this), player, gameAmount, nonce, deadline));
    }

    function quote(uint256 gameAmount) external view returns (uint256) {
        return (gameAmount * rate) / RATE_DENOMINATOR;
    }

    // ---- admin ----

    function fund(uint256 amount) external {
        dogzy.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        dogzy.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }

    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function setRate(uint256 _rate) external onlyOwner {
        rate = _rate;
        emit RateUpdated(_rate);
    }

    function setMaxClaim(uint256 _maxClaim) external onlyOwner {
        maxClaim = _maxClaim;
        emit MaxClaimUpdated(_maxClaim);
    }

    function pause() external onlyOwner { _pause(); }

    function unpause() external onlyOwner { _unpause(); }
}
