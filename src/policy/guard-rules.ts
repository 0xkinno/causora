import { RelationResult, RelationClass, RelativeOrder } from '../relation/types';

export enum ActionPolicy {
  StrictPrecedence = 0,
  FailClosedHold = 1,
  RequireCausalWitness = 2
}

export enum GuardDecision {
  REJECT = 0,
  ALLOW_A = 1,
  ALLOW_B = 2,
  HOLD = 3
}

export class GuardEvaluator {
  static evaluate(
    relation: RelationResult,
    policy: ActionPolicy = ActionPolicy.FailClosedHold
  ): { decision: GuardDecision; reason: string } {
    if (relation.classification === RelationClass.INVALID) {
      return { decision: GuardDecision.REJECT, reason: 'Evidence is invalid or unverified' };
    }

    if (relation.order === RelativeOrder.PROVABLY_FIRST_A) {
      return { decision: GuardDecision.ALLOW_A, reason: 'Action A authorized by cryptographic proof' };
    }

    if (relation.order === RelativeOrder.PROVABLY_FIRST_B) {
      return { decision: GuardDecision.ALLOW_B, reason: 'Action B authorized by cryptographic proof' };
    }

    if (relation.classification === RelationClass.CROSS_CHAIN_INDETERMINATE) {
      if (policy === ActionPolicy.FailClosedHold || policy === ActionPolicy.StrictPrecedence) {
        return {
          decision: GuardDecision.HOLD,
          reason: 'Order indeterminate across independent chains. Position protected in HOLD state.'
        };
      } else if (policy === ActionPolicy.RequireCausalWitness) {
        return {
          decision: GuardDecision.REJECT,
          reason: 'Missing required cryptographic causal witness.'
        };
      }
    }

    return { decision: GuardDecision.HOLD, reason: 'Default fail-closed HOLD policy invoked' };
  }
}
