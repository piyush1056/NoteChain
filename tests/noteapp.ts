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
