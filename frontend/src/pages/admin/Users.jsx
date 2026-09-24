import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Pagination from "../../components/Pagination";
import { Search, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUsers, setUserStatus } from "../../api/adminApi";
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
  ADMIN: { background: "var(--red-100)", color: "var(--red-800)" },
  EXPORT_MANAGER: { background: "var(--blue-100)", color: "var(--blue-800)" },
  CLIENT: { background: "var(--amber-100)", color: "var(--amber-800)" },
};

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
      <td colSpan={5} className="empty-state">
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

  return (
    <DashboardLayout>
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage user accounts, roles and permissions.</p>
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
              <th>Status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  Loading users...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={5} className="empty-state">
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
          background: var(--red-50);
          color: var(--red-700);
          border: 1px solid var(--red-200);
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
          background: var(--gray-100);
          color: var(--gray-600);
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

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        .status-pill.is-active { color: var(--green-700); }
        .status-pill.is-inactive { color: var(--red-700); }

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
          background: var(--red-50);
          color: var(--red-700);
          border-color: var(--red-200);
        }
        .status-toggle.activate {
          background: var(--green-50);
          color: var(--green-700);
          border-color: var(--green-200);
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--gray-500);
          font-size: 14px;
        }
        .link-button {
          margin-top: 8px;
          background: none;
          border: none;
          color: var(--blue-600);
          cursor: pointer;
          font-size: 13px;
          padding: 0;
        }
        .link-button:hover { text-decoration: underline; }
      `}</style>
    </DashboardLayout>
  );
}
