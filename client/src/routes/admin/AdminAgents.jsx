import { useEffect, useState } from 'react';
import apiRequest from '../../lib/apiRequest';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(null);
  const load = async () => { try { setLoading(true); const res = await apiRequest.get('/cms/admin/agents'); setAgents(res.data || []); setError(''); } catch { setError("We couldn't load agents. Please try again."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (agent) => { try { setSaving(agent.id); await apiRequest.put(`/cms/admin/agents/${agent.id}`, { isActive: !agent.isActive }); await load(); } catch { setError("We couldn't update the agent. Please try again."); } finally { setSaving(null); } };

  return <div className="admin-users"><div className="page-header"><div><h1>Agents</h1><p>Manage active Suretreaven agents.</p></div></div>{loading && <p>Loading agents…</p>}{!loading && error && <p>{error}</p>}{!loading && !error && agents.length === 0 && <p>No agents found.</p>}{!loading && !error && agents.length > 0 && <div className="users-table-wrapper"><table className="users-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th /></tr></thead><tbody>{agents.map((agent) => <tr key={agent.id}><td>{agent.user?.username || 'Agent'}</td><td>{agent.user?.email || '—'}</td><td>{agent.user?.phone || '—'}</td><td>{agent.isActive ? 'Active' : 'Inactive'}</td><td><button disabled={saving === agent.id} onClick={() => toggle(agent)}>{saving === agent.id ? 'Saving…' : agent.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}</div>;
}
