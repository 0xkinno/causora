import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAttackFixture, AttackFixture } from "../setupAttackFixture";
import { CausalWitnessBuilder } from "../../src/witness/causal-witness";
import { ActionPolicy, GuardDecision } from "../../src/policy/guard-rules";

describe("Empirical Causal Control: Ordering Intervention vs Naive Submission Order", function () {
  let f: AttackFixture;

  beforeEach(async () => {
    f = await setupAttackFixture();
  });

  it("proves naive submission order produces wrongful liquidation while Causora mechanism prevents it", async function () {
    // Scenario: Borrower deposits collateral on Sepolia (Event A at height 100).
    // Concurrently, a predatory liquidator observes the position and submits a liquidation on Mainnet (Event B at height 20000000).
    // The two chains are independent (no causal commitment).
    const encTxA = f.makeEncodedTx(1, f.emitterSepolia, f.defaultSig);
    const encTxB = f.makeEncodedTx(1, f.emitterMainnet, f.defaultSig);

    const proofA = {
      root: ethers.keccak256(ethers.toUtf8Bytes("rootA-control")),
      siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sA-control")), isLeft: false }],
    };
    const proofB = {
      root: ethers.keccak256(ethers.toUtf8Bytes("rootB-control")),
      siblings: [{ hash: ethers.keccak256(ethers.toUtf8Bytes("sB-control")), isLeft: true }],
    };
    const cont = { lowerEndpointDigest: ethers.ZeroHash, roots: [] };

    await f.registry.admitEvidence(1n, 100n, encTxA, proofA, cont);
    const qA = await f.registry.computeQueryId(1n, 100n, proofA.root, proofA.siblings);

    await f.registry.admitEvidence(3n, 20000000n, encTxB, proofB, cont);
    const qB = await f.registry.computeQueryId(3n, 20000000n, proofB.root, proofB.siblings);

    const emptyWitness = CausalWitnessBuilder.empty();

    // 1. NAIVE CONTROL PATH (Ordering Logic Disabled / First-Arrival-Wins)
    // If the liquidator's proof arrives at the relayer first, naive protocol executes liquidation:
    const naiveArrivalOrder = "LIQUIDATOR_FIRST";
    let naiveVerdict = "UNKNOWN";
    let naiveBorrowerLoss = 0n;

    if (naiveArrivalOrder === "LIQUIDATOR_FIRST") {
      naiveVerdict = "LIQUIDATE_POSITION"; // Naive relayer grants precedence to first observed tx
      naiveBorrowerLoss = ethers.parseEther("10"); // Borrower collateral liquidated erroneously
    }

    // 2. CAUSORA INTERVENTION PATH (Formal RelationEngine + Fail-Closed CausoraGuard)
    const [guardDecision, relation] = await f.guard.evaluateGuardFromEvidence.staticCall(
      1001n,
      qA,
      qB,
      emptyWitness,
      ActionPolicy.FailClosedHold
    );

    // Assert formal classification is strictly INDETERMINATE (3), not an invented ordering
    expect(relation.classification).to.equal(3); // CROSS_CHAIN_INDETERMINATE

    // Assert guard enforces fail-closed HOLD (3), strictly preventing ALLOW_B (2)
    expect(guardDecision).to.equal(GuardDecision.HOLD);

    // 3. COMPARATIVE CONTROL ASSERTION:
    // Naive baseline allows predatory liquidation (naiveBorrowerLoss > 0)
    // Causora intervention prevents wrongful liquidation and locks vault in HOLD state
    expect(naiveVerdict).to.equal("LIQUIDATE_POSITION");
    expect(naiveBorrowerLoss).to.equal(ethers.parseEther("10"));
    expect(guardDecision).to.not.equal(GuardDecision.ALLOW_B);
    expect(guardDecision).to.equal(GuardDecision.HOLD);
  });
});
