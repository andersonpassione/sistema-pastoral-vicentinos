import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getAllUsers as getLocalUsers, insertUser as insertLocalUser, updateUserPassword as updateLocalPassword, deleteUser as deleteLocalUser } from '@/src/db/queries';

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      try {
        // Fetch users from Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        // Fetch profiles from public.users table
        const { data: publicProfiles, error: publicError } = await supabaseAdmin
          .from('users')
          .select('*');

        if (!authError && authData?.users && authData.users.length > 0) {
          // Merge auth users with public profiles
          const combined = authData.users.map((authUser) => {
            const meta = authUser.user_metadata || {};
            const email = authUser.email || '';
            const defaultUsername = email.split('@')[0] || 'usuario';
            
            const matchedProfile = (publicProfiles || []).find(
              (p: any) => p.uid === authUser.id || p.username === (meta.username || defaultUsername)
            );

            return {
              id: matchedProfile?.id || authUser.id,
              uid: authUser.id,
              username: matchedProfile?.username || meta.username || defaultUsername,
              name: matchedProfile?.name || meta.name || defaultUsername,
              email: email,
              role: matchedProfile?.role || meta.role || 'voluntario',
              shift: matchedProfile?.shift || meta.shift || 'Plantão',
              active: matchedProfile?.active ?? true,
              created_at: authUser.created_at,
            };
          });

          return NextResponse.json({ success: true, data: combined });
        }

        // Fallback to public.users if auth listing is empty or has error
        if (!publicError && publicProfiles && publicProfiles.length > 0) {
          return NextResponse.json({ success: true, data: publicProfiles });
        }
      } catch (sbErr) {
        console.warn('Erro ao consultar usuários no Supabase Auth, tentando tabela local:', sbErr);
      }
    }

    const localList = await getLocalUsers();
    return NextResponse.json({ success: true, data: localList });
  } catch (error: any) {
    console.error('API /api/users GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, name, password, role, shift, email } = body;

    if (!username || !name) {
      return NextResponse.json(
        { success: false, error: 'Nome de usuário e Nome completo são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = password ? String(password).trim() : '123456';

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Por segurança do Supabase Auth, a senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const userEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@paroquia.org`;
    const userRole = role === 'administrador' ? 'administrador' : 'voluntario';
    const userShift = shift || 'Plantão Vicentino';

    if (isSupabaseConfigured()) {
      try {
        // Create user in Supabase Auth
        const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            name: name.trim(),
            username: cleanUsername,
            role: userRole,
            shift: userShift,
          },
        });

        if (authErr && !authErr.message.includes('already registered')) {
          throw authErr;
        }

        const authUid = authCreated?.user?.id;

        // Upsert into public.users table
        const profilePayload = {
          uid: authUid || null,
          username: cleanUsername,
          name: name.trim(),
          password: '••••••••', // Sensitive password is now safely managed in Supabase Auth
          role: userRole,
          shift: userShift,
          active: true,
        };

        const { data: dbUser, error: dbErr } = await supabaseAdmin
          .from('users')
          .upsert(profilePayload, { onConflict: 'username' })
          .select()
          .single();

        if (dbErr) {
          console.warn('Aviso ao sincronizar perfil public.users:', dbErr);
        }

        return NextResponse.json(
          {
            success: true,
            data: {
              id: dbUser?.id || authUid || cleanUsername,
              uid: authUid,
              username: cleanUsername,
              name: name.trim(),
              email: userEmail,
              role: userRole,
              shift: userShift,
              active: true,
            },
          },
          { status: 201 }
        );
      } catch (sbErr: any) {
        console.error('Erro ao cadastrar usuário no Supabase Auth:', sbErr);
        return NextResponse.json(
          { success: false, error: sbErr.message || 'Erro ao criar usuário no Supabase Auth' },
          { status: 500 }
        );
      }
    }

    // Fallback local
    const created = await insertLocalUser({
      username: cleanUsername,
      name: name.trim(),
      password: cleanPassword,
      role: userRole,
      shift: userShift,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/users POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, uid, password } = body;

    const identifier = uid || id || username;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identificador do usuário é obrigatório.' },
        { status: 400 }
      );
    }

    if (!password || String(password).trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'No Supabase Auth, a senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanPassword = String(password).trim();

    if (isSupabaseConfigured()) {
      try {
        let targetUid = uid;

        // If no UID is provided, find it
        if (!targetUid) {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const found = usersList?.users?.find(
            (u) =>
              u.id === identifier ||
              u.email?.toLowerCase().startsWith(`${String(username || id).toLowerCase()}@`) ||
              u.user_metadata?.username === String(username || id).toLowerCase()
          );
          if (found) {
            targetUid = found.id;
          }
        }

        // If we found the Supabase Auth UID, update the password directly in Supabase Auth!
        if (targetUid) {
          const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
            targetUid,
            { password: cleanPassword }
          );

          if (authUpdateErr) throw authUpdateErr;
        }

        // Also update public.users
        const query = supabaseAdmin.from('users').update({
          password: '••••••••',
        });

        if (targetUid) {
          await query.eq('uid', targetUid);
        } else if (username) {
          await query.eq('username', String(username).toLowerCase());
        }

        return NextResponse.json({
          success: true,
          message: 'Senha atualizada e criptografada com sucesso no Supabase Auth!',
        });
      } catch (sbErr: any) {
        console.error('Erro ao atualizar senha no Supabase Auth:', sbErr);
        return NextResponse.json(
          { success: false, error: sbErr.message || 'Erro ao atualizar senha no Supabase Auth.' },
          { status: 500 }
        );
      }
    }

    const updated = await updateLocalPassword(identifier, cleanPassword);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API /api/users PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar senha do usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    const uid = searchParams.get('uid');

    const identifier = uid || id || username;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identificador do usuário é obrigatório.' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      try {
        let targetUid = uid;
        if (!targetUid) {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const found = usersList?.users?.find(
            (u) =>
              u.id === identifier ||
              u.user_metadata?.username === String(username || id).toLowerCase()
          );
          if (found) targetUid = found.id;
        }

        if (targetUid) {
          await supabaseAdmin.auth.admin.deleteUser(targetUid);
          await supabaseAdmin.from('users').delete().eq('uid', targetUid);
        } else {
          await supabaseAdmin.from('users').delete().eq('username', String(identifier).toLowerCase());
        }

        return NextResponse.json({ success: true, message: 'Usuário removido do Supabase Auth e do banco.' });
      } catch (sbErr: any) {
        console.error('Erro ao deletar usuário do Supabase:', sbErr);
      }
    }

    const deleted = await deleteLocalUser(identifier);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error('API /api/users DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}
