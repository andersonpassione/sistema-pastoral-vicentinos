import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, hasValidAdminSecret } from '@/lib/supabase';
import { getAllUsers as getLocalUsers, insertUser as insertLocalUser, updateUserPassword as updateLocalPassword, deleteUser as deleteLocalUser } from '@/src/db/queries';

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      try {
        let authUsersList: any[] = [];

        // Só consulta Supabase Auth admin se a secret key for válida
        if (hasValidAdminSecret()) {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
          if (!authError && authData?.users) {
            authUsersList = authData.users;
          }
        }

        // Consultar tabela pública de perfis no Supabase (funciona com chave anon/publishable)
        const { data: publicProfiles, error: publicError } = await supabaseAdmin
          .from('users')
          .select('*');

        if (!publicError && publicProfiles && publicProfiles.length > 0) {
          const mapped = publicProfiles.map((p: any) => {
            const matchedAuth = authUsersList.find((au) => au.id === p.uid || au.email === `${p.username}@paroquia.org`);
            return {
              id: p.id,
              uid: p.uid || matchedAuth?.id || null,
              username: p.username,
              name: p.name,
              email: matchedAuth?.email || `${p.username}@paroquia.org`,
              role: p.role || 'voluntario',
              shift: p.shift || 'Plantão',
              active: p.active ?? true,
              created_at: p.created_at,
            };
          });

          return NextResponse.json({ success: true, data: mapped });
        }

        // Se publicProfiles estiver vazio mas temos authUsersList
        if (authUsersList.length > 0) {
          const combined = authUsersList.map((authUser) => {
            const meta = authUser.user_metadata || {};
            const email = authUser.email || '';
            const defaultUsername = email.split('@')[0] || 'usuario';

            return {
              id: authUser.id,
              uid: authUser.id,
              username: meta.username || defaultUsername,
              name: meta.name || defaultUsername,
              email: email,
              role: meta.role || 'voluntario',
              shift: meta.shift || 'Plantão',
              active: true,
              created_at: authUser.created_at,
            };
          });

          return NextResponse.json({ success: true, data: combined });
        }
      } catch (sbErr) {
        console.warn('Erro ao consultar usuários no Supabase, tentando tabela local:', sbErr);
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
        let authUid: string | null = null;

        // Se a secret_key for válida, cria também no Supabase Auth
        if (hasValidAdminSecret()) {
          const { data: authCreated } = await supabaseAdmin.auth.admin.createUser({
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
          authUid = authCreated?.user?.id || null;
        }

        // Upsert na tabela public.users
        const profilePayload = {
          uid: authUid,
          username: cleanUsername,
          name: name.trim(),
          password: '••••••••',
          role: userRole,
          shift: userShift,
          active: true,
        };

        const { data: dbUser, error: dbErr } = await supabaseAdmin
          .from('users')
          .upsert(profilePayload, { onConflict: 'username' })
          .select()
          .single();

        if (dbErr) throw dbErr;

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
        console.error('Erro ao cadastrar usuário no Supabase:', sbErr);
        return NextResponse.json(
          { success: false, error: sbErr.message || 'Erro ao criar usuário no Supabase' },
          { status: 500 }
        );
      }
    }

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
        if (hasValidAdminSecret() && uid) {
          await supabaseAdmin.auth.admin.updateUserById(uid, { password: cleanPassword });
        }

        // Atualizar public.users
        const query = supabaseAdmin.from('users').update({
          password: '••••••••',
        });

        if (uid) {
          await query.eq('uid', uid);
        } else if (username) {
          await query.eq('username', String(username).toLowerCase());
        } else if (id) {
          await query.eq('id', Number(id));
        }

        return NextResponse.json({
          success: true,
          message: 'Senha atualizada com sucesso no Supabase!',
        });
      } catch (sbErr: any) {
        console.error('Erro ao atualizar senha no Supabase:', sbErr);
        return NextResponse.json(
          { success: false, error: sbErr.message || 'Erro ao atualizar senha no Supabase.' },
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
        if (hasValidAdminSecret() && uid) {
          await supabaseAdmin.auth.admin.deleteUser(uid);
        }

        if (uid) {
          await supabaseAdmin.from('users').delete().eq('uid', uid);
        } else if (id) {
          await supabaseAdmin.from('users').delete().eq('id', Number(id));
        } else {
          await supabaseAdmin.from('users').delete().eq('username', String(identifier).toLowerCase());
        }

        return NextResponse.json({ success: true, message: 'Usuário removido do Supabase.' });
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
