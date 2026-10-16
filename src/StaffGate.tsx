import React, { useEffect, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

// Temporary supervised-tablet mode: no intake or customer data loads before
// staff authentication. Public self-service needs a separate backend endpoint.
export function StaffGate({ client, children }: { client: SupabaseClient; children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const currentUser = useRef<string | null>(null);

  useEffect(() => {
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if ((next?.user.id || null) !== currentUser.current) {
        setApproved(false);
        setChecking(Boolean(next));
      }
      currentUser.current = next?.user.id || null;
      setSession(next);
    });
    client.auth.getSession().then(({ data, error }) => {
      setSession(data.session);
      if (error || !data.session) setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    client.rpc('pink_elephant_is_staff').then(({ data, error }) => {
      if (cancelled) return;
      setApproved(!error && data === true);
      setChecking(false);
      if (error || data !== true) setError('Staff access is unavailable for this account. Contact the shop administrator.');
    });
    return () => { cancelled = true; };
  }, [client, session]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError('Sign-in failed. Check your email and password.');
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  const logout = async () => {
    setApproved(false);
    setSession(null);
    await client.auth.signOut({ scope: 'local' });
  };

  if (checking) return <main className="max-w-md mx-auto p-8" role="status">Checking staff access…</main>;
  if (approved) return <>
    <div className="pe-staff-session sticky top-0 z-[500] bg-slate-900 text-white px-4 py-2 flex items-center justify-between gap-4 print:hidden">
      <span className="text-sm">The Pink Elephant · Staff workspace</span>
      <div className="flex items-center gap-4">
        <a href="/intake" target="_blank" rel="noopener noreferrer" className="text-sm underline">Customer intake</a>
        <button type="button" onClick={logout} className="shrink-0 rounded-lg border border-white/60 px-4 py-2 font-bold hover:bg-white/10">Sign out</button>
      </div>
    </div>
    {children}
  </>;
  return <main className="pe-staff-login max-w-md mx-auto p-6 py-12 space-y-5">
    <img src="/assets/pink-elephant-logo.png" alt="The Pink Elephant" className="w-24 h-24 object-contain mx-auto" />
    <h1 className="text-2xl font-black">The Pink Elephant · Staff sign-in</h1>
    <p>Sign in to manage your studio queue and saved waivers. Keep this device supervised and sign out when finished.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {session ? <button className="btn-primary" onClick={logout}>Use a different account</button> :
      <form onSubmit={login} className="space-y-4">
        <label className="block">Email<input className="form-input mt-1" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="block">Password<input className="form-input mt-1" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>}
    <p><a className="underline" href="/privacy">Privacy Policy</a> · <a className="underline" href="/sms-terms">SMS Terms</a></p>
  </main>;
}
