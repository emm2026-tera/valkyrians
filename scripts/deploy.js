// Usage: npx hardhat run scripts/deploy.js --network fuji
// Mainnet (--network avalanche) is only allowed with CONFIRM_MAINNET=yes.
const { ethers, network } = require("hardhat");

async function main() {
  if (network.name === "avalanche" && process.env.CONFIRM_MAINNET !== "yes") {
    throw new Error("Refusing mainnet deploy: set CONFIRM_MAINNET=yes after audit.");
  }
  const [deployer] = await ethers.getSigners();
  const signer = process.env.BRIDGE_SIGNER;
  if (!ethers.isAddress(signer || "")) throw new Error("BRIDGE_SIGNER (backend signer address) is required");
  const owner = process.env.BRIDGE_OWNER || deployer.address;
  const supply = ethers.parseUnits(process.env.DOGZY_SUPPLY || "1000000000", 18);
  const rate = BigInt(process.env.BRIDGE_RATE || "1000000"); // 1e6 = 1 DOGZY per game token

  const token = await (await ethers.getContractFactory("DogzyToken")).deploy(deployer.address, supply);
  await token.waitForDeployment();
  const bridge = await (await ethers.getContractFactory("DogzyBridge")).deploy(
    await token.getAddress(), signer, rate, owner);
  await bridge.waitForDeployment();

  console.log(`Network: ${network.name}`);
  console.log(`DogzyToken:  ${await token.getAddress()}`);
  console.log(`DogzyBridge: ${await bridge.getAddress()}`);
  console.log("Next: token.approve(bridge, amount) then bridge.fund(amount).");
}

main().catch((e) => { console.error(e); process.exit(1); });
