// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICausoraGuard} from "./ICausoraGuard.sol";

/// @title ICausoraVault
/// @notice Interface for Creditcoin CC3 Collateral Vault enforcing fail-closed state and token transfers
interface ICausoraVault {
    event CollateralDeposited(uint256 indexed positionId, address indexed depositor, uint256 amount);
    event VaultCollateralReleased(uint256 indexed positionId, address indexed recipient, uint256 amount);
    event VaultCollateralHeld(uint256 indexed positionId, uint256 lockedAmount, string reason);
    event PositionManagerUpdated(address indexed positionManager);

    function depositCollateral(uint256 positionId, uint256 amount) external;

    function executeProtectedTransition(
        uint256 positionId,
        ICausoraGuard.GuardDecision decision,
        address liquidator,
        address borrower,
        uint256 amount
    ) external returns (bool success);

    function lockedCollateral(uint256 positionId) external view returns (uint256);

    function isHeld(uint256 positionId) external view returns (bool);

    function setPositionManager(address _positionManager) external;
}
