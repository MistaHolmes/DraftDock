// ── Analytics Page Logic ─────────────────────────────────────────────────────
let currentDays = 7;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Promise.all([
      loadAnalyticsOverview(),
      loadViewsChart(currentDays),
      loadTopTags(),
      loadTopAuthors(),
      loadPerformanceTrend(),
    ]);
    wireTimeRangeButtons();
  } catch (err) {
    console.error('Analytics load error:', err);
    showToast('Failed to load analytics', 'error');
  }
});

// ── Overview Stats ───────────────────────────────────────────────────────────
async function loadAnalyticsOverview() {
  const data = await fetchAdmin('/analytics/overview');

  // Real-time Stats Widget replacement
  const overviewWidget = document.querySelector('#analytics-stats > div:nth-child(1)');
  if (overviewWidget) {
    overviewWidget.className = "md:col-span-4 editorial-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative";
    overviewWidget.innerHTML = `
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-6">
          <span class="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          <p class="text-xs font-bold tracking-wider uppercase text-green-600">Live Activity</p>
        </div>
        <div class="space-y-1">
          <h1 class="text-6xl font-black text-on-surface tracking-tighter">${formatNumber(data.totalViews)}</h1>
          <p class="text-sm font-bold text-slate-500">Total Views Across Platform</p>
        </div>
      </div>
      <div class="mt-8 space-y-4 relative z-10">
        <div class="flex justify-between items-center bg-surface-container-low/50 backdrop-blur px-4 py-3 rounded-xl border border-outline-variant/10">
          <p class="text-sm font-bold text-slate-600">Total Users</p>
          <p class="text-base font-black text-on-surface">${formatNumber(data.totalUsers)}</p>
        </div>
        <div class="flex justify-between items-center bg-surface-container-low/50 backdrop-blur px-4 py-3 rounded-xl border border-outline-variant/10">
          <p class="text-sm font-bold text-slate-600">Published Blogs</p>
          <p class="text-base font-black text-on-surface">${formatNumber(data.totalBlogs)}</p>
        </div>
        <div class="flex justify-between items-center bg-surface-container-low/50 backdrop-blur px-4 py-3 rounded-xl border border-outline-variant/10">
          <p class="text-sm font-bold text-slate-600">Drafts pending</p>
          <p class="text-base font-black text-orange-500">${formatNumber(data.draftsCount)}</p>
        </div>
      </div>
    `;
  }

  // SEO Header replacement
  const seoHeader = document.getElementById('seo-header');
  if (seoHeader) {
    seoHeader.innerHTML = `
      <div>
        <h3 class="text-xl font-extrabold text-on-surface mb-1">Platform Insights</h3>
        <p class="text-sm text-slate-500 font-medium">Key performance indicators across the editorial network</p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
        <span class="material-symbols-outlined text-primary text-sm">insights</span>
        <span class="text-xs font-bold text-primary">Last 30 Days</span>
      </div>
    `;
  }

  // SEO Section stats
  const seoStats = document.getElementById('seo-stats');
  if (seoStats) {
    seoStats.classList.remove('animate-pulse');
    const avgViews = data.totalBlogs > 0 ? Math.round(data.totalViews / data.totalBlogs) : 0;
    const engagementRate = data.totalViews > 0 ? ((data.totalComments / data.totalViews) * 100).toFixed(2) : 0;
    seoStats.innerHTML = `
      <div class="p-8 space-y-1 hover:bg-surface-container-lowest/50 transition-colors">
        <p class="text-sm font-bold text-slate-500 mb-2">Avg. Views per Post</p>
        <p class="text-3xl font-black text-on-surface">${formatNumber(avgViews)}</p>
      </div>
      <div class="p-8 space-y-1 hover:bg-surface-container-lowest/50 transition-colors">
        <p class="text-sm font-bold text-slate-500 mb-2">Engagement Rate</p>
        <p class="text-3xl font-black ${engagementRate > 0 ? 'text-green-600' : 'text-on-surface'}">${engagementRate}%</p>
      </div>
      <div class="p-8 space-y-1 hover:bg-surface-container-lowest/50 transition-colors">
        <p class="text-sm font-bold text-slate-500 mb-2">New Users (30d)</p>
        <p class="text-3xl font-black text-on-surface flex items-center gap-2">
            ${formatNumber(data.newUsersMonth)}
            <span class="text-[10px] font-bold px-2 py-1 rounded-full ${data.userGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}">
                ${data.userGrowth >= 0 ? '+' : ''}${data.userGrowth}%
            </span>
        </p>
      </div>
      <div class="p-8 space-y-1 hover:bg-surface-container-lowest/50 transition-colors">
        <p class="text-sm font-bold text-slate-500 mb-2">New Posts (30d)</p>
        <p class="text-3xl font-black text-on-surface flex items-center gap-2">
            ${formatNumber(data.newBlogsMonth)}
            <span class="text-[10px] font-bold px-2 py-1 rounded-full ${data.blogGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}">
                ${data.blogGrowth >= 0 ? '+' : ''}${data.blogGrowth}%
            </span>
        </p>
      </div>
    `;
  }
}

