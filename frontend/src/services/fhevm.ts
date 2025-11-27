import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { FHEVMInstance } from '../config/fhevm';

export interface Poll {
  id: number;
  creator: string;
  question: string;
  options: string[];
  startTime: number;
  endTime: number;
  finalized: boolean;
  voteCount: number;
  revealRequested: boolean;
}

export interface VoteResult {
  option: string;
  count: number;
  percentage: number;
}

export class FHEVMService {
  private fhevm: FHEVMInstance | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  // Initialize service
  async initialize(fhevmInstance: FHEVMInstance, signer: ethers.Signer) {
    this.fhevm = fhevmInstance;
    this.signer = signer;
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    console.log('✅ FHEVM Service initialized');
    console.log('Contract Address:', CONTRACT_ADDRESS);
  }

  // Create poll
  async createPoll(question: string, options: string[], durationMinutes: number): Promise<number> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized');
    }

    console.log('🚀 Creating poll...', { question, options, durationMinutes });

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 10; // Start in 10 seconds
    const endTime = startTime + (durationMinutes * 60);

    // Predict Poll ID
    const pollId = await this.contract.createPoll.staticCall(question, options, startTime, endTime);
    console.log('📋 Predicted Poll ID:', pollId.toString());

    // Submit transaction
    const tx = await this.contract.createPoll(question, options, startTime, endTime);
    console.log('📤 Transaction submitted:', tx.hash);

    await tx.wait();
    console.log('✅ Poll created successfully');

    return Number(pollId);
  }

  // Submit vote
  async submitVote(pollId: number, optionIndex: number): Promise<string> {
    if (!this.fhevm || !this.contract || !this.signer) {
      throw new Error('Service not initialized');
    }

    console.log('🗳️ Submitting vote...', { pollId, optionIndex });

    const userAddress = await this.signer.getAddress();

    // 1. Encrypt vote option
    console.log('🔐 Encrypting vote option...');
    const encryptedVote = await this.fhevm
      .createEncryptedInput(CONTRACT_ADDRESS, userAddress)
      .add8(optionIndex)
      .encrypt();

    console.log('✅ Vote encrypted:', {
      handle: ethers.hexlify(encryptedVote.handles[0]),
      proofLength: encryptedVote.inputProof.length
    });

    // 2. Submit vote transaction
    const voteTx = await this.contract.castVote(
      pollId,
      encryptedVote.handles[0],
      encryptedVote.inputProof
    );

    console.log('📤 Vote transaction submitted:', voteTx.hash);
    await voteTx.wait();
    console.log('✅ Vote submitted successfully');

    return voteTx.hash;
  }

  // Get poll information
  async getPoll(pollId: number): Promise<Poll> {
    if (!this.contract) {
      throw new Error('Service not initialized');
    }

    const poll = await this.contract.getPoll(pollId);

    return {
      id: pollId,
      creator: poll.creator,
      question: poll.question,
      options: poll.options,
      startTime: Number(poll.startTime),
      endTime: Number(poll.endTime),
      finalized: poll.finalized,
      voteCount: Number(poll.voteCount),
      revealRequested: poll.revealRequested,
    };
  }

  // Check if user has voted
  async hasUserVoted(pollId: number, userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Service not initialized');
    }

    return await this.contract.hasUserVoted(pollId, userAddress);
  }

  /**
   * Request poll reveal and decrypt results using public decryption
   * Self-relaying pattern: requestPollReveal → publicDecrypt → resolvePollCallback
   */
  async decryptResults(pollId: number): Promise<VoteResult[]> {
    if (!this.fhevm || !this.contract || !this.signer) {
      throw new Error('Service not initialized');
    }

    console.log('🔓 Starting public decryption for poll:', pollId);

    // 1. Get poll information
    const poll = await this.getPoll(pollId);

    if (poll.voteCount === 0) {
      console.log('⚠️ No votes to decrypt');
      return poll.options.map(option => ({ option, count: 0, percentage: 0 }));
    }

    // 2. Check if results already finalized
    if (poll.finalized) {
      console.log('ℹ️ Results already finalized, fetching from contract');
      const tally = await this.contract.getTally(pollId);
      const counts = tally.counts.map((c: any) => Number(c));
      const totalVotes = counts.reduce((a: number, b: number) => a + b, 0);

      return poll.options.map((option, index) => ({
        option,
        count: counts[index],
        percentage: totalVotes > 0 ? (counts[index] / totalVotes) * 100 : 0,
      }));
    }

    // 3. Request reveal if not yet requested
    if (!poll.revealRequested) {
      console.log('📢 Requesting poll reveal...');
      const revealTx = await this.contract.requestPollReveal(pollId);
      console.log('📤 Reveal request transaction:', revealTx.hash);

      const receipt = await revealTx.wait();
      console.log('✅ Reveal requested');

      // Find the PollRevealRequested event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed && parsed.name === 'PollRevealRequested';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('PollRevealRequested event not found');
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      const handles = parsedEvent!.args.handles;

      console.log('🔑 Handles to decrypt:', handles.length);

      // 4. Public decrypt
      console.log('🔓 Decrypting results using public decrypt...');
      const result = await this.fhevm.publicDecrypt(handles);

      console.log('✅ Decryption complete');

      // 5. Extract decrypted values
      const decryptedChoices: number[] = handles.map((handle: string) => {
        const value = result.clearValues[handle];
        if (value === undefined) {
          throw new Error(`Missing decrypted value for handle ${handle}`);
        }
        return typeof value === 'bigint' ? Number(value) : Number(value);
      });

      console.log('🎯 Decrypted choices:', decryptedChoices);
      console.log('📦 SDK abiEncodedClearValues:', result.abiEncodedClearValues);

      // 6. Encode as tuple (uint8, uint8, ...) not uint8[]
      // This matches what FHEVM SDK does and what the proof expects
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const types = decryptedChoices.map(() => 'uint8'); // ['uint8', 'uint8', ...]
      const encodedChoices = abiCoder.encode(types, decryptedChoices);
      console.log('📦 Tuple-encoded choices:', encodedChoices);

      // 7. Submit proof back to contract
      console.log('📤 Submitting decryption proof to contract...');
      const callbackTx = await this.contract.resolvePollCallback(
        pollId,
        encodedChoices,  // Use tuple encoding
        result.decryptionProof
      );

      console.log('📤 Callback transaction:', callbackTx.hash);
      await callbackTx.wait();
      console.log('✅ Results finalized on-chain');

      // 7. Calculate and return results
      const optionCounts = Array.from({ length: poll.options.length }, () => 0);
      decryptedChoices.forEach(choice => {
        if (choice >= 0 && choice < optionCounts.length) {
          optionCounts[choice] += 1;
        }
      });

      const totalVotes = decryptedChoices.length;
      const results: VoteResult[] = poll.options.map((option, index) => ({
        option,
        count: optionCounts[index],
        percentage: totalVotes > 0 ? (optionCounts[index] / totalVotes) * 100 : 0,
      }));

      console.log('🏁 Final results:', results);
      return results;

    } else {
      // Reveal already requested, try to complete the process
      console.log('ℹ️ Reveal already requested, completing decryption...');

      // Collect handles
      const handles: string[] = [];
      for (let voteId = 1; voteId <= poll.voteCount; voteId++) {
        const encryptedVote = await this.contract.getEncryptedVote(pollId, voteId);
        const handle = ethers.zeroPadValue(ethers.hexlify(encryptedVote), 32);
        handles.push(handle);
      }

      // Public decrypt
      const result = await this.fhevm.publicDecrypt(handles);

      // Extract values
      const decryptedChoices: number[] = handles.map((handle: string) => {
        const value = result.clearValues[handle];
        return typeof value === 'bigint' ? Number(value) : Number(value);
      });

      // Encode as tuple (uint8, uint8, ...)
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const types = decryptedChoices.map(() => 'uint8');
      const encodedChoices = abiCoder.encode(types, decryptedChoices);

      // Submit proof
      const callbackTx = await this.contract.resolvePollCallback(
        pollId,
        encodedChoices,  // Use tuple encoding
        result.decryptionProof
      );

      await callbackTx.wait();

      // Calculate results
      const optionCounts = Array.from({ length: poll.options.length }, () => 0);
      decryptedChoices.forEach(choice => {
        if (choice >= 0 && choice < optionCounts.length) {
          optionCounts[choice] += 1;
        }
      });

      const totalVotes = decryptedChoices.length;
      return poll.options.map((option, index) => ({
        option,
        count: optionCounts[index],
        percentage: totalVotes > 0 ? (optionCounts[index] / totalVotes) * 100 : 0,
      }));
    }
  }

  // Get all polls (with validation check)
  async getAllPolls(): Promise<Poll[]> {
    if (!this.contract) {
      throw new Error('Service not initialized');
    }

    const polls: Poll[] = [];
    console.log('📊 Fetching polls from chain...');

    try {
      let pollId = 1;
      let consecutiveEmptyPolls = 0;
      const maxConsecutiveEmpty = 3;

      while (pollId <= 50 && consecutiveEmptyPolls < maxConsecutiveEmpty) {
        try {
          console.log(`🔍 Checking poll ID: ${pollId}`);
          const poll = await this.getPoll(pollId);

          // Check if poll is valid
          const isPollValid = poll.creator !== '0x0000000000000000000000000000000000000000' &&
                             poll.question &&
                             poll.question.trim() !== '' &&
                             poll.options &&
                             poll.options.length > 0;

          if (isPollValid) {
            polls.push(poll);
            consecutiveEmptyPolls = 0;
            console.log(`✅ Found valid poll ${pollId}: ${poll.question}`);
          } else {
            consecutiveEmptyPolls++;
            console.log(`❌ Poll ${pollId} invalid (consecutive empty: ${consecutiveEmptyPolls})`);
          }
        } catch (error: any) {
          consecutiveEmptyPolls++;
          console.log(`❌ Cannot fetch poll ${pollId}: ${error.message}`);
        }
        pollId++;
      }

      console.log(`✅ Fetch complete, found ${polls.length} valid polls`);
    } catch (error) {
      console.error('Error fetching polls:', error);
      throw error;
    }

    return polls.reverse(); // Newest first
  }
}
