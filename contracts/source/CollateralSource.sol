// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CollateralSource
/// @notice Controlled source-chain contract deployed on Ethereum Sepolia for CollateralRescue events
contract CollateralSource {
    event CollateralDeposited(
        uint256 indexed positionId,
        address indexed borrower,
        uint256 amount,
        uint64 nonce
    );

    uint64 public depositNonce;

    function depositCollateral(uint256 positionId, uint256 amount) external {
        depositNonce++;
        emit CollateralDeposited(positionId, msg.sender, amount, depositNonce);
    }
}
