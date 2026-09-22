import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, CheckCircle2, XCircle, KeyRound, X, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUsers, setUserStatus, setUserPermissions, getAvailablePermissions } from "../../api/adminApi";
import { ApiError } from "../../api/client";
import "../../components/dashboard.css";

// ---------------------------------------------------------------------------
// Static display config (labels/colors only - the actual role & permission
// *values* always come from the backend, never hardcoded here)
// ---------------------------------------------------------------------------

const ROLE_LABELS = {
  ADMIN: "Admin",
  EXPORT_MANAGER: "Export Manager",
  CLIENT: "Client",
};

const ROLE_BADGE_STYLES = {
  ADMIN: { background: "#fee2e2", color: "#991b1b" },
  EXPORT_MANAGER: { background: "#dbeafe", color: "#1e40af" },
  CLIENT: { background: "#fef3c7", color: "#92400e" },
};

function formatPermission(name) {
  return name
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
}

function initials(username = "") {
  return username.slice(0, 2).toUpperCase();
}

function errorMessage(err, fallback) {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function RoleBadge({ role }) {
  return (
    <span className="role-badge" style={ROLE_BADGE_STYLES[role]}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusPill({ enabled }) {
  return (
    <span className={`status-pill ${enabled ? "is-active" : "is-inactive"}`}>
      {enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {enabled ? "Active" : "Inactive"}
    </span>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <tr>
      <td colSpan={6} className="empty-state">
        {hasFilters ? (
          <>
            <p>No users match your search or filter.</p>
            <button className="link-button" onClick={onClear}>
              Clear filters
            </button>
          </>
        ) : (
          <p>No users yet.</p>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent to the server
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionsModalUser, setPermissionsModalUser] = useState(null);

  const [rowActionError, setRowActionError] = useState(null);
  const [pendingUserId, setPendingUserId] = useState(null);

  // Debounce free-text search so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getUsers({
        page,
        size: pageSize,
        search: search || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
      });
      setUsers(data.content);
      setPageInfo({ totalElements: data.totalElements, totalPages: data.totalPages });
    } catch (err) {
      setUsers([]);
      setLoadError(errorMessage(err, "Couldn't load users. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // The available permission set comes from the backend enum, not hardcoded here.
  useEffect(() => {
    getAvailablePermissions()
      .then(setAvailablePermissions)
      .catch(() => setAvailablePermissions([]));
  }, []);

  const hasActiveFilters = search !== "" || roleFilter !== "ALL";

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("ALL");
    setPage(0);
  }, []);

  const toggleStatus = useCallback(async (targetUser) => {
    setRowActionError(null);
    setPendingUserId(targetUser.id);
    try {
      const updated = await setUserStatus(targetUser.id, !targetUser.enabled);
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setRowActionError(errorMessage(err, "Couldn't update that user's status."));
    } finally {
      setPendingUserId(null);
    }
  }, []);

  const savePermissions = useCallback(async (userId, permissions) => {
    const updated = await setUserPermissions(userId, permissions); // let the modal handle errors
    setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
    setPermissionsModalUser(null);
  }, []);

  return (
    <DashboardLayout>
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage users, roles and permissions</p>
      </div>

      <div className="panel users-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by username or email..."
            aria-label="Search users"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="EXPORT_MANAGER">Export Manager</option>
          <option value="CLIENT">Client</option>
        </select>
      </div>

      {rowActionError && (
        <div className="inline-banner error">
          <AlertCircle size={16} />
          {rowActionError}
        </div>
      )}

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  Loading users...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <p>{loadError}</p>
                  <button className="link-button" onClick={fetchUsers}>
                    Retry
                  </button>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
            ) : (
              users.map((user) => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="avatar">{initials(user.username)}</span>
                        {user.username}
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      {user.roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </td>

                    <td>
                      <button
                        className="permissions-button"
                        onClick={() => setPermissionsModalUser(user)}
                      >
                        <KeyRound size={14} />
                        {user.permissions.length} granted
                      </button>
                    </td>

                    <td>
                      <StatusPill enabled={user.enabled} />
                    </td>

                    <td className="col-action">
                      <button
                        className={`status-toggle ${user.enabled ? "deactivate" : "activate"}`}
                        onClick={() => toggleStatus(user)}
                        disabled={pendingUserId === user.id || (isSelf && user.enabled)}
                        title={isSelf && user.enabled ? "You can't deactivate your own account" : undefined}
                      >
                        {pendingUserId === user.id
                          ? "Saving..."
                          : user.enabled
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          size={pageSize}
          totalElements={pageInfo.totalElements}
          totalPages={pageInfo.totalPages}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          onPageChange={(next) => setPage(next)}
        />
      </div>

      {permissionsModalUser && (
        <PermissionsModal
          user={permissionsModalUser}
          allPermissions={availablePermissions}
          close={() => setPermissionsModalUser(null)}
          save={savePermissions}
        />
      )}

      <style>{`
        .users-toolbar {
          margin-top: 25px;
          padding: 20px;
          display: flex;
          gap: 15px;
          justify-content: space-between;
        }
        .users-toolbar .search-box { flex: 1; }
        .table-panel { margin-top: 20px; }

        .inline-banner {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }
        .inline-banner.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #eef0f3;
          color: #4b5563;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          margin-right: 5px;
          font-size: 12px;
          font-weight: 600;
        }

        .permissions-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #e2e5ea;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .permissions-button:hover {
          border-color: #cbd2dc;
          background: #f9fafb;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .status-pill.is-active { color: #15803d; }
        .status-pill.is-inactive { color: #b91c1c; }

        .col-action { text-align: right; }

        .status-toggle {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: opacity 0.15s ease;
        }
        .status-toggle:hover:not(:disabled) { opacity: 0.85; }
        .status-toggle:disabled { cursor: not-allowed; opacity: 0.5; }
        .status-toggle.deactivate {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }
        .status-toggle.activate {
          background: #f0fdf4;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        }
        .link-button {
          margin-top: 8px;
          background: none;
          border: none;
          color: #2563eb;
          cursor: pointer;
          font-size: 13px;
          padding: 0;
        }
        .link-button:hover { text-decoration: underline; }
      `}</style>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Permissions modal
// ---------------------------------------------------------------------------

function PermissionsModal({ user, allPermissions, close, save }) {
  const [selected, setSelected] = useState(new Set(user.permissions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const firstCheckboxRef = useRef(null);

  // Close on Escape, focus the dialog on open.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    firstCheckboxRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const toggle = (permission) => {
    setSelected((current) => {
      const copy = new Set(current);
      if (copy.has(permission)) {
        copy.delete(permission);
      } else {
        copy.add(permission);
      }
      return copy;
    });
  };

  const allSelected = allPermissions.length > 0 && selected.size === allPermissions.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allPermissions));
  };

  const hasChanges =
    selected.size !== user.permissions.length ||
    user.permissions.some((p) => !selected.has(p));

  const onOverlayClick = (e) => {
    if (e.target === e.currentTarget) close();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await save(user.id, [...selected]);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save permissions. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onOverlayClick} role="presentation">
      <div
        className="panel modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-modal-title"
        ref={dialogRef}
      >
        <div className="modal-header">
          <div>
            <h2 id="permissions-modal-title">Permissions</h2>
            <p className="modal-subtitle">{user.username}</p>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="inline-banner error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {allPermissions.length === 0 ? (
          <p className="modal-subtitle">No permissions available to assign.</p>
        ) : (
          <>
            <div className="modal-select-all">
              <button className="link-button" onClick={toggleAll}>
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="permissions-list">
              {allPermissions.map((permission, index) => (
                <label key={permission} className="permission-row">
                  <input
                    type="checkbox"
                    ref={index === 0 ? firstCheckboxRef : null}
                    checked={selected.has(permission)}
                    onChange={() => toggle(permission)}
                  />
                  {formatPermission(permission)}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="button-secondary" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button
            className="button-primary"
            disabled={!hasChanges || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal-card {
          width: 400px;
          max-width: calc(100vw - 32px);
          padding: 20px;
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .modal-header h2 { margin: 0; font-size: 18px; }
        .modal-subtitle { margin: 2px 0 0; color: #6b7280; font-size: 13px; }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 6px;
        }
        .icon-button:hover { background: #f3f4f6; color: #111827; }

        .inline-banner {
          margin: 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
        }
        .inline-banner.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .modal-select-all {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 280px;
          overflow-y: auto;
        }
        .permission-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 6px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
        .permission-row:hover { background: #f9fafb; }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }
        .button-secondary,
        .button-primary {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .button-secondary {
          background: #fff;
          border: 1px solid #e2e5ea;
          color: #374151;
        }
        .button-secondary:hover:not(:disabled) { background: #f9fafb; }
        .button-primary {
          background: #111827;
          border: 1px solid #111827;
          color: #fff;
        }
        .button-primary:hover:not(:disabled) { background: #1f2937; }
        .button-primary:disabled {
          background: #d1d5db;
          border-color: #d1d5db;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}