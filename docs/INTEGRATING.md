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
    // 1. Fetch proven evidence
    ICausoraRegistry.EventEvidence memory evA = registry.getEvidence(queryIdActionA);
    ICausoraRegistry.EventEvidence memory evB = registry.getEvidence(queryIdActionB);

    // 2. Classify orderability relation
    IRelationEngine.RelationResult memory relation = relationEngine.classifyRelation(evA, evB, witness);

    // 3. Evaluate guard policy
    ICausoraGuard.GuardDecision decision = guard.evaluateGuard(
        positionId,
        relation,
        ICausoraGuard.ActionPolicy.FailClosedHold
    );

    // 4. Act according to deterministic authorization
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
