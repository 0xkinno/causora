// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICausoraGuard} from "./interfaces/ICausoraGuard.sol";
import {ICausoraVault} from "./interfaces/ICausoraVault.sol";

/// @title CausoraVault
/// @notice Real CC3 Collateral Vault enforcing financial state transitions governed by CausoraGuard
contract CausoraVault is ICausoraVault, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateralToken;
    address public positionManager;

    mapping(uint256 => uint256) public lockedCollateral;
    mapping(uint256 => bool) public isHeld;

    error UnauthorizedCaller();
    error InsufficientVaultCollateral(uint256 positionId, uint256 available, uint256 required);
    error InvalidGuardDecision();
    error PositionIsHeld(uint256 positionId);

    modifier onlyPositionManager() {
        if (msg.sender != positionManager && msg.sender != owner()) {
            revert UnauthorizedCaller();
        }
        _;
    }

    constructor(address _collateralToken) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
    }

    function setPositionManager(address _positionManager) external onlyOwner {
        positionManager = _positionManager;
        emit PositionManagerUpdated(_positionManager);
    }

    /// @notice Locks real ERC20 collateral for a position on CC3
    function depositCollateral(uint256 positionId, uint256 amount) external {
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        lockedCollateral[positionId] += amount;
        emit CollateralDeposited(positionId, msg.sender, amount);
    }

    /// @notice Executes the real token and state movement based on CausoraGuard outcome
    function executeProtectedTransition(
        uint256 positionId,
        ICausoraGuard.GuardDecision decision,
        address liquidator,
        address /* borrower */,
        uint256 amount
    ) external onlyPositionManager returns (bool success) {
        uint256 currentBalance = lockedCollateral[positionId];

        if (decision == ICausoraGuard.GuardDecision.ALLOW_A) {
            // Rescue event was provably first: position collateral is fortified and preserved
            isHeld[positionId] = false;
            return true;
        } else if (decision == ICausoraGuard.GuardDecision.ALLOW_B) {
            // Liquidation event was provably first: transfer collateral to liquidator
            if (isHeld[positionId]) revert PositionIsHeld(positionId);
            if (currentBalance < amount) revert InsufficientVaultCollateral(positionId, currentBalance, amount);

            lockedCollateral[positionId] -= amount;
            collateralToken.safeTransfer(liquidator, amount);
            emit VaultCollateralReleased(positionId, liquidator, amount);
            return true;
        } else if (decision == ICausoraGuard.GuardDecision.HOLD) {
            // Order is indeterminate: lock collateral firmly on CC3, preventing liquidation
            isHeld[positionId] = true;
            emit VaultCollateralHeld(positionId, currentBalance, "FAIL_CLOSED_HOLD: Collateral frozen against unprovable race");
            return true;
        } else {
            revert InvalidGuardDecision();
        }
    }
}
