// ── Content Page Logic ───────────────────────────────────────────────────────
let currentPage = 1;
let currentStatus = 'all';
let currentSort = 'newest';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadContent();
    await loadFeatured();
    wireFilters();
  } catch (err) {
    console.error('Content load error:', err);
    showToast('Failed to load content', 'error');
  }
});

// ── Load Posts Table ─────────────────────────────────────────────────────────
async function loadContent() {
  const data = await fetchAdmin(`/content?page=${currentPage}&limit=12&status=${currentStatus}&sort=${currentSort}&search=${currentSearch}`);
  const tbody = document.getElementById('posts-table-body');
  if (!tbody) return;

  if (!data.blogs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">No posts found</td></tr>';
    return;
  }

  tbody.innerHTML = data.blogs.map(blog => {
    const status = blog.published ? 'Published' : (blog.scheduledAt ? 'Scheduled' : 'Draft');
    const statusColor = blog.published ? 'text-green-600 bg-green-50' : (blog.scheduledAt ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50');
    const authorName = blog.author?.name || blog.author?.email || 'Unknown';
    const authorImg = blog.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=7742a6&color=fff&size=32`;
    const tags = blog.tags?.map(t => t.name).join(', ') || '—';
    const date = new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <tr class="border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors">
        <td class="py-4 px-4">
          <div class="flex items-center gap-3">
            <img class="w-8 h-8 rounded-full object-cover" src="${authorImg}" alt="${authorName}"/>
            <div>
              <p class="text-sm font-bold text-on-surface line-clamp-1">${blog.title}</p>
              <p class="text-[11px] text-slate-500">${authorName}</p>
            </div>
          </div>
        </td>
        <td class="py-4 px-4"><span class="text-xs font-bold px-2 py-1 rounded-full ${statusColor}">${status}</span></td>
        <td class="py-4 px-4 text-sm text-slate-600">${formatNumber(blog.views)}</td>
        <td class="py-4 px-4 text-sm text-slate-600">${blog._count?.comments || 0}</td>
        <td class="py-4 px-4 text-xs text-slate-500">${date}</td>
        <td class="py-4 px-4">
          <div class="flex items-center gap-1">
            <button onclick="toggleFeatured('${blog.id}')" class="p-1 rounded hover:bg-primary/10 transition-colors" title="${blog.featured ? 'Unfeature' : 'Feature'}">
              <span class="material-symbols-outlined text-sm ${blog.featured ? 'text-primary' : 'text-slate-400'}" style="${blog.featured ? "font-variation-settings:'FILL' 1;" : ''}">${blog.featured ? 'star' : 'star'}</span>
            </button>
            <button onclick="deleteBlog('${blog.id}')" class="p-1 rounded hover:bg-red-50 transition-colors" title="Delete">
              <span class="material-symbols-outlined text-sm text-slate-400 hover:text-red-500">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Pagination
  const pagEl = document.getElementById('pagination-info');
  if (pagEl) {
    const p = data.pagination;
    pagEl.innerHTML = `
      <span class="text-sm text-slate-500">Page ${p.page} of ${p.totalPages} (${p.total} posts)</span>
      <div class="flex gap-2">
        <button onclick="goToPage(${p.page - 1})" ${p.page <= 1 ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-bold ${p.page <= 1 ? 'text-slate-300' : 'text-primary hover:bg-primary/10'} transition-colors">Prev</button>
        <button onclick="goToPage(${p.page + 1})" ${p.page >= p.totalPages ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-bold ${p.page >= p.totalPages ? 'text-slate-300' : 'text-primary hover:bg-primary/10'} transition-colors">Next</button>
      </div>
    `;
  }
}

// ── Featured Posts ────────────────────────────────────────────────────────────
async function loadFeatured() {
  const data = await fetchAdmin('/content/featured');
  const container = document.getElementById('featured-posts');
  if (!container) return;

  if (!data.blogs.length) {
    container.innerHTML = '<p class="text-slate-400 text-sm">No featured posts yet</p>';
    return;
  }

  container.innerHTML = data.blogs.slice(0, 3).map(blog => {
    const authorName = blog.author?.name || blog.author?.email || 'Unknown';
    const cover = blog.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=200&fit=crop';
    return `
      <div class="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-outline-variant/10 shadow-sm hover:-translate-y-1 transition-transform">
        <img src="${cover}" alt="${blog.title}" class="w-full h-32 object-cover"/>
        <div class="p-4">
          <h4 class="font-bold text-on-surface text-sm line-clamp-2 mb-1">${blog.title}</h4>
          <p class="text-[11px] text-slate-500">${authorName} • ${formatNumber(blog.views)} views</p>
          <button onclick="toggleFeatured('${blog.id}')" class="mt-2 text-[11px] text-primary font-bold hover:underline">Unpin</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function toggleFeatured(id) {
  try {
    await fetchAdmin(`/content/${id}/featured`, { method: 'PATCH' });
    showToast('Featured status updated');
    await loadContent();
    await loadFeatured();
  } catch (err) {
    showToast('Failed to update featured', 'error');
  }
}

async function deleteBlog(id) {
  if (!confirm('Delete this blog permanently?')) return;
  try {
    await fetchAdmin(`/content/${id}`, { method: 'DELETE' });
    showToast('Blog deleted');
    await loadContent();
  } catch (err) {
    showToast('Failed to delete blog', 'error');
  }
}

function goToPage(page) {
  if (page < 1) return;
  currentPage = page;
  loadContent();
}

// ── Filters ──────────────────────────────────────────────────────────────────
function wireFilters() {
  const statusFilter = document.getElementById('status-filter');
  const sortFilter = document.getElementById('sort-filter');
  const searchInput = document.getElementById('content-search');

  if (statusFilter) statusFilter.addEventListener('change', (e) => { currentStatus = e.target.value; currentPage = 1; loadContent(); });
  if (sortFilter) sortFilter.addEventListener('change', (e) => { currentSort = e.target.value; currentPage = 1; loadContent(); });
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { currentSearch = e.target.value; currentPage = 1; loadContent(); }, 400);
    });
  }
}
