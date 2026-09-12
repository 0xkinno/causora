# Integrating Causora Orderability Firewall

## 1. Installation

```solidity
import { ICausoraRegistry } from "./interfaces/ICausoraRegistry.sol";
import { IRelationEngine } from "./interfaces/IRelationEngine.sol";
import { ICausoraGuard } from "./interfaces/ICausoraGuard.sol";
```

## 2. Guarding a Cross-Chain Action

```solidity
function executeProtectedDeFiAction(
    uint256 positionId,
    bytes32 queryIdActionA,
    bytes32 queryIdActionB,
    IRelationEngine.CausalWitness calldata witness
) external {
    // 1. Evaluate guard policy directly against admitted registry evidence
    // This authenticates evidence internally and prevents caller calldata forgery
    (ICausoraGuard.GuardDecision decision, IRelationEngine.RelationResult memory relation) = guard.evaluateGuardFromEvidence(
        positionId,
        queryIdActionA,
        queryIdActionB,
        witness,
        ICausoraGuard.ActionPolicy.FailClosedHold
    );

    // 2. Act according to deterministic authorization
    if (decision == ICausoraGuard.GuardDecision.ALLOW_A) {
        _applyActionA(positionId);
    } else if (decision == ICausoraGuard.GuardDecision.ALLOW_B) {
        _applyActionB(positionId);
    } else if (decision == ICausoraGuard.GuardDecision.HOLD) {
        _freezePosition(positionId);
    } else {
        revert("Action rejected by Causora Firewall");
    }
}
```
