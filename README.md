# NoteChain 📝 | Decentralized Note-Taking DApp

NoteChain is a secure, decentralized note-taking application built on the Solana blockchain. Designed to eliminate the need for centralized databases, this project leverages the speed and low fees of Solana to provide users with a fully on-chain, censorship-resistant platform for personal and collaborative notes. 

The smart contract (program) is written in Rust using the Anchor framework, providing a robust backend that seamlessly integrates with a modern Next.js/React frontend.

## 📖 Project Overview

Traditional note-taking apps rely on central servers, leaving user data vulnerable to breaches or platform lock-in. NoteChain solves this by giving users absolute cryptographic ownership of their data. Every note, user profile, and sharing permission is strictly governed by smart contract logic and validated via the user's wallet signature. 

This project demonstrates advanced Solana blockchain development concepts, including Program Derived Addresses (PDAs), secure state management,secure multi-user access,and on-chain data ownership.

## ✨ Key Features

* **Wallet-Linked User Profiles**: Users initialize a unique on-chain profile mapped directly to their Solana wallet address, tracking their total note count and identity.
* **100% On-Chain Storage**: Full CRUD (Create, Read, Update, Delete) functionality where note content is stored securely on the Solana ledger.
* **Secure Collaboration (The "Shared with Friend" Feature)**: A standout collaborative feature that allows a note owner to grant specific edit permissions to a friend's wallet. The collaborator can update the note seamlessly without altering the original ownership rights.
* **Frontend-Ready**: Designed with highly optimized data structures to be easily consumed by a Next.js (TypeScript) client.

## 🛠️ Tech Stack

* **Smart Contract / Backend**: Rust, Anchor Framework
* **Blockchain Network**: Solana (Devnet)
* **Testing & Scripting**: TypeScript, Mocha, Chai, `@coral-xyz/anchor`
* **Target Client-Side**: Next.js, React, Tailwind CSS (Dark Theme UI optimized)

## 🧠 Architecture & State Management

Instead of traditional database tables, NoteChain uses **Program Derived Addresses (PDAs)** to deterministically locate and manage state. This ensures O(1) lookup times and strict data isolation.

1. **`UserProfile` PDA**: 
   * **Seeds**: `[b"user_profile", wallet_address]`
   * **Role**: Acts as the root account for a user. Stores their chosen username and acts as an auto-incrementing counter (`note_count`) to assign unique IDs to new notes.
2. **`Note` PDA**: 
   * **Seeds**: `[b"note", wallet_address, note_id]`
   * **Role**: The core data structure. Holds the note's title, content, and the public key of the original author.
3. **`SharedAccess` PDA**: 
   * **Seeds**: `[b"share", note_pda, friend_wallet_address]`
   * **Role**: A decentralized permission slip. It cryptographically binds a specific note to a specific collaborator's wallet, enabling secure multi-user editing.

## 🛡️ Robust Security Constraints

Security is a primary focus of this smart contract. The program heavily utilizes Anchor's constraint system to prevent unauthorized access and malicious data manipulation:

* **Signer Validation**: Operations like creating, updating, or deleting notes strictly require the `signer` to match the note's `authority`.
* **`has_one` Constraints**: Automatically verifies that the authority account passed in the transaction exactly matches the authority stored inside the Note or User Profile.
* **Custom Error Handling**: Implements explicit `ErrorCode::UnauthorizedAccess` to cleanly reject invalid operations (e.g., a user trying to edit a note they don't own).
* **Secure Account Closing**: The `delete_note` instruction safely closes the PDA account and refunds the rent lamports back to the original signer, preventing stranded data.

## 🧪 Testing

The test suite covers the full workflow:

* user creation
* note creation
* note updates
* sharing notes
* collaborator updates
* note deletion

Tests simulate real multi-user behavior, including shared access.

## 🚀 Local Setup & Installation

Follow these steps to run the blockchain backend and test suite locally.

### Prerequisites
* Rust
* Solana CLI
* Anchor CLI
* Node.js & Yarn (or npm)

### Quick Start

1. Clone the repository
   ```bash
   git clone <your-repository-url>
   cd notechain

2. Install dependencies
   ```bash
    npm install   

3. Build the Anchor program
   ```bash
   anchor build

4. Start local Solana validator
   ```bash
   solana-test-validator

5. Deploy the program
   ```bash
   anchor deploy  

6. Run tests
   ```bash
   anchor test 

## 👨‍💻 Author

Piyush Raj   

## 📄 License

This project is licensed under the MIT License.

