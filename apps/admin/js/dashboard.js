// ── Dashboard Page Logic ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStats();
    await Promise.all([
      loadTopTags(),
      loadTopAuthors(),
      loadRecentActivity(),
      loadGrowthChart(),
    ]);
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to load dashboard data', 'error');
  }
});

// ── Stat Cards ───────────────────────────────────────────────────────────────
async function loadStats() {
  const data = await fetchAdmin('/stats');
  const container = document.getElementById('stat-cards');
  if (!container) return;

  const viewGrowth = data.blogGrowth || 0;
  const userGrowth = data.userGrowth || 0;
  
  container.innerHTML = `
    <!-- Total Views Card -->
    <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">visibility</span>
        </div>
        <span class="stat-badge text-xs font-bold px-2 py-1 rounded-full ${viewGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}">
          ${viewGrowth >= 0 ? '+' : ''}${viewGrowth}%
        </span>
      </div>
      <div class="mt-4">
        <p class="text-sm font-bold text-slate-500 mb-1">Total Views</p>
        <h3 class="text-3xl font-black text-on-surface stat-value">${formatNumber(data.totalViews)}</h3>
      </div>
    </div>

    <!-- Active Users Card -->
    <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">group</span>
        </div>
        <span class="stat-badge text-xs font-bold px-2 py-1 rounded-full ${userGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}">
          ${userGrowth >= 0 ? '+' : ''}${userGrowth}%
        </span>
      </div>
      <div class="mt-4">
        <p class="text-sm font-bold text-slate-500 mb-1">Total Users</p>
        <h3 class="text-3xl font-black text-on-surface stat-value">${formatNumber(data.totalUsers)}</h3>
      </div>
    </div>

    <!-- Drafts Card -->
    <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">edit_note</span>
        </div>
        <span class="stat-badge text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Steady</span>
      </div>
      <div class="mt-4">
        <p class="text-sm font-bold text-slate-500 mb-1">In Drafts</p>
        <h3 class="text-3xl font-black text-on-surface stat-value">${formatNumber(data.draftsCount)}</h3>
      </div>
    </div>

    <!-- Revenue Card -->
    <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/15 flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
        </div>
        <span class="stat-badge text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+18.1%</span>
      </div>
      <div class="mt-4">
        <p class="text-sm font-bold text-slate-500 mb-1">Est. Revenue</p>
        <h3 class="text-3xl font-black text-on-surface stat-value">$${formatNumber(data.totalRevenue || 0)}</h3>
      </div>
    </div>
  `;
}

// ── Trending Topics ──────────────────────────────────────────────────────────
async function loadTopTags() {
  const data = await fetchAdmin('/analytics/top-tags');
  const container = document.getElementById('trending-topics');
  if (!container || !data.tags.length) return;

  container.innerHTML = data.tags.map((tag, i) => `
    <div class="${i === 0 ? 'bg-secondary-container px-4 py-2 rounded-xl text-sm font-bold text-on-secondary-container' : 'bg-surface-container-lowest px-4 py-2 rounded-xl text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 shadow-sm'} flex items-center gap-2">
      #${tag.name} <span class="text-[10px] ${i === 0 ? 'opacity-70' : 'text-primary'}">${formatNumber(tag.blogCount)} posts</span>
    </div>
  `).join('');
}

// ── Top Authors ──────────────────────────────────────────────────────────────
async function loadTopAuthors() {
  const data = await fetchAdmin('/analytics/top-authors');
  const container = document.getElementById('top-authors');
  if (!container || !data.authors.length) return;

  container.innerHTML = data.authors.slice(0, 3).map((author, i) => {
    const colors = ['bg-tertiary', 'bg-surface-container-highest', 'bg-surface-container-highest'];
    const textColors = ['text-on-tertiary', 'text-on-surface', 'text-on-surface'];
    const imgSrc = author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || author.email)}&background=7742a6&color=fff`;

    return `
      <div class="flex items-center justify-between group">
        <div class="flex items-center gap-4">
          <div class="relative">
            <img class="w-12 h-12 rounded-full object-cover" src="${imgSrc}" alt="${author.name || author.email}"/>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 ${colors[i]} rounded-full border-2 border-surface-container-lowest flex items-center justify-center">
              <span class="text-[8px] ${textColors[i]} font-bold">${i + 1}</span>
            </div>
          </div>
          <div>
            <p class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">${author.name || author.email}</p>
            <p class="text-[10px] text-slate-500 font-medium">${author._count.blogs} Articles</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-black text-on-surface">${formatNumber(author.totalViews)}</p>
          <p class="text-[10px] text-green-600 font-bold">Views</p>
        </div>
      </div>
    `;
  }).join('');
}

// ── Recent Activity ──────────────────────────────────────────────────────────
async function loadRecentActivity() {
  const data = await fetchAdmin('/analytics/recent-activity');
  const container = document.getElementById('recent-activity');
  if (!container || !data.activity.length) return;

  const iconMap = {
    user_joined: { icon: 'person_add', color: 'text-blue-500', label: 'New User' },
    blog_published: { icon: 'check_circle', color: 'text-green-500', label: 'Published' },
  };

  container.innerHTML = data.activity.slice(0, 3).map(item => {
    const meta = iconMap[item.type] || { icon: 'info', color: 'text-slate-500', label: 'Event' };
    const title = item.type === 'blog_published' ? item.message : item.message;
    const subtitle = item.type === 'blog_published'
      ? `By ${item.author} • ${timeAgo(item.timestamp)}`
      : timeAgo(item.timestamp);

    return `
      <div class="bg-surface-container-lowest p-6 rounded-2xl ring-1 ring-outline-variant/10 shadow-sm hover:-translate-y-1 transition-transform">
        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined ${meta.color} text-sm">${meta.icon}</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${meta.label}</span>
        </div>
        <h4 class="font-bold text-on-surface mb-2">${title}</h4>
        <p class="text-sm text-on-surface-variant font-body mb-4">${subtitle}</p>
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px] text-primary">trending_up</span>
          </span>
          <span class="text-[10px] font-bold text-slate-500">${item.tag || 'Platform Activity'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Growth Chart ─────────────────────────────────────────────────────────────
async function loadGrowthChart() {
  const data = await fetchAdmin('/analytics/views-over-time?days=12');
  const container = document.getElementById('growth-chart');
  const labels = document.getElementById('chart-labels');
  if (!container) return;

  const views = data.data.map(d => d.views);
  const maxViews = Math.max(...views, 1);

  container.innerHTML = views.map((v, i) => {
    const height = Math.max(5, (v / maxViews) * 100);
    const isMax = v === maxViews && v > 0;
    const bgClass = isMax ? 'bg-primary' : (height > 70 ? 'bg-primary-fixed' : (height > 50 ? 'bg-primary/20' : 'bg-surface-container-low'));

    return `
      <div class="flex-1 ${bgClass} rounded-t-lg hover:bg-primary-container/30 transition-colors relative" style="height:${height}%">
        ${isMax ? `<div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] py-1 px-2 rounded whitespace-nowrap font-bold">Peak: ${formatNumber(v)}</div>` : ''}
      </div>
    `;
  }).join('');

  if (labels && data.data.length) {
    labels.innerHTML = `
      <span>${data.data[0].label}</span>
      <span>${data.data[Math.floor(data.data.length / 2)].label}</span>
      <span>${data.data[data.data.length - 1].label}</span>
    `;
  }
}
