import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { fetchDashboardSummary, fetchAllUsers, updateUserApproval } from '../../api/superAdmin';
import { clearAdminToken } from '../../api/adminClient';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false, user: null, targetStatus: null });

  const loadData = async () => {
    try {
      const [summaryRes, usersRes] = await Promise.all([fetchDashboardSummary(), fetchAllUsers()]);
      setSummary(summaryRes.data);
      setUsers(usersRes.data.users);
    } catch (err) {
      showToast('Could not load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmChange = async () => {
    const { user, targetStatus } = confirmState;
    try {
      await updateUserApproval(user._id, targetStatus);
      loadData();
      showToast(targetStatus ? `${user.email} approved` : `${user.email} deactivated`, 'success');
    } catch (err) {
      showToast('Could not update this user.', 'error');
    } finally {
      setConfirmState({ open: false, user: null, targetStatus: null });
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin/login');
  };

  const pendingUsers = users.filter((u) => !u.isActive);
  const approvedUsers = users.filter((u) => u.isActive);

  const UserRow = ({ user }) => (
    <div className="ledger-row" key={user._id}>
      <div>
        <div className="ledger-row-label" style={{ color: 'var(--ink-text)', fontWeight: 500 }}>{user.email}</div>
        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--ink-text-muted)' }}>
          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}{user.role}
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 600, color: user.isActive ? 'var(--emerald)' : 'var(--rust)' }}>
          {user.isActive ? 'Approved' : 'Pending'}
        </span>
        <button
          onClick={() => setConfirmState({ open: true, user, targetStatus: !user.isActive })}
          className="btn-ledger"
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: user.isActive ? 'var(--rust)' : 'var(--emerald)', border: 'none' }}
        >
          {user.isActive ? 'Deactivate' : 'Approve'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div
        className="d-flex justify-content-between align-items-center px-4 py-3"
        style={{ background: 'var(--ink-navy)', color: 'var(--paper)' }}
      >
        <span className="font-display" style={{ fontSize: '1.3rem' }}>Admin Portal</span>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(239,234,224,0.3)', borderRadius: '3px', color: 'var(--paper)', padding: '0.4rem 0.8rem' }}>
          Log out
        </button>
      </div>

      <div className="p-4 p-md-5" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <p style={{ color: 'var(--ink-text-muted)' }}>Loading…</p>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-4">
                <div className="card-paper p-3 text-center">
                  <p className="font-mono" style={{ fontSize: '1.6rem', margin: 0, color: 'var(--ink-navy)' }}>{summary.totalUsers}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)', margin: 0 }}>Total Users</p>
                </div>
              </div>
              <div className="col-4">
                <div className="card-paper p-3 text-center">
                  <p className="font-mono" style={{ fontSize: '1.6rem', margin: 0, color: 'var(--rust)' }}>{summary.pendingApproval}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)', margin: 0 }}>Pending Approval</p>
                </div>
              </div>
              <div className="col-4">
                <div className="card-paper p-3 text-center">
                  <p className="font-mono" style={{ fontSize: '1.6rem', margin: 0, color: 'var(--emerald)' }}>{summary.approved}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-text-muted)', margin: 0 }}>Approved</p>
                </div>
              </div>
            </div>

            {pendingUsers.length > 0 && (
              <div className="card-paper p-4 mb-4">
                <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Pending Approval</h2>
                {pendingUsers.map((user) => <UserRow key={user._id} user={user} />)}
              </div>
            )}

            <div className="card-paper p-4">
              <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>All Users</h2>
              {approvedUsers.length === 0 && pendingUsers.length === 0 ? (
                <p style={{ color: 'var(--ink-text-muted)' }}>No users registered yet.</p>
              ) : (
                users.map((user) => <UserRow key={user._id} user={user} />)
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.targetStatus ? 'Approve this user?' : 'Deactivate this user?'}
        message={
          confirmState.targetStatus
            ? `${confirmState.user?.email} will be able to log in immediately.`
            : `${confirmState.user?.email} will be blocked from logging in until re-approved.`
        }
        confirmLabel={confirmState.targetStatus ? 'Approve' : 'Deactivate'}
        onConfirm={handleConfirmChange}
        onCancel={() => setConfirmState({ open: false, user: null, targetStatus: null })}
      />
    </div>
  );
};

export default AdminDashboard;