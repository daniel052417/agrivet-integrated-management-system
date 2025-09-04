import React, { useMemo, useState, useEffect } from 'react';
import { Users, UserPlus, Database, Settings, Search, Filter, Download, SortAsc, SortDesc, MoreVertical, Edit, Eye, X, AlertCircle, Trash, CheckCircle, PauseCircle, Ban, Activity as ActivityIcon, Mail, Phone, Calendar, Building } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { staffManagementApi, Staff } from '../../../lib/staffApi';

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  branch: string;
  createdAt: string; // ISO
  lastLoginAt?: string; // ISO | undefined
  // Staff-specific fields
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  employeeId?: string;
  salary?: number;
  accountType?: 'user' | 'staff';
}

interface AuditEntry {
  id?: string;
  actor_email?: string | null;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'suspend';
  target_user_email: string;
  target_user_id?: string;
  details?: Record<string, any>;
  created_at?: string;
}

const MOCK_ACCOUNTS: AccountRow[] = [
  {
    id: 'u_001',
    name: 'John Smith',
    email: 'john.smith@agrivet.com',
    role: 'Admin',
    status: 'active',
    branch: 'Main',
    createdAt: '2024-01-01T09:00:00Z',
    lastLoginAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'u_002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@agrivet.com',
    role: 'Manager',
    status: 'active',
    branch: 'West',
    createdAt: '2024-01-03T11:15:00Z',
    lastLoginAt: '2024-01-15T09:15:00Z'
  },
  {
    id: 'u_003',
    name: 'Mike Davis',
    email: 'mike.davis@agrivet.com',
    role: 'Staff',
    status: 'inactive',
    branch: 'East',
    createdAt: '2024-01-05T08:00:00Z',
    lastLoginAt: '2024-01-10T08:45:00Z'
  },
  {
    id: 'u_004',
    name: 'Emily Wilson',
    email: 'emily.wilson@agrivet.com',
    role: 'Staff',
    status: 'pending',
    branch: 'South',
    createdAt: '2024-01-08T14:20:00Z'
  },
  {
    id: 'u_005',
    name: 'David Brown',
    email: 'david.brown@agrivet.com',
    role: 'Manager',
    status: 'suspended',
    branch: 'North',
    createdAt: '2023-12-20T12:30:00Z',
    lastLoginAt: '2024-01-10T14:30:00Z'
  }
];

const statusBadge = (status: AccountRow['status']) => {
  const map: Record<AccountRow['status'], string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };
  return map[status];
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const downloadCsv = (rows: AccountRow[]) => {
  const header = ['Name', 'Email', 'Role', 'Status', 'Branch', 'Created At', 'Last Login'];
  const body = rows.map(r => [r.name, r.email, r.role, r.status, r.branch, r.createdAt, r.lastLoginAt || '']);
  const csv = [header, ...body].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user-accounts.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  id?: string;
  name: string;
  email: string;
  role: AccountRow['role'];
  status: AccountRow['status'];
  branch: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  name: '',
  email: '',
  role: 'Staff',
  status: 'active',
  branch: ''
};

type StatusAction = 'activate' | 'deactivate' | 'suspend';

