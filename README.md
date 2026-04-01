Solana Notes: A Decentralized CRUD Application
A high-performance, decentralized note-taking application built on the Solana Blockchain using the Anchor Framework. This project demonstrates advanced Solana concepts like Program Derived Addresses (PDAs), deterministic account derivation, and on-chain state management.

🚀 Overview
Unlike traditional MERN stack applications where data is stored in a centralized database (like MongoDB), Solana Notes stores every user profile and individual note as a unique account on the Solana ledger. By leveraging PDAs, the application ensures that data is easily retrievable without a centralized indexer while maintaining strict ownership security.

🛠 Tech Stack
Smart Contract: Rust, Anchor Framework

Language: Rust (Backend), TypeScript (Testing/Frontend)

Tools: Solana CLI, Mocha/Chai (Testing), Borsh (Serialization)

Blockchain: Solana (Devnet/Localhost)

🏗 Architecture & Key Features
1. Deterministic PDA Mapping
Instead of searching a database, the program derives addresses based on user seeds.

User Profile PDA: ["user_profile", wallet_pubkey]

Note PDA: ["note", wallet_pubkey, note_id]
This ensures that every user has a unique namespace and notes are indexed numerically.

2. State Management
User Profiles: Tracks metadata and a global note_count for each user.

On-Chain CRUD: Full support for Creating, Reading, Updating, and Deleting (Closing) accounts.

Rent Management: Uses Anchor's close constraint to delete accounts and reclaim Lamports (SOL), ensuring cost-efficient storage.

3. Robust Security Constraints
Ownership Verification: Uses has_one = authority and custom error_codes to ensure only the creator can modify or delete their notes.

Space Optimization: Implements InitSpace to precisely calculate and allocate account memory, minimizing rent costs.

💻 Smart Contract Instructions

Instruction	Description	Security Check
create_user	Initializes a new UserProfile PDA for a unique wallet.	Prevents duplicate profiles using init.
Notes	Increments user's note_count and initializes a new Note PDA.	Validates signer is the profile owner.
update_note	Modifies the content field of an existing Note account.	Ensures signer == authority.
delete_note	Closes the account and returns SOL to the payer.	Verifies ownership before closing.

🧪 Testing
The project includes a comprehensive TypeScript test suite using Anchor's Mocha/Chai integration.

Bash
# To run the tests
anchor test
The tests verify:

Correct PDA derivation on the client-side.

Successful state transitions (Create -> Update -> Delete).

Unauthorized access prevention (Security Test).

📈 Future Roadmap
Frontend Integration: Developing a React/Next.js dashboard using @solana/wallet-adapter.

Encryption: Implementing client-side AES encryption so only the owner can read note content.

Tags & Categories: Adding metadata fields to notes for better organization.

👨‍💻 Author
Piyush – Final Year CS Student



