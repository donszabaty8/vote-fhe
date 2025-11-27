// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedPolls
 * @notice Multi-option polling with FHE votes and public, verifiable tallies.
 * @dev Uses self-relaying decryption pattern for transparent result revelation
 */
contract EncryptedPolls is ZamaEthereumConfig {
    address public owner;

    struct Poll {
        address creator;
        string question;
        string[] options;
        uint64 startTime;
        uint64 endTime;
        bool finalized;
        uint256 voteCount;
        bool revealRequested;
    }

    struct Vote {
        address voter;
        euint8 encryptedChoice;
    }

    struct Tally {
        uint256[] counts; // aligns with poll.options length
        bytes proof;      // decryption proof for verification
    }

    uint256 private nextPollId = 1;

    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(uint256 => Vote)) private pollVotes;
    mapping(uint256 => mapping(address => bool)) private hasVoted;
    mapping(uint256 => Tally) public tallies;

    event PollCreated(uint256 indexed pollId, address indexed creator, uint256 optionCount, uint64 startTime, uint64 endTime);
    event VoteCast(uint256 indexed pollId, uint256 indexed voteId, address indexed voter);
    event PollRevealRequested(uint256 indexed pollId, bytes32[] handles);
    event TallyFinalized(uint256 indexed pollId, uint256[] counts, uint256 totalVotes);

    error InvalidPoll();
    error InvalidOptionCount();
    error InvalidSchedule();
    error PollNotActive();
    error AlreadyVoted();
    error PollNotClosed();
    error AlreadyFinalized();
    error IncompleteVotes();
    error AlreadyRequested();
    error NotRequested();
    error InvalidChoiceCount();
    error ProofVerificationFailed();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @notice Create a new poll with arbitrary option labels and schedule.
     */
    function createPoll(
        string calldata question,
        string[] calldata optionLabels,
        uint64 startTime,
        uint64 endTime
    ) external returns (uint256 pollId) {
        if (optionLabels.length < 2) revert InvalidOptionCount();
        if (endTime <= startTime || endTime <= block.timestamp) revert InvalidSchedule();

        pollId = nextPollId++;
        Poll storage poll = polls[pollId];
        poll.creator = msg.sender;
        poll.question = question;

        string[] memory copiedOptions = new string[](optionLabels.length);
        for (uint256 i = 0; i < optionLabels.length; i++) {
            copiedOptions[i] = optionLabels[i];
        }
        poll.options = copiedOptions;
        poll.startTime = startTime;
        poll.endTime = endTime;

        emit PollCreated(pollId, msg.sender, optionLabels.length, startTime, endTime);
    }

    /**
     * @notice Cast one encrypted vote for a poll option (index-based).
     */
    function castVote(uint256 pollId, externalEuint8 encryptedChoiceHandle, bytes calldata inputProof) external {
        Poll storage poll = polls[pollId];
        if (poll.creator == address(0)) revert InvalidPoll();
        if (block.timestamp < poll.startTime || block.timestamp > poll.endTime) revert PollNotActive();
        if (hasVoted[pollId][msg.sender]) revert AlreadyVoted();

        uint256 voteId = ++poll.voteCount;
        hasVoted[pollId][msg.sender] = true;

        euint8 encryptedChoice = FHE.fromExternal(encryptedChoiceHandle, inputProof);
        pollVotes[pollId][voteId] = Vote({voter: msg.sender, encryptedChoice: encryptedChoice});

        // Allow sender to view their own vote
        FHE.allow(encryptedChoice, msg.sender);
        // Allow contract to access for decryption
        FHE.allowThis(encryptedChoice);

        emit VoteCast(pollId, voteId, msg.sender);
    }

    /**
     * @notice Request public decryption of poll results (Step 1 of 2)
     * @dev Makes all encrypted votes publicly decryptable
     */
    function requestPollReveal(uint256 pollId) external {
        Poll storage poll = polls[pollId];
        if (poll.creator == address(0)) revert InvalidPoll();
        if (block.timestamp < poll.endTime) revert PollNotClosed();
        if (poll.finalized) revert AlreadyFinalized();
        if (poll.revealRequested) revert AlreadyRequested();
        if (poll.voteCount == 0) revert IncompleteVotes();

        poll.revealRequested = true;

        // Mark all votes as publicly decryptable
        bytes32[] memory handles = new bytes32[](poll.voteCount);
        for (uint256 voteId = 1; voteId <= poll.voteCount; voteId++) {
            euint8 encChoice = pollVotes[pollId][voteId].encryptedChoice;
            FHE.makePubliclyDecryptable(encChoice);
            handles[voteId - 1] = FHE.toBytes32(encChoice);
        }

        emit PollRevealRequested(pollId, handles);
    }

    /**
     * @notice Submit decrypted results with proof (Step 2 of 2)
     * @dev Anyone can call this after requestPollReveal
     * @param pollId The poll ID
     * @param abiEncodedChoices ABI-encoded uint8[] from publicDecrypt
     * @param decryptionProof Proof returned by publicDecrypt
     */
    function resolvePollCallback(
        uint256 pollId,
        bytes calldata abiEncodedChoices,
        bytes calldata decryptionProof
    ) external {
        Poll storage poll = polls[pollId];
        if (poll.creator == address(0)) revert InvalidPoll();
        if (!poll.revealRequested) revert NotRequested();
        if (poll.finalized) revert AlreadyFinalized();

        // Reconstruct handles array
        bytes32[] memory handles = new bytes32[](poll.voteCount);
        for (uint256 voteId = 1; voteId <= poll.voteCount; voteId++) {
            handles[voteId - 1] = FHE.toBytes32(pollVotes[pollId][voteId].encryptedChoice);
        }

        // Verify decryption proof
        FHE.checkSignatures(handles, abiEncodedChoices, decryptionProof);

        // Decode decrypted choices as tuple (uint8, uint8, ...)
        // Extract each uint8 value individually from the encoded data
        uint256 optionCount = poll.options.length;
        uint256[] memory counts = new uint256[](optionCount);

        uint8[] memory clearChoices = new uint8[](poll.voteCount);
        for (uint256 i = 0; i < poll.voteCount; i++) {
            // Decode each uint8 from position i * 32 (each value padded to 32 bytes)
            uint8 choice;
            assembly {
                // Load the uint8 from the calldata (skip 4-byte selector + offset)
                // Each value is at position: 32*i + offset
                let offset := add(abiEncodedChoices.offset, mul(i, 32))
                choice := and(calldataload(offset), 0xff)
            }

            require(choice < optionCount, "Choice out of bounds");
            clearChoices[i] = choice;
            counts[choice] += 1;
        }

        // Store final results
        poll.finalized = true;
        tallies[pollId] = Tally({counts: counts, proof: decryptionProof});

        emit TallyFinalized(pollId, counts, poll.voteCount);
    }

    function getPoll(uint256 pollId) external view returns (Poll memory) {
        return polls[pollId];
    }

    function getEncryptedVote(uint256 pollId, uint256 voteId) external view returns (euint8) {
        return pollVotes[pollId][voteId].encryptedChoice;
    }

    function getTally(uint256 pollId) external view returns (Tally memory) {
        Poll storage poll = polls[pollId];
        if (!poll.finalized) revert AlreadyFinalized(); // reuse error to signal "not ready"
        return tallies[pollId];
    }

    function hasUserVoted(uint256 pollId, address user) external view returns (bool) {
        return hasVoted[pollId][user];
    }
}
