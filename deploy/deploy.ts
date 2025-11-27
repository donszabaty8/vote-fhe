import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";
import * as path from "path";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed = await deploy("EncryptedPolls", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedPolls contract: `, deployed.address);

  // Save deployment info for frontend
  const deploymentInfo = {
    address: deployed.address,
    abi: deployed.abi,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "EncryptedPolls.sepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployments/EncryptedPolls.sepolia.json");
};
export default func;
func.id = "deploy_encryptedPolls";
func.tags = ["EncryptedPolls"];