const UserAccounts: React.FC = () => {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | AccountRow['role']>('all');
  const [status, setStatus] = useState<'all' | AccountRow['status']>('all');
  const [accountType, setAccountType] = useState<'all' | 'user' | 'staff'>('all');
  const [sortKey, setSortKey] = useState<'createdAt' | 'lastLoginAt' | 'name'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: StatusAction; row: AccountRow } | null>(null);

  const [audit, setAudit] = useState<AuditEntry[]>([]);
  
  // Staff management state
  const [staffRows, setStaffRows] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        // Load user accounts from profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, is_active, last_login, created_at')
          .order('created_at', { ascending: false });
        
        // Load staff data
        const [staffData, branchesData] = await Promise.all([
          staffManagementApi.staff.getAllStaff(),
          staffManagementApi.branches.getAllBranches()
        ]);
        
        if (profilesError) throw profilesError;
        if (ignore) return;
        
        // Map user profiles
        const userAccounts: AccountRow[] = (profilesData || []).map((p: any) => ({
          id: p.id,
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email,
          email: p.email,
          role: (p.role?.toString().toLowerCase?.() === 'admin' ? 'Admin' : p.role?.toString().toLowerCase?.() === 'manager' ? 'Manager' : 'Staff'),
          status: p.is_active ? 'active' : 'inactive',
          branch: '',
          createdAt: p.created_at,
          lastLoginAt: p.last_login || undefined,
          accountType: 'user' as const,
        }));
        
        // Map staff data with user account information
        const staffAccounts: AccountRow[] = staffData.map((s: Staff) => {
          const linkedUser = userAccounts.find(u => u.id === s.user_account_id);
          return {
            id: s.id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unnamed',
            email: s.email || '',
            role: (s.role === 'admin' ? 'Admin' : s.role === 'manager' ? 'Manager' : 'Staff') as AccountRow['role'],
            status: s.is_active ? 'active' : 'inactive',
            branch: branchesData.find(b => b.id === s.branch_id)?.name || '',
            createdAt: s.created_at,
            lastLoginAt: linkedUser?.lastLoginAt,
            accountType: 'staff' as const,
            phone: s.phone,
            position: s.position,
            department: s.department,
            hireDate: s.hire_date,
            employeeId: s.employee_id,
            salary: s.salary,
          };
        });
        
        // Combine and sort all accounts
        const allAccounts = [...userAccounts, ...staffAccounts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setRows(allAccounts);
        setStaffRows(staffData);
        setBranches(branchesData.map(b => ({ id: b.id, name: b.name })));
        
      } catch (e) {
        console.warn('Falling back to mock accounts:', e);
        if (!ignore) setRows(MOCK_ACCOUNTS);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const loadAudit = async () => {
      try {
        const { data, error } = await supabase
          .from('user_account_audit')
          .select('id, actor_email, action, target_user_email, target_user_id, details, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (data) setAudit(data as any);
      } catch (e) {
        // ignore if table doesn't exist
      }
    };

    load();
    loadAudit();
    return () => { ignore = true; };
  }, []);

  const writeAudit = async (entry: AuditEntry) => {
    const actor = (await supabase.auth.getUser()).data.user?.email || null;
    const payload = { ...entry, actor_email: actor, created_at: new Date().toISOString() };
    setAudit(prev => [payload, ...prev].slice(0, 50));
    try {
      await supabase.from('user_account_audit').insert({
        actor_email: payload.actor_email,
        action: payload.action,
        target_user_email: payload.target_user_email,
        target_user_id: payload.target_user_id,
        details: payload.details || {},
      });
    } catch (e) {
      // swallow if table missing
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows.filter(row => {
      const matchesQuery = !q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
      const matchesRole = role === 'all' || row.role === role;
      const matchesStatus = status === 'all' || row.status === status;
      const matchesAccountType = accountType === 'all' || row.accountType === accountType;
      return matchesQuery && matchesRole && matchesStatus && matchesAccountType;
    });

    r.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      const av = sortKey === 'createdAt' ? a.createdAt : (a.lastLoginAt || '');
      const bv = sortKey === 'createdAt' ? b.createdAt : (b.lastLoginAt || '');
      return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
    });

    return r;
  }, [rows, query, role, status, accountType, sortKey, sortDir]);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setIsEditing(false);
    setDrawerOpen(true);
  };

  const openEdit = (row: AccountRow) => {
    setForm({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      branch: row.branch
    });
    setErrors({});
    setIsEditing(true);
    setDrawerOpen(true);
  };

  const validate = (f: FormState): FormErrors => {
    const e: FormErrors = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.email.trim()) e.email = 'Email is required';
    else if (!emailRegex.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.branch.trim()) e.branch = 'Branch is required';
    if (!f.role) e.role = 'Role is required';
    if (!f.status) e.status = 'Status is required';
    return e;
  };

  const handleSave = async () => {
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    try {
      setLoading(true);
      if (isEditing && form.id) {
        const [first_name, ...rest] = form.name.split(' ');
        const last_name = rest.join(' ');
        const { error } = await supabase
          .from('profiles')
          .update({
            email: form.email,
            first_name,
            last_name,
            role: form.role.toLowerCase(),
            is_active: form.status === 'active'
          })
          .eq('id', form.id);
        if (error) throw error;
        setRows(prev => prev.map(r => r.id === form.id ? {
          ...r,
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
          branch: form.branch
        } : r));
        await writeAudit({ action: 'update', target_user_email: form.email, target_user_id: form.id, details: { role: form.role, status: form.status } });
      } else {
        let createdUserId: string | undefined = undefined;
        try {
          const tempPassword = Math.random().toString(36).slice(2) + 'Aa1!';
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: form.email,
            password: tempPassword
          });
          if (signUpError) throw signUpError;
          createdUserId = signUpData.user?.id;
        } catch (authErr) {
          console.warn('Auth signUp failed or not permitted in client:', authErr);
        }

        const [first_name, ...rest] = form.name.split(' ');
        const last_name = rest.join(' ');
        const profilePayload: any = {
          email: form.email,
          first_name,
          last_name,
          role: form.role.toLowerCase(),
          is_active: form.status === 'active'
        };
        if (createdUserId) profilePayload.id = createdUserId;
        try {
          const { data: inserted, error } = await supabase
            .from('profiles')
            .insert(profilePayload)
            .select('id, created_at')
            .single();
          if (error) throw error;
          const newRow: AccountRow = {
            id: inserted.id,
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status,
            branch: form.branch,
            createdAt: inserted.created_at
          };
          setRows(prev => [newRow, ...prev]);
          await writeAudit({ action: 'create', target_user_email: form.email, target_user_id: inserted.id, details: { role: form.role, status: form.status } });
        } catch (profileErr) {
          console.warn('Insert into profiles failed, falling back to local:', profileErr);
          const newRow: AccountRow = {
            id: `u_${Math.random().toString(36).slice(2, 8)}`,
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status,
            branch: form.branch,
            createdAt: new Date().toISOString()
          };
          setRows(prev => [newRow, ...prev]);
          await writeAudit({ action: 'create', target_user_email: form.email, target_user_id: newRow.id, details: { role: form.role, status: form.status, localOnly: true } });
        }
      }
      setDrawerOpen(false);
    } catch (e: any) {
      console.error(e);
      setLoadError(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = rows.find(r => r.id === id);
    try {
      setLoading(true);
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setRows(prev => prev.filter(r => r.id !== id));
      if (target) await writeAudit({ action: 'delete', target_user_email: target.email, target_user_id: id });
    } catch (e) {
      console.warn('Delete failed, removing locally:', e);
      setRows(prev => prev.filter(r => r.id !== id));
      if (target) await writeAudit({ action: 'delete', target_user_email: target.email, target_user_id: id, details: { localOnly: true } });
    } finally {
      setLoading(false);
    }
  };

  const requestStatusChange = (row: AccountRow, type: StatusAction) => {
    setPendingAction({ type, row });
    setConfirmOpen(true);
  };

  const performStatusChange = async () => {
    if (!pendingAction) return;
    const { type, row } = pendingAction;
    const newStatus: AccountRow['status'] = type === 'activate' ? 'active' : (type === 'deactivate' ? 'inactive' : 'suspended');
    try {
      setLoading(true);
      const shouldBeActive = newStatus === 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: shouldBeActive })
        .eq('id', row.id);
      if (error) throw error;
      await writeAudit({ action: type, target_user_email: row.email, target_user_id: row.id });
    } catch (e) {
      console.warn('Status update failed on server, applying locally:', e);
      await writeAudit({ action: type, target_user_email: row.email, target_user_id: row.id, details: { localOnly: true } });
    } finally {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: newStatus } : r));
      setConfirmOpen(false);
      setPendingAction(null);
      setLoading(false);
    }
  };



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User & Staff Accounts</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, staff profiles, and account settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCsv(filtered)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="all">All Types</option>
              <option value="user">User Accounts</option>
              <option value="staff">Staff Accounts</option>
            </select>
            <div className="flex items-center gap-2">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="createdAt">Sort by Created</option>
                <option value="lastLoginAt">Sort by Last Login</option>
                <option value="name">Sort by Name</option>
              </select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                {sortDir === 'asc' ? <SortAsc className="w-4 h-4 text-gray-600" /> : <SortDesc className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-3 text-xs font-semibold">
                        {row.name.split(' ').map(p => p[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{row.name}</div>
                        <div className="text-sm text-gray-500">{row.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.accountType === 'staff' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {row.accountType === 'staff' ? 'Staff' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(row.status)}`}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.lastLoginAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-2">
                      <button className="text-emerald-600 hover:text-emerald-900"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                      {row.status !== 'active' && (
                        <button onClick={() => requestStatusChange(row, 'activate')} className="text-green-600 hover:text-green-800" title="Activate">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {row.status !== 'inactive' && (
                        <button onClick={() => requestStatusChange(row, 'deactivate')} className="text-gray-600 hover:text-gray-800" title="Deactivate">
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}
                      {row.status !== 'suspended' && (
                        <button onClick={() => requestStatusChange(row, 'suspend')} className="text-red-600 hover:text-red-800" title="Suspend">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={async () => {
                        try {
                          await supabase.auth.resend({ type: 'signup', email: row.email });
                          await writeAudit({ action: 'update', target_user_email: row.email, target_user_id: row.id, details: { emailVerification: 'resent' } });
                          alert('Verification email sent');
                        } catch (e) {
                          alert('Failed to send verification email');
                        }
                      }} className="text-emerald-600 hover:text-emerald-800" title="Resend Verification">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button onClick={async () => {
                        try {
                          await supabase.auth.resetPasswordForEmail(row.email, { redirectTo: window.location.origin + '/auth/callback' });
                          await writeAudit({ action: 'update', target_user_email: row.email, target_user_id: row.id, details: { passwordReset: 'sent' } });
                          alert('Password reset email sent');
                        } catch (e) {
                          alert('Failed to send password reset email');
                        }
                      }} className="text-orange-600 hover:text-orange-800" title="Send Password Reset">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-900">Recent Account Activity</h3>
          </div>
          <span className="text-xs text-gray-500">Showing latest {audit.length} events</span>
        </div>
        {audit.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity recorded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {audit.slice(0, 10).map((e, idx) => (
              <li key={(e.id || idx) + ''} className="py-2 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{e.actor_email || 'System'}</span> {e.action} <span className="font-medium">{e.target_user_email}</span>
                  </p>
                  {e.details && Object.keys(e.details).length > 0 && (
                    <p className="text-xs text-gray-500">{JSON.stringify(e.details)}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit User' : 'Create User'}</h2>
                <p className="text-xs text-gray-500">{isEditing ? 'Update the user account details' : 'Fill in the details to create a new account'}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`mt-1 w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="e.g., Juan Dela Cruz"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`mt-1 w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as AccountRow['role'] })}
                    className={`mt-1 w-full px-3 py-2 border ${errors.role ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as AccountRow['status'] })}
                    className={`mt-1 w-full px-3 py-2 border ${errors.status ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.status}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branch</label>
                <input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className={`mt-1 w-full px-3 py-2 border ${errors.branch ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="e.g., Main"
                />
                {errors.branch && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.branch}</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Confirm Modal */}
      {confirmOpen && pendingAction && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setConfirmOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                <button onClick={() => setConfirmOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-600" /></button>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-gray-700">You are about to {pendingAction.type} the account of</p>
                <p className="text-base font-medium text-gray-900">{pendingAction.row.name} ({pendingAction.row.email})</p>
                <p className="text-xs text-gray-500">This will {pendingAction.type === 'activate' ? 'enable access to the system' : pendingAction.type === 'deactivate' ? 'disable access temporarily' : 'suspend the account until reactivated'}.</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={performStatusChange} disabled={loading} className={`px-4 py-2 rounded-lg text-white ${pendingAction.type === 'activate' ? 'bg-green-600 hover:bg-green-700' : pendingAction.type === 'deactivate' ? 'bg-gray-700 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-60`}>
                  {pendingAction.type === 'activate' ? 'Activate' : pendingAction.type === 'deactivate' ? 'Deactivate' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default UserAccounts;
