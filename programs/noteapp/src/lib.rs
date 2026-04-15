use anchor_lang::prelude::*;

declare_id!("G48CMVhqv9r9qpbg9zbFwWj1LSe9d5jnRRvE6rzfNNZS");

#[program]
pub mod note_app {
    use super::*;

    
    pub fn create_user(ctx: Context<CreateUser>, username: String) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        user_profile.authority = ctx.accounts.signer.key();
        user_profile.username = username;
        user_profile.note_count = 0;
        
        msg!("User profile created for: {}", user_profile.authority);
        Ok(())
    }

    
    pub fn create_note(
        ctx: Context<CreateNote>,
        title: String,
        content: String,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let note = &mut ctx.accounts.note;
        
        
        user_profile.note_count += 1;
        
        
        note.authority = ctx.accounts.signer.key();
        note.id = user_profile.note_count;
        note.title = title;
        note.content = content;
        
        msg!("Note #{} created successfully", note.id);
        Ok(())
    }

    
    pub fn update_note(
        ctx: Context<UpdateNote>,
        _note_id: u64,
        new_content: String,
    ) -> Result<()> {
        let note = &mut ctx.accounts.note;
        note.content = new_content;
        
        msg!("Note #{} updated successfully", note.id);
        Ok(())
    }

    /// Deletes a note by closing the account
    pub fn delete_note(ctx: Context<DeleteNote>, _note_id: u64) -> Result<()> {
        msg!("Note #{} deleted successfully", ctx.accounts.note.id);
        Ok(())
    }

    pub fn share_note(ctx: Context<ShareNote>, friend: Pubkey) -> Result<()> {
        let shared_access = &mut ctx.accounts.shared_access;
        shared_access.friend = friend;
        shared_access.note_pda = ctx.accounts.note.key();
        msg!("Note shared successfully with: {}", friend);
        Ok(())
    }

    pub fn update_shared_note(ctx: Context<UpdateSharedNote>, new_content: String) -> Result<()> {
        let note = &mut ctx.accounts.note;
        note.content = new_content;
        msg!("Shared Note #{} updated securely by collaborator", note.id);
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"user_profile", signer.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, content: String)]
pub struct CreateNote<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", signer.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        init,
        payer = signer,
        space = 8 + Note::INIT_SPACE,
        seeds = [
            b"note",
            signer.key().as_ref(),
            &(user_profile.note_count + 1).to_le_bytes()
        ],
        bump
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
    /// CHECK: This account is safe because it's validated via `has_one = authority` constraint on the user_profile account. No data is read from it directly.
    pub authority: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(note_id: u64)]
pub struct UpdateNote<'info> {
    #[account(
        mut,
        seeds = [
            b"note",
            signer.key().as_ref(),
            &note_id.to_le_bytes()
        ],
        bump,
        has_one = authority,
        constraint = authority.key() == signer.key() @ ErrorCode::UnauthorizedAccess
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
   /// CHECK: This account is safe because the `has_one = authority` constraint ensures it matches the note's authority, which is already validated against signer.
    pub authority: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(note_id: u64)]
pub struct DeleteNote<'info> {
    #[account(
        mut,
        seeds = [
            b"note",
            signer.key().as_ref(),
            &note_id.to_le_bytes()
        ],
        bump,
        has_one = authority,
        constraint = authority.key() == signer.key() @ ErrorCode::UnauthorizedAccess,
        close = signer
    )]
    pub note: Account<'info, Note>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
    /// CHECK: This account is safe because the `close = signer` constraint requires authority == signer, and `has_one = authority` validates it against the note.
    pub authority: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(friend: Pubkey)]
pub struct ShareNote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, 

    #[account(
        mut,
        constraint = note.authority == signer.key() @ ErrorCode::UnauthorizedAccess
    )]
    pub note: Account<'info, Note>,

    #[account(
        init,
        payer = signer,
        space = 8 + SharedAccess::INIT_SPACE,
        seeds = [b"share", note.key().as_ref(), friend.as_ref()],
        bump
    )]
    pub shared_access: Account<'info, SharedAccess>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSharedNote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, 

    #[account(mut)]
    pub note: Account<'info, Note>,

    #[account(
        seeds = [b"share", note.key().as_ref(), signer.key().as_ref()],
        bump,
        constraint = shared_access.friend == signer.key() @ ErrorCode::UnauthorizedAccess
    )]
    pub shared_access: Account<'info, SharedAccess>,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,      
    #[max_len(50)]
    pub username: String,       
    pub note_count: u64,        
}

#[account]
#[derive(InitSpace)]
pub struct Note {
    pub authority: Pubkey,      
    pub id: u64,                
    #[max_len(100)]
    pub title: String,          
    #[max_len(500)]
    pub content: String,      
}

#[account]
#[derive(InitSpace)]
pub struct SharedAccess {
    pub friend: Pubkey,
    pub note_pda: Pubkey,
}


#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action")]
    UnauthorizedAccess,
}