// ── Views Chart ──────────────────────────────────────────────────────────────
async function loadViewsChart(days) {
  const data = await fetchAdmin(`/analytics/views-over-time?days=${days}`);
  const card = document.getElementById('views-chart-card');
  const header = document.getElementById('views-chart-header');
  const container = document.getElementById('analytics-chart');
  const labels = document.getElementById('analytics-chart-labels');
  if (!container) return;

  // Remove skeleton pulse from parent card
  if (card) card.classList.remove('animate-pulse');

  // Replace header with real content
  if (header) {
    const totalViews = data.data.reduce((s, d) => s + d.views, 0);
    header.innerHTML = `
      <div>
        <h3 class="text-lg font-extrabold text-on-surface">Views Over Time</h3>
        <p class="text-sm text-slate-500 font-medium">${formatNumber(totalViews)} total views in last ${days} days</p>
      </div>
      <div class="flex gap-2 items-center">
        <span class="flex h-2 w-2 rounded-full bg-primary"></span>
        <span class="text-xs font-bold text-slate-500">Views</span>
      </div>
    `;
  }

  const views = data.data.map(d => d.views);
  const maxViews = Math.max(...views, 1);

  container.innerHTML = views.map((v, i) => {
    const height = Math.max(5, (v / maxViews) * 100);
    const isMax = v === maxViews && v > 0;

    return `
      <div class="flex-1 group relative">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[9px] py-1 px-2 rounded whitespace-nowrap font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">${formatNumber(v)}</div>
        <div class="${isMax ? 'bg-primary' : 'bg-primary/30'} rounded-t-lg hover:bg-primary/60 transition-colors" style="height:${height}%"></div>
      </div>
    `;
  }).join('');

  if (labels && data.data.length) {
    const step = Math.max(1, Math.floor(data.data.length / 5));
    labels.innerHTML = data.data
      .filter((_, i) => i % step === 0 || i === data.data.length - 1)
      .map(d => `<span class="text-[10px] text-slate-400 font-bold">${d.label}</span>`)
      .join('');
  }
}

