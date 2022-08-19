import { ethers, upgrades } from "hardhat";
import { Roles } from "~/@types";
import {
  ICVCMConstitution,
  ICVCMGovernor,
  ICVCMRoles,
  ICVCMToken,
} from "~/typechain";

export const deployICVCMToken = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMToken");
  const contract = await upgrades.deployProxy(contractFactory, []);
  return contract.deployed() as Promise<ICVCMToken>;
};

export const deployICVCMGovernor = async (
  tokenAddress: string,
  roleAddress: string
) => {
  const contractFactory = await ethers.getContractFactory("ICVCMGovernor");
  const contract = await upgrades.deployProxy(contractFactory, [
    tokenAddress,
    roleAddress,
  ]);
  return contract.deployed() as Promise<ICVCMGovernor>;
};

export const deployICVCMRoles = async (tokenAddress: string) => {
  const contractFactory = await ethers.getContractFactory("ICVCMRoles");
  const contract = await upgrades.deployProxy(contractFactory, [tokenAddress]);
  return contract.deployed() as Promise<ICVCMRoles>;
};

export const deployICVCMConstitution = async (): Promise<ICVCMConstitution> => {
  const contractFactory = await ethers.getContractFactory("ICVCMConstitution");
  const contract = await upgrades.deployProxy(contractFactory, []);
  return contract.deployed() as Promise<ICVCMConstitution>;
};

export async function deployContracts(
  preRoleOwnershipTransfer?: (roles: ICVCMRoles) => Promise<any>,
  enableRoleOwnershipTransfer = true
): Promise<[ICVCMToken, ICVCMGovernor, ICVCMRoles, ICVCMConstitution]> {
  const token: ICVCMToken = await deployICVCMToken();
  const constitution: ICVCMConstitution = await deployICVCMConstitution();
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);
  const governor: ICVCMGovernor = await deployICVCMGovernor(
    token.address,
    roles.address
  );

  // Assign authorization of contracts
  await roles.batchAddProposalAuthorization(
    [
      roles.address,
      roles.address,
      roles.address,
      roles.address,
      constitution.address,
      constitution.address,
      constitution.address,
      constitution.address,
      governor.address,
      governor.address,
      governor.address,
      governor.address,
      governor.address,
      governor.address,
    ],
    [
      roles.interface.getSighash("addMember"),
      roles.interface.getSighash("removeMember"),
      roles.interface.getSighash("addProposalAuthorization"),
      roles.interface.getSighash("removeProposalAuthorization"),
      constitution.interface.getSighash("setPrinciples"),
      constitution.interface.getSighash("setPrinciples"),
      constitution.interface.getSighash("setStrategies"),
      constitution.interface.getSighash("setStrategies"),
      governor.interface.getSighash("updateQuorumNumerator"),
      governor.interface.getSighash("setVotingPeriod"),
      governor.interface.getSighash("upgradeTo"),
      governor.interface.getSighash("upgradeTo"),
      governor.interface.getSighash("updateQuorumNumerator"),
      governor.interface.getSighash("setVotingPeriod"),
    ],
    [
      Roles.Director,
      Roles.Director,
      Roles.Director,
      Roles.Director,
      Roles.Director,
      Roles.Expert,
      Roles.Director,
      Roles.Secretariat,
      Roles.Director,
      Roles.Director,
      Roles.Director,
      Roles.Secretariat,
      Roles.Secretariat,
      Roles.Secretariat,
    ]
  );

  // Assign token contract ownership to roles contract
  await token.grantRole(await token.ISSUER_ROLE(), roles.address);
  await token.transferAdmin(governor.address);

  await constitution.transferOwnership(governor.address);

  preRoleOwnershipTransfer && (await preRoleOwnershipTransfer(roles));
  enableRoleOwnershipTransfer &&
    (await roles.transferOwnership(governor.address));

  return [token, governor, roles, constitution];
}
