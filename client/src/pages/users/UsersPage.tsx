import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input, Select } from "../../components/ui/Field.js";
import { ConfirmDialog, Modal } from "../../components/ui/Modal.js";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui/Primitives.js";
import { dateOnly } from "../../lib/format.js";
import type { AppUser, Role } from "../../types/index.js";

interface UserForm {
  fullName: string;
  username: string;
  roleId: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  selectedModules: string[];
}

const emptyForm: UserForm = {
  fullName: "",
  username: "",
  roleId: "",
  password: "",
  securityQuestion: "",
  securityAnswer: "",
  selectedModules: [],
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
  const [modules, setModules] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [resetting, setResetting] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [usersRes, metaRes] = await Promise.all([
        api.get<{ success: boolean; data: AppUser[] }>("/users"),
        api.get<{ success: boolean; data: { roles: Role[]; securityQuestions: string[]; modules: Record<string, string> } }>(
          "/users/meta/options"
        ),
      ]);
      setUsers(usersRes.data.data);
      setRoles(metaRes.data.data.roles);
      setSecurityQuestions(metaRes.data.data.securityQuestions);
      setModules(metaRes.data.data.modules);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditing(u);
    setForm({
      fullName: u.fullName,
      username: u.username,
      roleId: String(u.roleId),
      password: "",
      securityQuestion: "",
      securityAnswer: "",
      selectedModules: u.allowedModules ?? [],
    });
    setModalOpen(true);
  }

  function toggleModule(key: string) {
    setForm((f) => ({
      ...f,
      selectedModules: f.selectedModules.includes(key)
        ? f.selectedModules.filter((m) => m !== key)
        : [...f.selectedModules, key],
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/users/${editing.userId}`, {
          fullName: form.fullName,
          username: form.username,
          roleId: Number(form.roleId),
          newPassword: form.password || undefined,
          securityQuestion: form.securityQuestion || undefined,
          securityAnswer: form.securityAnswer || undefined,
          selectedModules: form.selectedModules,
        });
        toast.success("User si guul leh ayaa loo cusboonaysiiyay.");
      } else {
        await api.post("/users", {
          fullName: form.fullName,
          username: form.username,
          roleId: Number(form.roleId),
          password: form.password,
          securityQuestion: form.securityQuestion,
          securityAnswer: form.securityAnswer,
          selectedModules: form.selectedModules,
        });
        toast.success("User si guul leh ayaa loo daray.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.delete(`/users/${deleting.userId}`);
      toast.success("User si guul leh ayaa loo tirtiray.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
    }
  }

  async function submitReset() {
    if (!resetting) return;
    setResetBusy(true);
    try {
      await api.post(`/users/${resetting.userId}/reset-password`, { newPassword, confirmPassword });
      toast.success("Password si guul leh ayaa loo beddelay.");
      setResetting(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Maamul isticmaalayaasha system-ka iyo modules-ka ay geli karaan (Admin oo kaliya)."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Ku dar User
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState title="User lama helin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">{u.fullName}</td>
                    <td className="px-4 py-3">{u.username}</td>
                    <td className="px-4 py-3">
                      <Badge>{u.role ?? "-"}</Badge>
                    </td>
                    <td className="px-4 py-3">{dateOnly(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setResetting(u)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Ku dar User"} width="max-w-xl">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" required>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Username" required>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role" required>
              <Select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                <option value="">-- Dooro --</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={editing ? "New Password (ikhtiyaari)" : "Password"} required={!editing} hint="Ugu yaraan 8 xaraf, xuruuf + number">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Security Question" required={!editing}>
              <Select value={form.securityQuestion} onChange={(e) => setForm({ ...form, securityQuestion: e.target.value })}>
                <option value="">-- Dooro --</option>
                {securityQuestions.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Security Answer" required={!editing}>
              <Input value={form.securityAnswer} onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">Modules uu geli karo (Cashier)</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3">
              {Object.entries(modules).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.selectedModules.includes(key)}
                    onChange={() => toggleModule(key)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">Admin waligiis dhammaan modules-ka wuu heli — lama eegayo halkan.</p>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Jooji
            </Button>
            <Button onClick={submit} loading={saving}>
              Kaydi
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!resetting} onClose={() => setResetting(null)} title={`Reset Password — ${resetting?.username ?? ""}`}>
        <div className="flex flex-col gap-4">
          <Field label="New Password" required hint="Ugu yaraan 8 xaraf, xuruuf + number">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <Field label="Confirm Password" required>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
          <div className="mt-1 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetting(null)}>
              Jooji
            </Button>
            <Button onClick={submitReset} loading={resetBusy}>
              Beddel Password
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xaqiiji tirtiridda"
        message="Ma hubtaa inaad tirtirto user-kan?"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