// ── Top Tags Distribution ────────────────────────────────────────────────────
async function loadTopTags() {
  const data = await fetchAdmin('/analytics/top-tags');
  const card = document.getElementById('top-tags-card');
  const content = document.getElementById('top-tags-content');
  if (!card || !content) return;

  card.classList.remove('animate-pulse');
  const tags = data.tags || [];

  if (!tags.length) {
    card.innerHTML = `
      <h3 class="text-lg font-extrabold text-on-surface mb-2">Tag Distribution</h3>
      <p class="text-sm text-slate-400">No tags found</p>
    `;
    return;
  }

  const totalBlogs = tags.reduce((s, t) => s + t.blogCount, 0);
  const colors = ['#702ae1', '#7742a6', '#9e3657', '#f77c9e', '#e6c5ff', '#b28cff'];

  // Build SVG donut chart
  let cumulativePercent = 0;
  const segments = tags.slice(0, 6).map((tag, i) => {
    const pct = totalBlogs > 0 ? (tag.blogCount / totalBlogs) * 100 : 0;
    const dashArray = `${pct} ${100 - pct}`;
    const dashOffset = -(cumulativePercent);
    cumulativePercent += pct;
    return `<circle cx="50" cy="50" r="40" fill="transparent" stroke="${colors[i % colors.length]}" stroke-width="18" stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" style="transform-origin:center;transform:rotate(-90deg)"/>`;
  }).join('');

  card.innerHTML = `
    <h3 class="text-lg font-extrabold text-on-surface mb-1">Tag Distribution</h3>
    <p class="text-sm text-slate-500 font-medium mb-6">Content categorization across ${totalBlogs} posts</p>
    <div class="flex items-center gap-8">
      <div class="w-32 h-32 flex-shrink-0 relative">
        <svg viewBox="0 0 100 100" class="w-full h-full">
          ${segments}
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <p class="text-xl font-black text-on-surface leading-none">${tags.length}</p>
            <p class="text-[9px] text-slate-400 font-bold">TAGS</p>
          </div>
        </div>
      </div>
      <div class="flex-1 space-y-3">
        ${tags.slice(0, 5).map((tag, i) => {
          const pct = totalBlogs > 0 ? ((tag.blogCount / totalBlogs) * 100).toFixed(0) : 0;
          return `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full" style="background:${colors[i % colors.length]}"></div>
                <span class="text-xs font-bold text-on-surface">#${tag.name}</span>
              </div>
              <span class="text-xs font-bold text-slate-500">${pct}% (${tag.blogCount})</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ── Top Authors Leaderboard ──────────────────────────────────────────────────
async function loadTopAuthors() {
  const data = await fetchAdmin('/analytics/top-authors');
  const card = document.getElementById('top-authors-card');
  const content = document.getElementById('top-authors-content');
  if (!card || !content) return;

  card.classList.remove('animate-pulse');
  const authors = data.authors || [];

  if (!authors.length) {
    card.innerHTML = `
      <h3 class="text-lg font-extrabold text-on-surface mb-2">Top Authors</h3>
      <p class="text-sm text-slate-400">No authors found</p>
    `;
    return;
  }

  const maxViews = Math.max(...authors.map(a => a.totalViews), 1);

  card.innerHTML = `
    <h3 class="text-lg font-extrabold text-on-surface mb-6">Top Authors</h3>
    <div class="space-y-5">
      ${authors.map((author, i) => {
        const name = author.name || author.email;
        const pct = Math.max(5, (author.totalViews / maxViews) * 100);
        const img = author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7742a6&color=fff&size=32`;
        const medals = ['🥇', '🥈', '🥉'];
        const barColors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary/40', 'bg-secondary/40'];

        return `
          <div class="group">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                ${i < 3 ? `<span class="text-sm">${medals[i]}</span>` : `<span class="text-[10px] font-black text-slate-400 w-5 text-center">${i + 1}</span>`}
                <img class="w-7 h-7 rounded-full object-cover" src="${img}" alt="${name}"/>
                <span class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">${name}</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-black text-on-surface">${formatNumber(author.totalViews)}</span>
                <span class="text-[10px] text-slate-400 ml-1">views</span>
                <span class="text-[10px] text-slate-400 mx-1">·</span>
                <span class="text-[10px] text-slate-500 font-bold">${author._count?.blogs || 0} posts</span>
              </div>
            </div>
            <div class="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
              <div class="${barColors[i % barColors.length]} h-full rounded-full transition-all duration-500" style="width:${pct}%"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Performance Trend Chart ──────────────────────────────────────────────────
async function loadPerformanceTrend() {
  const data = await fetchAdmin('/analytics/views-over-time?days=30');
  const wrapper = document.getElementById('performance-trend');
  const container = document.getElementById('trend-chart');
  const labels = document.getElementById('trend-chart-labels');
  if (!container) return;

  if (wrapper) wrapper.classList.remove('animate-pulse');

  const views = data.data.map(d => d.views);
  const maxViews = Math.max(...views, 1);

  container.innerHTML = views.map((v, i) => {
    const height = Math.max(3, (v / maxViews) * 100);
    const isMax = v === maxViews && v > 0;
    const bgClass = isMax ? 'bg-primary' : (height > 70 ? 'bg-primary-fixed' : (height > 50 ? 'bg-primary/20' : 'bg-surface-container-high'));

    return `
      <div class="flex-1 ${bgClass} rounded-t-lg hover:bg-primary-container/30 transition-colors relative group" style="height:${height}%">
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[8px] py-0.5 px-1.5 rounded whitespace-nowrap font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">${formatNumber(v)}</div>
      </div>
    `;
  }).join('');

  if (labels && data.data.length) {
    labels.innerHTML = `
      <span>${data.data[0].label}</span>
      <span>${data.data[Math.floor(data.data.length / 4)].label}</span>
      <span>${data.data[Math.floor(data.data.length / 2)].label}</span>
      <span>${data.data[Math.floor(data.data.length * 3 / 4)].label}</span>
      <span>${data.data[data.data.length - 1].label}</span>
    `;
  }
}

// ── Time Range ───────────────────────────────────────────────────────────────
function wireTimeRangeButtons() {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-range]').forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary', 'rounded-lg', 'shadow-sm');
        b.classList.add('text-on-surface-variant');
      });
      btn.classList.add('bg-primary', 'text-on-primary', 'rounded-lg', 'shadow-sm');
      btn.classList.remove('text-on-surface-variant');
      currentDays = parseInt(btn.dataset.range);
      await loadViewsChart(currentDays);
    });
  });
}
