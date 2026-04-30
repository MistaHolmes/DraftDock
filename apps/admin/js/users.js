// ── Users Page Logic ─────────────────────────────────────────────────────────
let usersPage = 1;
let usersSearch = '';
let usersRole = '';
let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadUsers();
    wireUserFilters();
  } catch (err) {
    console.error('Users load error:', err);
    showToast('Failed to load users', 'error');
  }
});

// ── Load Users ───────────────────────────────────────────────────────────────
async function loadUsers() {
  const params = `?page=${usersPage}&limit=20&search=${usersSearch}&role=${usersRole}`;
  const data = await fetchAdmin(`/users${params}`);
  allUsers = data.users;
  const container = document.getElementById('users-grid');
  if (!container) return;

  if (!data.users.length) {
    container.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400">No users found</div>';
    return;
  }

  container.innerHTML = data.users.map(user => {
    const name = user.name || user.email.split('@')[0];
    const img = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7742a6&color=fff`;
    const roleColors = { ADMIN: 'text-red-600 bg-red-50', AUTHOR: 'text-primary bg-primary/10', CONTRIBUTOR: 'text-amber-600 bg-amber-50' };
    const roleClass = roleColors[user.role] || 'text-slate-500 bg-slate-100';
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return `
      <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img class="w-12 h-12 rounded-full object-cover" src="${img}" alt="${name}"/>
              ${user.isVerified ? '<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"><span class="material-symbols-outlined text-white" style="font-size:12px">check</span></div>' : ''}
            </div>
            <div>
              <p class="text-sm font-bold text-on-surface">${name}</p>
              <p class="text-[11px] text-slate-500">${user.email}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2 py-1 rounded-full ${roleClass}">${user.role}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="text-center">
            <p class="text-sm font-black text-on-surface">${user._count?.blogs || 0}</p>
            <p class="text-[10px] text-slate-500">Posts</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-black text-on-surface">${formatNumber(user.totalViews || 0)}</p>
            <p class="text-[10px] text-slate-500">Views</p>
          </div>
          <div class="text-center">
            <p class="text-sm font-black text-on-surface">${user._count?.followers || 0}</p>
            <p class="text-[10px] text-slate-500">Followers</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-4">
          <span>Level ${user.writerLevel || 1}</span>
          <span>Joined ${joinDate}</span>
        </div>
        <div class="flex gap-2">
          <select onchange="changeRole('${user.id}', this.value)" class="flex-1 text-[11px] bg-surface-container-low border-none rounded-lg py-2 px-2 font-bold text-on-surface focus:ring-2 focus:ring-primary/20">
            <option value="" disabled selected>Change Role</option>
            <option value="ADMIN" ${user.role === 'ADMIN' ? 'disabled' : ''}>Admin</option>
            <option value="AUTHOR" ${user.role === 'AUTHOR' ? 'disabled' : ''}>Author</option>
            <option value="CONTRIBUTOR" ${user.role === 'CONTRIBUTOR' ? 'disabled' : ''}>Contributor</option>
          </select>
          <button onclick="toggleVerify('${user.id}')" class="px-3 py-2 rounded-lg text-[11px] font-bold ${user.isVerified ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'} hover:opacity-80 transition-colors">
            ${user.isVerified ? '✓ Verified' : 'Verify'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Pagination
  const pagEl = document.getElementById('users-pagination');
  if (pagEl) {
    const p = data.pagination;
    pagEl.innerHTML = `
      <span class="text-sm text-slate-500">Showing ${data.users.length} of ${p.total} users</span>
      <div class="flex gap-2">
        <button onclick="goToUsersPage(${p.page - 1})" ${p.page <= 1 ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-bold ${p.page <= 1 ? 'text-slate-300' : 'text-primary hover:bg-primary/10'}">Prev</button>
        <button onclick="goToUsersPage(${p.page + 1})" ${p.page >= p.totalPages ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-bold ${p.page >= p.totalPages ? 'text-slate-300' : 'text-primary hover:bg-primary/10'}">Next</button>
      </div>
    `;
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function changeRole(userId, role) {
  if (!role) return;
  try {
    await fetchAdmin(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    showToast(`Role updated to ${role}`);
    await loadUsers();
  } catch (err) {
    showToast('Failed to change role', 'error');
  }
}

async function toggleVerify(userId) {
  try {
    await fetchAdmin(`/users/${userId}/verify`, { method: 'PATCH' });
    showToast('Verification status updated');
    await loadUsers();
  } catch (err) {
    showToast('Failed to toggle verification', 'error');
  }
}

function goToUsersPage(page) {
  if (page < 1) return;
  usersPage = page;
  loadUsers();
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportUsersCSV() {
  if (!allUsers.length) return showToast('No users to export', 'warning');
  const headers = ['Name', 'Email', 'Role', 'Verified', 'Posts', 'Views', 'Joined'];
  const rows = allUsers.map(u => [
    u.name || '', u.email, u.role, u.isVerified ? 'Yes' : 'No',
    u._count?.blogs || 0, u.totalViews || 0,
    new Date(u.createdAt).toLocaleDateString()
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'users_export.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Users exported!');
}

// ── Filters ──────────────────────────────────────────────────────────────────
function wireUserFilters() {
  const search = document.getElementById('user-search');
  const roleFilter = document.getElementById('role-filter');
  const exportBtn = document.getElementById('export-users');

  if (search) {
    let timeout;
    search.addEventListener('input', e => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { usersSearch = e.target.value; usersPage = 1; loadUsers(); }, 400);
    });
  }
  if (roleFilter) roleFilter.addEventListener('change', e => { usersRole = e.target.value; usersPage = 1; loadUsers(); });
  if (exportBtn) exportBtn.addEventListener('click', exportUsersCSV);
}
