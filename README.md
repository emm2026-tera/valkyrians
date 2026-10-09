# valkyrians
## DogzyBridge (contracts/DogzyBridge.sol)

Smart contract (Solidity ^0.8.20, OpenZeppelin v5) to convert in-game Dogzy tokens
into real DOGZY ERC-20 tokens.

1. Deploy with the DOGZY token address, the backend `signer` address, the `rate`
   (DOGZY wei per in-game token × 1e6) and the owner.
2. Owner funds the reserve: `approve` then `fund(amount)`.
3. The game backend debits the player's in-game balance, then signs
   `voucherHash(player, gameAmount, nonce, deadline)` (eth_sign / EIP-191) with the signer key.
4. The player calls `claim(gameAmount, nonce, deadline, signature)` from their wallet.

Each voucher is single-use, expires at `deadline`, and the owner can pause, change rate/signer, or cap claims.
Keep the signer key on the server only, and get the contract audited before mainnet use.
