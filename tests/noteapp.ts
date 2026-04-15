import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NoteApp } from "../target/types/note_app";
import { expect } from "chai";

describe("note_app", () => {

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NoteApp as Program<NoteApp>;
  const wallet = provider.wallet as anchor.Wallet;


  const [userProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const friend = anchor.web3.Keypair.generate();

  it("Creates a user profile", async () => {
    const username = "testuser";

    const tx = await program.methods
      .createUser(username)
      .accounts({
        userProfile: userProfilePda,
        signer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("User created! Transaction signature:", tx);

    
    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    
    expect(userProfile.username).to.equal(username);
    expect(userProfile.noteCount.toNumber()).to.equal(0);
    console.log("User profile:", userProfile);
  });

  it("Creates a note", async () => {
    const title = "My First Note";
    const content = "This is the content of my first note!";

   
    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    const nextNoteId = userProfile.noteCount.toNumber() + 1;

 
    const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(nextNoteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .createNote(title, content)
      .accounts({
        userProfile: userProfilePda,
        note: notePda,
        signer: wallet.publicKey,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Note created! Transaction signature:", tx);

   
    const note = await program.account.note.fetch(notePda);
    
    expect(note.title).to.equal(title);
    expect(note.content).to.equal(content);
    expect(note.id.toNumber()).to.equal(1);
    console.log("Note:", note);
  });

  it("Updates a note", async () => {
    const noteId = 1;
    const newContent = "This is the UPDATED content!";

    const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(noteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .updateNote(new anchor.BN(noteId), newContent)
      .accounts({
        note: notePda,
        signer: wallet.publicKey,
        authority: wallet.publicKey,
      })
      .rpc();

    console.log("Note updated! Transaction signature:", tx);

    const note = await program.account.note.fetch(notePda);
    expect(note.content).to.equal(newContent);
    console.log("Updated note:", note);
  });

  it("Shares a note with a friend", async () => {
    const noteId = 1;

    // Note PDA
    const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(noteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Shared Access PDA (Seeds: "share" + notePda + friendPubkey)
    const [sharedAccessPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share"), notePda.toBuffer(), friend.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .shareNote(friend.publicKey)
      .accounts({
        signer: wallet.publicKey,
        note: notePda,
        sharedAccess: sharedAccessPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Note shared with friend! Tx:", tx);

    // Verify
    const sharedAccount = await program.account.sharedAccess.fetch(sharedAccessPda);
    expect(sharedAccount.friend.toBase58()).to.equal(friend.publicKey.toBase58());
  });

  it("Friend can update the shared note", async () => {
    const noteId = 1;
    const sharedContent = "This note was updated by my friend!";

      // Airdrop some SOL to the friend so they can pay for transactions
    const signature = await provider.connection.requestAirdrop(
      friend.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });

    // Note PDA (Seeds: "note" + ownerPubkey + noteId)
    const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(noteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Shared Access PDA
    const [sharedAccessPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("share"), notePda.toBuffer(), friend.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .updateSharedNote(sharedContent)
      .accounts({
        signer: friend.publicKey, // Friend is the signer now
        note: notePda,
        sharedAccess: sharedAccessPda,
      })
      .signers([friend]) 
      .rpc();

    console.log("Shared Note updated! Tx:", tx);

    // Verify the change
    const note = await program.account.note.fetch(notePda);
    expect(note.content).to.equal(sharedContent);
  });

  it("Deletes a note", async () => {
    const noteId = 1;

    const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("note"),
        wallet.publicKey.toBuffer(),
        new anchor.BN(noteId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .deleteNote(new anchor.BN(noteId))
      .accounts({
        note: notePda,
        signer: wallet.publicKey,
        authority: wallet.publicKey,
      })
      .rpc();

    console.log("Note deleted! Transaction signature:", tx);


    try {
      await program.account.note.fetch(notePda);
      expect.fail("Note should be deleted");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
      console.log("Note successfully deleted!");
    }
  });
});
