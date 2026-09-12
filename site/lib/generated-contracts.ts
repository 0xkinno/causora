// AUTO-GENERATED FROM HARDHAT ARTIFACTS — DO NOT EDIT MANUALLY
// Generated at: 2026-09-12T21:17:38.077Z

export const CAUSORA_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "matchCount",
        "type": "uint256"
      }
    ],
    "name": "AmbiguousEventLogs",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BlockProverPrecompileError",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      }
    ],
    "name": "ExpectedEventNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoLogsInTransaction",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProofVerificationFailed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      }
    ],
    "name": "QueryAlreadyProcessed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      }
    ],
    "name": "SourceNotRegistered",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "receiptStatus",
        "type": "uint8"
      }
    ],
    "name": "SourceTransactionReverted",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "txType",
        "type": "uint8"
      }
    ],
    "name": "UnsupportedTransactionType",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroEventSignature",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "blockHeight",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "txIndex",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "eventSig",
        "type": "bytes32"
      }
    ],
    "name": "EventEvidenceAdmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      }
    ],
    "name": "QueryReplayDetected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum ICausoraRegistry.SourceKind",
        "name": "kind",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "expectedEventSignature",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "SourceRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      }
    ],
    "name": "SourceRemoved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "CHAIN_INFO",
    "outputs": [
      {
        "internalType": "contract IChainInfo",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VERIFIER",
    "outputs": [
      {
        "internalType": "contract INativeQueryVerifier",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "blockHeight",
        "type": "uint64"
      },
      {
        "internalType": "bytes",
        "name": "encodedTransaction",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof",
        "name": "merkleProof",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "lowerEndpointDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32[]",
            "name": "roots",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "name": "continuityProof",
        "type": "tuple"
      }
    ],
    "name": "admitEvidence",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "txIndex",
        "type": "uint64"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "receiptStatus",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "receiptGasUsed",
            "type": "uint64"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "address_",
                "type": "address"
              },
              {
                "internalType": "bytes32[]",
                "name": "topics",
                "type": "bytes32[]"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              }
            ],
            "internalType": "struct IEvmV1Decoder.LogEntry[]",
            "name": "receiptLogs",
            "type": "tuple[]"
          },
          {
            "internalType": "bytes",
            "name": "receiptLogsBloom",
            "type": "bytes"
          }
        ],
        "internalType": "struct IEvmV1Decoder.ReceiptFields",
        "name": "receipt",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "admittedQueryIds",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "blockHeight",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "merkleRoot",
        "type": "bytes32"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "isLeft",
            "type": "bool"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
        "name": "siblings",
        "type": "tuple[]"
      }
    ],
    "name": "computeQueryId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "evidenceRecords",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "blockHeight",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "txIndex",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "txHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "eventSig",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "payloadHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "verifiedAt",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAdmittedQueryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      }
    ],
    "name": "getEvidence",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "chainKey",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "blockHeight",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "txIndex",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "emitter",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "eventSig",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "queryId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "payloadHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "verifiedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct ICausoraRegistry.EventEvidence",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      }
    ],
    "name": "getSourceRegistration",
    "outputs": [
      {
        "internalType": "enum ICausoraRegistry.SourceKind",
        "name": "kind",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "expectedEventSignature",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      }
    ],
    "name": "hasProcessedQuery",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      }
    ],
    "name": "isSourceRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "enum ICausoraRegistry.SourceKind",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "processedQueries",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      },
      {
        "internalType": "enum ICausoraRegistry.SourceKind",
        "name": "kind",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "expectedEventSignature",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "registerSource",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "emitter",
        "type": "address"
      }
    ],
    "name": "removeSource",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "sourceRegistrations",
    "outputs": [
      {
        "internalType": "enum ICausoraRegistry.SourceKind",
        "name": "kind",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "expectedEventSignature",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const RELATION_ENGINE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "evidenceDigestA",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "evidenceDigestB",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "enum IRelationEngine.RelationClass",
        "name": "classification",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum IRelationEngine.RelativeOrder",
        "name": "order",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "RelationEvaluated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "chainKey",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "blockHeight",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "txIndex",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "emitter",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "eventSig",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "queryId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "payloadHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "verifiedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct ICausoraRegistry.EventEvidence",
        "name": "evidenceA",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "chainKey",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "blockHeight",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "txIndex",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "txHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "emitter",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "eventSig",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "queryId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "payloadHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "verifiedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct ICausoraRegistry.EventEvidence",
        "name": "evidenceB",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "parentDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "capabilityHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "stateCommitment",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "sequenceNumber",
            "type": "uint64"
          },
          {
            "internalType": "bytes",
            "name": "signatureOrProof",
            "type": "bytes"
          }
        ],
        "internalType": "struct IRelationEngine.CausalWitness",
        "name": "witness",
        "type": "tuple"
      }
    ],
    "name": "classifyRelation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum IRelationEngine.RelationClass",
            "name": "classification",
            "type": "uint8"
          },
          {
            "internalType": "enum IRelationEngine.RelativeOrder",
            "name": "order",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "heightA",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "indexA",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "heightB",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "indexB",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "evidenceDigestA",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "evidenceDigestB",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          }
        ],
        "internalType": "struct IRelationEngine.RelationResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;

