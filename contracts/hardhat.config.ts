import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const pk = process.env.PRIVATE_KEY;
const accounts = pk && pk.startsWith("0x") && pk.length === 66 ? [pk] : pk && !pk.startsWith("0x") && pk.length === 64 ? [pk] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hashkeyTestnet: {
      url: "https://testnet.hsk.xyz",
      chainId: 133,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      hashkeyTestnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "hashkeyTestnet",
        chainId: 133,
        urls: {
          apiURL: "https://testnet-explorer.hsk.xyz/api?",
          browserURL: "https://testnet-explorer.hsk.xyz",
        },
      },
    ],
  },
};

export default config;
