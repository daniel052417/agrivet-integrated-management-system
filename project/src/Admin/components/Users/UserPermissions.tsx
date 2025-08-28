import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Key, Search, Download, SortAsc, SortDesc, Edit, Trash2, PlusCircle, X, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type ModuleKey = 'dashboard' | 'inventory' | 'sales' | 'reports' | 'staff' | 'marketing' | 'settings';

type ActionKey = 'read' | 'create' | 'update' | 'delete' | 'export';

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
  { key: 'reports', label: 'Reports' },
  { key: 'staff', label: 'Staff' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'settings', label: 'Settings' }
];

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'read', label: 'Read' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' }
];

type PermissionMatrix = Record<ModuleKey, Partial<Record<ActionKey, boolean>>>;

interface Role {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'branch';
  isDefault?: boolean;
  permissions: PermissionMatrix;
  usersCount?: number;
  createdAt: string;
}

const MOCK_ROLES: Role[] = [
  {
    id: 'r_admin',
    name: 'Admin',
    description: 'Full access to all modules and actions',
    scope: 'global',
    isDefault: true,
    usersCount: 2,
    createdAt: '2024-01-01T09:00:00Z',
    permissions: {
      dashboard: { read: true },
      inventory: { read: true, create: true, update: true, delete: true, export: true },
      sales: { read: true, create: true, update: true, delete: true, export: true },
      reports: { read: true, export: true },
      staff: { read: true, create: true, update: true, delete: true },
      marketing: { read: true, create: true, update: true, delete: true },
      settings: { read: true, update: true }
    }
  },
  {
    id: 'r_manager',
    name: 'Manager',
    description: 'Manage day-to-day operations',
    scope: 'branch',
    usersCount: 5,
    createdAt: '2024-01-05T10:00:00Z',
    permissions: {
      dashboard: { read: true },
      inventory: { read: true, create: true, update: true, export: true },
      sales: { read: true, create: true, update: true, export: true },
      reports: { read: true, export: true },
      staff: { read: true, update: true },
      marketing: {},
      settings: {}
    }
  },
  {
    id: 'r_staff',
    name: 'Staff',
    description: 'Standard staff access',
    scope: 'branch',
    usersCount: 18,
    createdAt: '2024-01-10T12:00:00Z',
    permissions: {
      dashboard: { read: true },
      inventory: { read: true },
      sales: { read: true, create: true },
      reports: {},
      staff: {},
      marketing: {},
      settings: {}
    }
  }
];

const formatDate = (iso: string) => new Date(iso).toLocaleString();

const ensureMatrix = (m?: PermissionMatrix): PermissionMatrix => {
  const base: PermissionMatrix = {
    dashboard: {},
    inventory: {},
    sales: {},
    reports: {},
    staff: {},
    marketing: {},
    settings: {}
  };
  return { ...base, ...(m || {}) };
};

const UserPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'global' | 'branch'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'usersCount'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; description?: string; scope: 'global' | 'branch'; permissions: PermissionMatrix }>({ name: '', description: '', scope: 'branch', permissions: ensureMatrix() });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'scope', string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('roles')
          .select('id, name, description, scope, permissions, users_count, created_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) throw new Error('No roles');
        if (ignore) return;
        const mapped: Role[] = (data as any[]).map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || undefined,
          scope: (r.scope === 'global' ? 'global' : 'branch'),
          permissions: ensureMatrix(r.permissions || {}),
          usersCount: r.users_count || 0,
          createdAt: r.created_at
        }));
        setRoles(mapped);
      } catch (e) {
        console.warn('Roles load failed, using mock:', e);
        if (!ignore) setRoles(MOCK_ROLES);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = roles.filter(role => {
      const matchesQuery = !q || role.name.toLowerCase().includes(q) || (role.description || '').toLowerCase().includes(q);
      const matchesScope = scope === 'all' || role.scope === scope;
      return matchesQuery && matchesScope;
    });
    r.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'usersCount') return ((a.usersCount || 0) - (b.usersCount || 0)) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
    return r;
  }, [roles, query, scope, sortKey, sortDir]);

  const openCreate = () => {
    setForm({ name: '', description: '', scope: 'branch', permissions: ensureMatrix() });
    setErrors({});
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const openEdit = (role: Role) => {
    setForm({ id: role.id, name: role.name, description: role.description, scope: role.scope, permissions: ensureMatrix(role.permissions) });
    setErrors({});
    setIsEditing(true);
    setDrawerOpen(true);
  };

  const isLastGlobalAdminRole = (targetId?: string) => {
    const admins = roles.filter(r => r.name.trim().toLowerCase() === 'admin' && r.scope === 'global');
    if (admins.length === 0) return false; // no admin roles tracked
    if (!targetId) return admins.length === 1; // creating/editing without id
    // When editing/deleting, count other admin roles besides the target
    const others = admins.filter(r => r.id !== targetId);
    return others.length === 0; // target is the last global Admin role
  };

  const validate = () => {
    const e: Partial<Record<'name' | 'scope', string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.scope) e.scope = 'Scope is required';

    // Guardrail: prevent demoting the last global Admin role
    if (isEditing && form.id && isLastGlobalAdminRole(form.id)) {
      const original = roles.find(r => r.id === form.id);
      if (original) {
        const originalIsAdmin = original.name.trim().toLowerCase() === 'admin' && original.scope === 'global';
        const newIsAdmin = form.name.trim().toLowerCase() === 'admin' && form.scope === 'global';
        if (originalIsAdmin && !newIsAdmin) {
          e.name = e.name || 'Cannot rename or change scope of the last global Admin role';
          e.scope = e.scope || 'Cannot rename or change scope of the last global Admin role';
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const togglePermission = (moduleKey: ModuleKey, actionKey: ActionKey) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [actionKey]: !prev.permissions[moduleKey]?.[actionKey]
        }
      }
    }));
  };

  const toggleModuleAll = (moduleKey: ModuleKey, value: boolean) => {
    const updates: Partial<Record<ActionKey, boolean>> = {};
    ACTIONS.forEach(a => { updates[a.key] = value; });
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: updates
      }
    }));
  };

  const moduleAllChecked = (moduleKey: ModuleKey) => {
    const m = form.permissions[moduleKey] || {};
    return ACTIONS.every(a => m[a.key]);
  };

  const saveRole = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (isEditing && form.id) {
        try {
          const { error } = await supabase
            .from('roles')
            .update({ name: form.name, description: form.description || null, scope: form.scope, permissions: form.permissions })
            .eq('id', form.id);
          if (error) throw error;
        } catch (e) {
          console.warn('Supabase update failed, updating locally:', e);
        }
        setRoles(prev => prev.map(r => r.id === form.id ? { ...r, name: form.name, description: form.description, scope: form.scope, permissions: form.permissions } : r));
      } else {
        let inserted: { id: string; created_at: string } | null = null;
        try {
          const { data, error } = await supabase
            .from('roles')
            .insert({ name: form.name, description: form.description || null, scope: form.scope, permissions: form.permissions })
            .select('id, created_at')
            .single();
          if (error) throw error;
          inserted = data as any;
        } catch (e) {
          console.warn('Supabase insert failed, creating locally:', e);
        }
        const newRole: Role = {
          id: inserted?.id || `r_${Math.random().toString(36).slice(2, 8)}`,
          name: form.name,
          description: form.description,
          scope: form.scope,
          permissions: form.permissions,
          usersCount: 0,
          createdAt: inserted?.created_at || new Date().toISOString()
        };
        setRoles(prev => [newRole, ...prev]);
      }
      setDrawerOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id: string) => {
    const target = roles.find(r => r.id === id);
    if (target && target.name.trim().toLowerCase() === 'admin' && target.scope === 'global' && isLastGlobalAdminRole(id)) {
      alert('Cannot delete the last global Admin role. Create another Admin role first.');
      return;
    }
    try {
      setLoading(true);
      try {
        const { error } = await supabase.from('roles').delete().eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase delete failed, removing locally:', e);
      }
      setRoles(prev => prev.filter(r => r.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = (rows: any[]) => {
    const header = ['Name', 'Description', 'Scope', 'Users', 'Created'];
    const body = rows.map(r => [r.name, r.description || '', r.scope, r.usersCount || 0, r.createdAt]);
    const csv = [header, ...body].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roles.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const preview = useMemo(() => {
    const rows = MODULES.map(m => {
      const actions = ACTIONS.filter(a => form.permissions[m.key]?.[a.key]).map(a => a.label);
      return { module: m.label, actions };
    });
    const grantedCount = rows.reduce((acc, r) => acc + r.actions.length, 0);
    return { rows, grantedCount };
  }, [form.permissions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Permissions</h1>
          <p className="text-gray-600 mt-1">Manage roles and permission assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCsv(filtered)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <PlusCircle className="w-4 h-4" />
            Create Role
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="all">All Scopes</option>
              <option value="global">Global</option>
              <option value="branch">Branch</option>
            </select>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="createdAt">Sort by Created</option>
              <option value="name">Sort by Name</option>
              <option value="usersCount">Sort by Users</option>
            </select>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
              {sortDir === 'asc' ? <SortAsc className="w-4 h-4 text-gray-600" /> : <SortDesc className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{r.name}{r.isDefault ? ' (Default)' : ''}</span>
                      {r.description && <span className="text-xs text-gray-500">{r.description}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.scope === 'global' ? 'Global' : 'Branch'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.usersCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(r.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteRole(r.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[680px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Role' : 'Create Role'}</h2>
                <p className="text-xs text-gray-500">{isEditing ? 'Update role details and permissions' : 'Define a new role and its permissions'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`mt-1 w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                    placeholder="e.g., Inventory Supervisor"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scope</label>
                  <select
                    value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value as 'global' | 'branch' })}
                    className={`mt-1 w-full px-3 py-2 border ${errors.scope ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  >
                    <option value="global">Global</option>
                    <option value="branch">Branch</option>
                  </select>
                  {errors.scope && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.scope}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="What can this role do?"
                />
              </div>

              {/* Permission Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                  <div className="text-xs text-gray-500">Toggle access per module and action</div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                        {ACTIONS.map(a => (
                          <th key={a.key} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{a.label}</th>
                        ))}
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">All</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(m => {
                        const allOn = moduleAllChecked(m.key);
                        return (
                          <tr key={m.key} className="border-t">
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">{m.label}</td>
                            {ACTIONS.map(a => {
                              const enabled = !!form.permissions[m.key]?.[a.key];
                              return (
                                <td key={a.key} className="px-4 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => togglePermission(m.key, a.key)}
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded border ${enabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 text-gray-400'} hover:bg-emerald-50`}
                                  >
                                    {enabled ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleModuleAll(m.key, !allOn)}
                                className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium ${allOn ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {allOn ? 'All On' : 'All Off'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Effective Permissions Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Effective Permissions Preview</h3>
                  <span className="text-xs text-gray-500">{preview.grantedCount} permissions granted</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {preview.rows.map(r => (
                    <div key={r.module} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">{r.module}</div>
                      {r.actions.length === 0 ? (
                        <div className="text-xs text-gray-400">No access</div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {r.actions.map(a => (
                            <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveRole} disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserPermissions;
