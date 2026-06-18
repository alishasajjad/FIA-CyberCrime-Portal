import React from "react";
import { apiFetch } from "services/api";
import { StatCard } from "components/ui";
import {
  MdPeople,
  MdGroups,
  MdVerifiedUser,
  MdPendingActions,
  MdSearch,
} from "react-icons/md";

const ROLE_FILTERS = ["All", "Admin", "InvestigationOfficer", "PendingOfficer", "User"];

const Users = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("All");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [allUsersData, pendingOfficerData] = await Promise.all([
        apiFetch("/users"),
        apiFetch("/users/officer-requests"),
      ]);
      const allUsers = Array.isArray(allUsersData?.users) ? allUsersData.users : [];
      const pendingUsers = Array.isArray(pendingOfficerData?.users)
        ? pendingOfficerData.users
        : [];
      const mergedById = new Map();
      [...allUsers, ...pendingUsers].forEach((u) => {
        if (u?._id) mergedById.set(u._id, u);
      });
      setUsers(Array.from(mergedById.values()));
    } catch (err) {
      window.alert(err?.message || "Users fetch error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateAdmin = async () => {
    const name = document.getElementById("newAdminName")?.value?.trim() || "";
    const email = document.getElementById("newAdminEmail")?.value?.trim() || "";
    const password = document.getElementById("newAdminPassword")?.value || "";
    const unit = document.getElementById("newAdminUnit")?.value?.trim() || "";
    const phoneNumber =
      document.getElementById("newAdminPhone")?.value?.trim() || "";
    const cnic = document.getElementById("newAdminCnic")?.value?.trim() || "";

    if (!name || !email || !password) {
      window.alert("Name, email, and password are required.");
      return;
    }

    try {
      await apiFetch("/users/admin/create", {
        method: "POST",
        body: { name, email, password, unit, phoneNumber, cnic },
      });
      window.alert("Administrator created.");
      document.getElementById("newAdminName").value = "";
      document.getElementById("newAdminEmail").value = "";
      document.getElementById("newAdminPassword").value = "";
      document.getElementById("newAdminUnit").value = "";
      document.getElementById("newAdminPhone").value = "";
      document.getElementById("newAdminCnic").value = "";
      await loadUsers();
    } catch (err) {
      window.alert(err?.message || "Create failed");
    }
  };

  const saveUserRow = async (userId) => {
    const role = document.getElementById(`role-${userId}`)?.value;
    const status = document.getElementById(`status-${userId}`)?.value;
    const unit = document.getElementById(`unit-${userId}`)?.value?.trim();
    const phoneNumber = document.getElementById(`phone-${userId}`)?.value?.trim();
    const cnic = document.getElementById(`cnic-${userId}`)?.value?.trim();

    try {
      await apiFetch(`/users/${userId}`, {
        method: "PATCH",
        body: { role, status, unit, phoneNumber, cnic },
      });
      window.alert("User updated.");
      await loadUsers();
    } catch (err) {
      window.alert(err?.message || "Update failed");
    }
  };

  const reviewOfficerRequest = async (userId, action) => {
    const department = document.getElementById(`unit-${userId}`)?.value?.trim() || "";
    const reason = document.getElementById(`officerReason-${userId}`)?.value?.trim() || "";
    try {
      await apiFetch(`/users/${userId}/officer-review`, {
        method: "POST",
        body: { action, department, reason },
      });
      window.alert(`Officer request ${action}d.`);
      await loadUsers();
    } catch (err) {
      window.alert(err?.message || "Officer review failed");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });
      window.alert("User deleted.");
      await loadUsers();
    } catch (err) {
      window.alert(err?.message || "Delete failed");
    }
  };

  const counts = React.useMemo(
    () => ({
      total: users.length,
      officers: users.filter((u) => u.role === "InvestigationOfficer").length,
      pending: users.filter(
        (u) => u.role === "PendingOfficer" || u.officerRequestStatus === "Pending"
      ).length,
      admins: users.filter((u) => u.role === "Admin").length,
    }),
    [users]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.unit || "").toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  return (
    <div className="mt-3 space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdPeople} label="Total Users" value={counts.total} accent="brand" loading={loading} />
        <StatCard icon={MdGroups} label="Officers" value={counts.officers} accent="blue" loading={loading} />
        <StatCard icon={MdPendingActions} label="Pending Requests" value={counts.pending} accent="amber" loading={loading} />
        <StatCard icon={MdVerifiedUser} label="Administrators" value={counts.admins} accent="navy" loading={loading} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">
          User Management
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Create additional administrators and manage roles, units, and account
          status. Regular users and officers typically self-register.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Full name
            </label>
            <input
              id="newAdminName"
              type="text"
              placeholder="Administrator name"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              id="newAdminEmail"
              type="email"
              placeholder="admin@agency.gov"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              id="newAdminPassword"
              type="password"
              placeholder="Min. 8 characters"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Unit / department
            </label>
            <input
              id="newAdminUnit"
              type="text"
              placeholder="e.g. Cyber Crime Cell"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Phone number
            </label>
            <input
              id="newAdminPhone"
              type="text"
              placeholder="+92 300 1234567"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              CNIC
            </label>
            <input
              id="newAdminCnic"
              type="text"
              placeholder="35202-1234567-1"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="button"
              className="rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              onClick={handleCreateAdmin}
            >
              Create administrator
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">
            Directory
          </h3>
          <button
            type="button"
            className="rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-green-900 dark:text-green-200 dark:hover:bg-navy-900"
            onClick={() => loadUsers()}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or unit…"
              className="w-full rounded-xl border border-gray-200 bg-lightPrimary py-2.5 pl-9 pr-3 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-lightPrimary px-3 py-2.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r === "All" ? "All roles" : r}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-white/10">
            <thead className="bg-gray-50 dark:bg-navy-900">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Name
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Email
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Role
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Officer Request
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Unit
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Phone
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  CNIC
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Status
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="9">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="9">
                    {users.length === 0
                      ? "No users found."
                      : "No users match your search or filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user._id}
                    className="align-top hover:bg-gray-50 dark:hover:bg-navy-900"
                  >
                    <td className="px-4 py-3 font-medium text-navy-700 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        id={`role-${user._id}`}
                        defaultValue={user.role}
                        className="w-full min-w-[140px] rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      >
                        <option value="Admin">Admin</option>
                        <option value="InvestigationOfficer">
                          InvestigationOfficer
                        </option>
                        <option value="PendingOfficer">PendingOfficer</option>
                        <option value="User">User</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      <div>{user.officerRequestStatus || "None"}</div>
                      {user.officerReviewReason ? (
                        <div className="mt-1 text-[11px] text-gray-500">
                          {user.officerReviewReason}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        id={`unit-${user._id}`}
                        defaultValue={user.unit || ""}
                        className="w-full min-w-[120px] rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        id={`phone-${user._id}`}
                        defaultValue={user.phoneNumber || ""}
                        className="w-full min-w-[120px] rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        id={`cnic-${user._id}`}
                        defaultValue={user.cnic || ""}
                        className="w-full min-w-[140px] rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        id={`status-${user._id}`}
                        defaultValue={user.status || "Active"}
                        className="w-full min-w-[110px] rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {(user.role === "PendingOfficer" ||
                          user.officerRequestStatus === "Pending") && (
                          <>
                            <input
                              id={`officerReason-${user._id}`}
                              placeholder="Review reason (optional)"
                              className="rounded-lg border border-gray-200 bg-lightPrimary px-2 py-1 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                            />
                            <button
                              type="button"
                              className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                              onClick={() => reviewOfficerRequest(user._id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              onClick={() => reviewOfficerRequest(user._id, "reject")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          onClick={() => saveUserRow(user._id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-navy-800"
                          onClick={() => deleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
