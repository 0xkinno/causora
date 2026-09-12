// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IEvmV1Decoder} from "../interfaces/IEvmV1Decoder.sol";

/// @title EvmV1Decoder
/// @notice Pure Solidity decoder for official Attestcoin EVM v1 (uint8 txType, bytes[] chunks) transactions and receipts
library EvmV1Decoder {
    function getTransactionType(bytes memory encodedTx) internal pure returns (uint8 txType) {
        require(encodedTx.length >= 32, "Encoded TX too short");
        // In abi.encode(uint8 txType, bytes[] chunks), the first 32 bytes word is txType
        uint256 rawType;
        assembly {
            rawType := mload(add(encodedTx, 32))
        }
        return uint8(rawType);
    }

    function isValidTransactionType(uint8 txType) internal pure returns (bool) {
        return txType <= 4;
    }

    function decodeCommonTxFields(bytes memory encodedTx) internal pure returns (IEvmV1Decoder.CommonTxFields memory commonTx) {
        (, bytes[] memory chunks) = abi.decode(encodedTx, (uint8, bytes[]));
        require(chunks.length >= 2, "Insufficient chunks for common fields");
        
        (
            uint64 nonce,
            uint64 gasLimit,
            address from,
            bool toIsNull,
            address to,
            uint256 value,
            bytes memory data
        ) = abi.decode(chunks[0], (uint64, uint64, address, bool, address, uint256, bytes));

        commonTx = IEvmV1Decoder.CommonTxFields({
            nonce: nonce,
            gasLimit: gasLimit,
            from: from,
            toIsNull: toIsNull,
            to: to,
            value: value,
            data: data
        });
    }

    function decodeReceiptFields(bytes memory encodedTx) internal pure returns (IEvmV1Decoder.ReceiptFields memory receipt) {
        (, bytes[] memory chunks) = abi.decode(encodedTx, (uint8, bytes[]));
        require(chunks.length >= 2, "Insufficient chunks for receipt fields");
        
        // Receipt fields are in the last chunk
        bytes memory receiptChunk = chunks[chunks.length - 1];

        (
            uint8 receiptStatus,
            uint64 receiptGasUsed,
            IEvmV1Decoder.LogEntry[] memory receiptLogs,
            bytes memory receiptLogsBloom
        ) = abi.decode(receiptChunk, (uint8, uint64, IEvmV1Decoder.LogEntry[], bytes));

        receipt = IEvmV1Decoder.ReceiptFields({
            receiptStatus: receiptStatus,
            receiptGasUsed: receiptGasUsed,
            receiptLogs: receiptLogs,
            receiptLogsBloom: receiptLogsBloom
        });
    }

    function getLogsByEventSignature(
        IEvmV1Decoder.ReceiptFields memory receipt,
        bytes32 eventSignature
    ) internal pure returns (IEvmV1Decoder.LogEntry[] memory matched) {
        uint256 count = 0;
        for (uint256 i = 0; i < receipt.receiptLogs.length; i++) {
            if (receipt.receiptLogs[i].topics.length > 0 && receipt.receiptLogs[i].topics[0] == eventSignature) {
                count++;
            }
        }

        matched = new IEvmV1Decoder.LogEntry[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < receipt.receiptLogs.length; i++) {
            if (receipt.receiptLogs[i].topics.length > 0 && receipt.receiptLogs[i].topics[0] == eventSignature) {
                matched[idx] = receipt.receiptLogs[i];
                idx++;
            }
        }
    }
}
