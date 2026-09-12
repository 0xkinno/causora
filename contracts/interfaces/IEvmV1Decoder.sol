// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEvmV1Decoder {
    struct CommonTxFields {
        uint64 nonce;
        uint64 gasLimit;
        address from;
        bool toIsNull;
        address to;
        uint256 value;
        bytes data;
    }

    struct LogEntry {
        address address_;
        bytes32[] topics;
        bytes data;
    }

    struct ReceiptFields {
        uint8 receiptStatus;
        uint64 receiptGasUsed;
        LogEntry[] receiptLogs;
        bytes receiptLogsBloom;
    }

    struct LegacyFields {
        uint128 gasPrice;
        uint256 v;
        bytes32 r;
        bytes32 s;
    }

    struct AccessListEntry {
        address account;
        bytes32[] storageKeys;
    }

    struct Type1Fields {
        uint64 chainId;
        uint128 gasPrice;
        AccessListEntry[] accessList;
        uint8 yParity;
        bytes32 r;
        bytes32 s;
    }

    struct Type2Fields {
        uint64 chainId;
        uint128 maxPriorityFeePerGas;
        uint128 maxFeePerGas;
        AccessListEntry[] accessList;
        uint8 yParity;
        bytes32 r;
        bytes32 s;
    }

    function getTransactionType(bytes calldata encodedTx) external pure returns (uint8 txType);
    function isValidTransactionType(uint8 txType) external pure returns (bool);
    function decodeCommonTxFields(bytes calldata chunk) external pure returns (CommonTxFields memory);
    function decodeReceiptFields(bytes calldata chunk) external pure returns (ReceiptFields memory);
    function getLogsByEventSignature(ReceiptFields calldata receipt, bytes32 eventSignature) external pure returns (LogEntry[] memory);
    function getLogsByEventSignature(LogEntry[] calldata logs, bytes32 eventSignature) external pure returns (LogEntry[] memory);
}
