// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustChainProof {
    mapping(bytes32 => bool) public proofs;

    event ProofStored(bytes32 indexed proofHash, uint256 timestamp);

    function storeProof(bytes32 proofHash) external {
        require(!proofs[proofHash], "Proof already exists");
        proofs[proofHash] = true;
        emit ProofStored(proofHash, block.timestamp);
    }
}