export const CAUSORA_GUARD_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_registry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_relationEngine",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      }
    ],
    "name": "EvidenceNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "evidenceA",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "evidenceB",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum ICausoraGuard.GuardDecision",
        "name": "decision",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "PolicyEvaluated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "evidenceA",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "evidenceB",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum ICausoraGuard.GuardDecision",
        "name": "decision",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "PolicyEvaluatedWithNonce",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_EVIDENCE_AGE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "queryIdA",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "queryIdB",
        "type": "bytes32"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "parentDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "capabilityHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "stateCommitment",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "sequenceNumber",
            "type": "uint64"
          },
          {
            "internalType": "bytes",
            "name": "signatureOrProof",
            "type": "bytes"
          }
        ],
        "internalType": "struct IRelationEngine.CausalWitness",
        "name": "witness",
        "type": "tuple"
      },
      {
        "internalType": "enum ICausoraGuard.ActionPolicy",
        "name": "policy",
        "type": "uint8"
      }
    ],
    "name": "evaluateGuardFromEvidence",
    "outputs": [
      {
        "internalType": "enum ICausoraGuard.GuardDecision",
        "name": "decision",
        "type": "uint8"
      },
      {
        "components": [
          {
            "internalType": "enum IRelationEngine.RelationClass",
            "name": "classification",
            "type": "uint8"
          },
          {
            "internalType": "enum IRelationEngine.RelativeOrder",
            "name": "order",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "heightA",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "indexA",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "heightB",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "indexB",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "evidenceDigestA",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "evidenceDigestB",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          }
        ],
        "internalType": "struct IRelationEngine.RelationResult",
        "name": "relation",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "positionDecisionNonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registry",
    "outputs": [
      {
        "internalType": "contract ICausoraRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "relationEngine",
    "outputs": [
      {
        "internalType": "contract IRelationEngine",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const LENDING_POSITION_MANAGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_registry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_relationEngine",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_guard",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "ActionRejected",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "actionKey",
        "type": "bytes32"
      }
    ],
    "name": "BusinessActionAlreadyConsumed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "queryId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "boundPositionId",
        "type": "uint256"
      }
    ],
    "name": "EvidenceBoundToOtherPosition",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "pairKey",
        "type": "bytes32"
      }
    ],
    "name": "EvidencePairAlreadyConsumed",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "PositionAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "enum ILendingPositionManager.PositionState",
        "name": "currentState",
        "type": "uint8"
      }
    ],
    "name": "PositionNotAtRisk",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "PositionNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnauthorizedCaller",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "actionKey",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "BusinessActionConsumed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "debt",
        "type": "uint256"
      }
    ],
    "name": "PositionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "PositionHeld",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      }
    ],
    "name": "PositionLiquidated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "PositionMarkedAtRisk",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "additionalCollateral",
        "type": "uint256"
      }
    ],
    "name": "PositionRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "RiskEvaluatorUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "consumedActionKeys",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "consumedEvidencePairs",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "debt",
        "type": "uint256"
      }
    ],
    "name": "createPosition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "evidenceBoundPosition",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "getPosition",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "positionId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "collateralAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "debtAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "lastUpdatedAt",
            "type": "uint64"
          },
          {
            "internalType": "enum ILendingPositionManager.PositionState",
            "name": "state",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "lastEvidenceDigest",
            "type": "bytes32"
          }
        ],
        "internalType": "struct ILendingPositionManager.LendingPosition",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPositionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "guard",
    "outputs": [
      {
        "internalType": "contract ICausoraGuard",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "markAtRisk",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "positionIds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "positions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "collateralAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "debtAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "createdAt",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "lastUpdatedAt",
        "type": "uint64"
      },
      {
        "internalType": "enum ILendingPositionManager.PositionState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "lastEvidenceDigest",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registry",
    "outputs": [
      {
        "internalType": "contract ICausoraRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "relationEngine",
    "outputs": [
      {
        "internalType": "contract IRelationEngine",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "queryIdRescue",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "queryIdLiquidation",
        "type": "bytes32"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "parentDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "capabilityHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "stateCommitment",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "sequenceNumber",
            "type": "uint64"
          },
          {
            "internalType": "bytes",
            "name": "signatureOrProof",
            "type": "bytes"
          }
        ],
        "internalType": "struct IRelationEngine.CausalWitness",
        "name": "witness",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "additionalCollateral",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      }
    ],
    "name": "resolveCollateralRace",
    "outputs": [
      {
        "internalType": "enum ICausoraGuard.GuardDecision",
        "name": "decision",
        "type": "uint8"
      },
      {
        "internalType": "enum ILendingPositionManager.PositionState",
        "name": "finalState",
        "type": "uint8"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "riskEvaluators",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setRiskEvaluator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [
      {
        "internalType": "contract ICausoraVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CAUSORA_VAULT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_collateralToken",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "available",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "required",
        "type": "uint256"
      }
    ],
    "name": "InsufficientVaultCollateral",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidGuardDecision",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "PositionIsHeld",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PositionManagerAlreadySet",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnauthorizedCaller",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "depositor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "CollateralDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "positionManager",
        "type": "address"
      }
    ],
    "name": "PositionManagerUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "lockedAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "VaultCollateralHeld",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VaultCollateralReleased",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "collateralToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "depositCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "enum ICausoraGuard.GuardDecision",
        "name": "decision",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "executeProtectedTransition",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "isHeld",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lockedCollateral",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "positionManager",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_positionManager",
        "type": "address"
      }
    ],
    "name": "setPositionManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const MOCK_ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const BLOCK_PROVER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "height",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "transactionIndex",
        "type": "uint64"
      }
    ],
    "name": "TransactionVerified",
    "type": "event"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof",
        "name": "merkleProof",
        "type": "tuple"
      }
    ],
    "name": "calculateTxIndex",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64[]",
        "name": "heights",
        "type": "uint64[]"
      },
      {
        "internalType": "bytes[]",
        "name": "encodedTransactions",
        "type": "bytes[]"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof[]",
        "name": "merkleProofs",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "lowerEndpointDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32[]",
            "name": "roots",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "name": "sharedContinuityProof",
        "type": "tuple"
      }
    ],
    "name": "verify",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "height",
        "type": "uint64"
      },
      {
        "internalType": "bytes",
        "name": "encodedTransaction",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof",
        "name": "merkleProof",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "lowerEndpointDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32[]",
            "name": "roots",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "name": "continuityProof",
        "type": "tuple"
      }
    ],
    "name": "verify",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "height",
        "type": "uint64"
      },
      {
        "internalType": "bytes",
        "name": "encodedTransaction",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof",
        "name": "merkleProof",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "lowerEndpointDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32[]",
            "name": "roots",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "name": "continuityProof",
        "type": "tuple"
      }
    ],
    "name": "verifyAndEmit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64[]",
        "name": "heights",
        "type": "uint64[]"
      },
      {
        "internalType": "bytes[]",
        "name": "encodedTransactions",
        "type": "bytes[]"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "root",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
              },
              {
                "internalType": "bool",
                "name": "isLeft",
                "type": "bool"
              }
            ],
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "name": "siblings",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.MerkleProof[]",
        "name": "merkleProofs",
        "type": "tuple[]"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "lowerEndpointDigest",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32[]",
            "name": "roots",
            "type": "bytes32[]"
          }
        ],
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "name": "sharedContinuityProof",
        "type": "tuple"
      }
    ],
    "name": "verifyAndEmit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const CHAIN_INFO_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "targetHeight",
        "type": "uint64"
      }
    ],
    "name": "get_attestation_bounds",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "parentHeight",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "parentHash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "parentIsAttestation",
            "type": "bool"
          },
          {
            "internalType": "uint64",
            "name": "childHeight",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "childHash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "childIsAttestation",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isAttested",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.BoundsCheckResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      }
    ],
    "name": "get_attestation_genesis_height",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "genesisHeight",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "bytes32",
        "name": "digest",
        "type": "bytes32"
      }
    ],
    "name": "get_attestation_height_for_digest",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "height",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.HeightResult",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      }
    ],
    "name": "get_chain_by_key",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "uint64",
                "name": "chainKey",
                "type": "uint64"
              },
              {
                "internalType": "uint64",
                "name": "chainId",
                "type": "uint64"
              },
              {
                "internalType": "bytes",
                "name": "chainName",
                "type": "bytes"
              },
              {
                "internalType": "uint8",
                "name": "chainEncoding",
                "type": "uint8"
              }
            ],
            "internalType": "struct IChainInfo.ChainInfo",
            "name": "info",
            "type": "tuple"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.ChainInfoResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "height",
        "type": "uint64"
      }
    ],
    "name": "get_checkpoint_for_height",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.HashResult",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      }
    ],
    "name": "get_latest_attestation_height_and_hash",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "height",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "isAttestation",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.HeightHashResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      }
    ],
    "name": "get_latest_checkpoint_height_and_hash",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "height",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          },
          {
            "internalType": "bool",
            "name": "isAttestation",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct IChainInfo.HeightHashResult",
        "name": "result",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "get_supported_chains",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "chainKey",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "chainId",
            "type": "uint64"
          },
          {
            "internalType": "bytes",
            "name": "chainName",
            "type": "bytes"
          },
          {
            "internalType": "uint8",
            "name": "chainEncoding",
            "type": "uint8"
          }
        ],
        "internalType": "struct IChainInfo.ChainInfo[]",
        "name": "chains",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "chainKey",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "targetHeight",
        "type": "uint64"
      }
    ],
    "name": "is_height_attested",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isAttested",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CONTRACT_ADDRESSES = {
  blockProver: '0x0000000000000000000000000000000000000FD2',
  chainInfo: '0x0000000000000000000000000000000000000fD3',
  causoraRegistry: (process.env.NEXT_PUBLIC_CAUSORA_REGISTRY_ADDRESS || '0x9D0ED40615845ee6134F475AcCF35e0412CA1EdF') as `0x${string}`,
  relationEngine: (process.env.NEXT_PUBLIC_RELATION_ENGINE_ADDRESS || '0xFa34633c12e5A93166FAA0E54A3D50Fd62Ae8D49') as `0x${string}`,
  causoraGuard: (process.env.NEXT_PUBLIC_CAUSORA_GUARD_ADDRESS || '0x029192f49d95eD5B147cE7E6Fc18d01BDfb513c5') as `0x${string}`,
  lendingPositionManager: (process.env.NEXT_PUBLIC_LENDING_MANAGER_ADDRESS || '0x33979FFdC1B60cF727A90c043f1EC5CB15f6BB91') as `0x${string}`,
  causoraVault: (process.env.NEXT_PUBLIC_CAUSORA_VAULT_ADDRESS || '0x7047D67Ef69F40F9340Fd97EDF79276458238cfe') as `0x${string}`,
  mockERC20: (process.env.NEXT_PUBLIC_MOCK_ERC20_ADDRESS || '0x43410D288dFA265A560eb7DfFCa2991fA687d78d') as `0x${string}`,
} as const;
