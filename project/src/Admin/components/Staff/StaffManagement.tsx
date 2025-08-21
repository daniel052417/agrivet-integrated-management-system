import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, Calendar, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  type StaffRow = {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    branch_id: string;
    hire_date: string;
    salary: number;
    is_active: boolean;
    role: string;
  };

  type NewStaff = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    hire_date: string;
    is_active: boolean;
    employee_id?: string;
    role?: string;
    branch_id?: string;
    salary?: number;
  };

  const [staffRows, setStaffRows] = useState<StaffRow[]>([]);

  const [form, setForm] = useState<NewStaff>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().slice(0, 10),
    is_active: true,
    employee_id: '',
    role: 'staff',
    branch_id: undefined,
    salary: undefined,
  });

  function openEditModal(s: StaffRow) {
    setEditId(s.id);
    setForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      email: s.email || '',
      phone: s.phone || '',
      position: s.position || '',
      department: s.department || '',
      hire_date: s.hire_date ? new Date(s.hire_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      is_active: !!s.is_active,
      employee_id: s.employee_id || '',
      role: s.role || 'staff',
      branch_id: s.branch_id || undefined,
      salary: typeof s.salary === 'number' ? s.salary : undefined,
    });
    setIsEditOpen(true);
  }

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('staff')
          .select('id, employee_id, first_name, last_name, email, phone, position, department, branch_id, hire_date, salary, is_active, role')
          .order('hire_date', { ascending: false });
        if (err) throw err;
        setStaffRows((data as StaffRow[]) || []);
      } catch (e: any) {
        console.error('Failed to load staff', e);
        setError('Failed to load staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return staffRows.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim().toLowerCase();
      return (
        !term ||
        name.includes(term) ||
        (s.email || '').toLowerCase().includes(term) ||
        (s.phone || '').toLowerCase().includes(term) ||
        (s.position || '').toLowerCase().includes(term) ||
        (s.department || '').toLowerCase().includes(term)
      );
    });
  }, [staffRows, searchTerm]);

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        employee_id: form.employee_id || `EMP-${Date.now()}`,
        role: form.role || 'staff',
      };
      const { error: err } = await supabase.from('staff').insert(payload as any);
      if (err) throw err;
      // Refresh
      const { data } = await supabase
        .from('staff')
        .select('id, employee_id, first_name, last_name, email, phone, position, department, branch_id, hire_date, salary, is_active, role')
        .order('hire_date', { ascending: false });
      setStaffRows((data as StaffRow[]) || []);
      setIsAddOpen(false);
      setForm({
        first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hire_date: new Date().toISOString().slice(0,10), is_active: true, employee_id: '', role: 'staff', branch_id: undefined, salary: undefined,
      });
    } catch (e: any) {
      console.error('Failed to add staff', e);
      alert('Failed to add staff');
    }
  }

  async function handleRemoveStaff(id: string) {
    if (!confirm('Remove this staff member?')) return;
    try {
      const { error: err } = await supabase.from('staff').delete().eq('id', id);
      if (err) throw err;
      setStaffRows(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      console.error('Failed to remove staff', e);
      alert('Failed to remove staff');
    }
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        position: form.position,
        department: form.department,
        hire_date: form.hire_date,
        is_active: form.is_active,
        employee_id: form.employee_id,
        role: form.role,
        branch_id: form.branch_id,
        salary: form.salary,
      };
      const { error: err } = await supabase.from('staff').update(payload as any).eq('id', editId);
      if (err) throw err;
      const { data } = await supabase
        .from('staff')
        .select('id, employee_id, first_name, last_name, email, phone, position, department, branch_id, hire_date, salary, is_active, role')
        .order('hire_date', { ascending: false });
      setStaffRows((data as StaffRow[]) || []);
      setIsEditOpen(false);
      setEditId(null);
    } catch (e: any) {
      console.error('Failed to update staff', e);
      alert('Failed to update staff');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Leave':
        return 'bg-orange-100 text-orange-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <>
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          </>
        )}
        {error && !loading && (
          <div className="col-span-3 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && filtered.map((s) => {
          const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unnamed';
          const status = s.is_active ? 'Active' : 'Inactive';
          return (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                <p className="text-sm text-gray-600">{s.position || '—'}</p>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{s.email || '—'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{s.phone || '—'}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Hired: {s.hire_date ? new Date(s.hire_date).toISOString().slice(0,10) : '—'}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Department:</span> {s.department || '—'}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => openEditModal(s)} className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors">
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button onClick={() => handleRemoveStaff(s.id)} className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Remove</span>
              </button>
            </div>
          </div>
        );})}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Staff Member</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input value={form.first_name} onChange={e=>setForm(f=>({...f, first_name:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input value={form.last_name} onChange={e=>setForm(f=>({...f, last_name:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Position</label>
                  <input value={form.position} onChange={e=>setForm(f=>({...f, position:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e=>setForm(f=>({...f, department:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hire Date</label>
                  <input type="date" value={form.hire_date} onChange={e=>setForm(f=>({...f, hire_date:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Employee ID</label>
                  <input value={form.employee_id} onChange={e=>setForm(f=>({...f, employee_id:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Auto-generated if empty" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Role</label>
                  <input value={form.role} onChange={e=>setForm(f=>({...f, role:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Salary (optional)</label>
                  <input type="number" value={form.salary ?? ''} onChange={e=>setForm(f=>({...f, salary: e.target.value ? Number(e.target.value) : undefined}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select value={form.is_active ? 'active' : 'inactive'} onChange={e=>setForm(f=>({...f, is_active: e.target.value === 'active'}))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={()=> setIsAddOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Staff Member</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input value={form.first_name} onChange={e=>setForm(f=>({...f, first_name:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input value={form.last_name} onChange={e=>setForm(f=>({...f, last_name:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Position</label>
                  <input value={form.position} onChange={e=>setForm(f=>({...f, position:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Department</label>
                  <input value={form.department} onChange={e=>setForm(f=>({...f, department:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hire Date</label>
                  <input type="date" value={form.hire_date} onChange={e=>setForm(f=>({...f, hire_date:e.target.value}))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Employee ID</label>
                  <input value={form.employee_id} onChange={e=>setForm(f=>({...f, employee_id:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Role</label>
                  <input value={form.role} onChange={e=>setForm(f=>({...f, role:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Salary (optional)</label>
                  <input type="number" value={form.salary ?? ''} onChange={e=>setForm(f=>({...f, salary: e.target.value ? Number(e.target.value) : undefined}))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select value={form.is_active ? 'active' : 'inactive'} onChange={e=>setForm(f=>({...f, is_active: e.target.value === 'active'}))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={()=> setIsEditOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;