// ================================================
//   ADMIN DASHBOARD — admin-dashboard.js
//   REWRITTEN to use real backend data throughout.
//   Previously almost every section here read/wrote
//   localStorage mock data instead of calling the API,
//   the sidebar navigation didn't match the HTML at all
//   (JS expected .sidebar-link[data-tab], HTML actually
//   has .nav-item[data-section]), and a ReferenceError
//   on every page load silently broke everything after it.
//   All three are fixed here.
// ================================================

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function makeEmptyState(icon, text) {
  return '<tr><td colspan="10" class="empty">' + icon + ' ' + esc(text) + '</td></tr>';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadgeHtml(status) {
  return '<span class="status-badge ' + esc(status) + '">' + esc(status) + '</span>';
}

document.addEventListener('DOMContentLoaded', function () {

  // ---- REAL admin auth check ----
  // (previously checked a fake `imc_admin` localStorage flag that
  // admin-login.html never even sets — a real admin logging in
  // correctly would still hit the fake lock screen)
  var currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null'); } catch (e) {}
  var token = localStorage.getItem('imc_token');

  if (!token || !currentUser || currentUser.role !== 'admin') {
    window.location.href = 'admin-login.html';
    return;
  }

  // ---- Sidebar navigation (the ONLY working nav system —
  //      matches the real HTML's .nav-item[data-section]) ----
  var navItems = document.querySelectorAll('.nav-item[data-section]');
  var sections = document.querySelectorAll('.section');

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var target = item.getAttribute('data-section');

      navItems.forEach(function (n) { n.classList.remove('active'); });
      sections.forEach(function (s) { s.classList.remove('active'); });

      item.classList.add('active');
      var sectionEl = document.getElementById('section-' + target);
      if (sectionEl) sectionEl.classList.add('active');

      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('sidebar-open');

      // Reload fresh data every time a section is opened
      reloadSection(target);
    });
  });

  function reloadSection(name) {
    if (name === 'overview')          loadOverview();
    else if (name === 'users')        loadUsersTab('');
    else if (name === 'vendors')      loadVendorsTab('');
    else if (name === 'ambassadors')  {
      loadAmbassadorsTab();
      if (typeof loadAmbassadorTasksTab === 'function') loadAmbassadorTasksTab();
      if (typeof loadTaskSubmissionsTab === 'function') loadTaskSubmissionsTab('pending');
    }
    else if (name === 'ads')          loadAdsTab('');
    else if (name === 'news')         { if (typeof loadNews === 'function') loadNews(); }
    else if (name === 'courses')      loadCoursesTab();
    else if (name === 'learning')     { if (typeof loadLearningAdminTab === 'function') loadLearningAdminTab(''); }
    else if (name === 'connect')      { if (typeof loadConnectAdminTab === 'function') loadConnectAdminTab(''); }
    else if (name === 'events')       loadEventsTab();
    else if (name === 'notifications')loadNotificationsTab();
    else if (name === 'payments')     loadPaymentsTab();
    else if (name === 'withdrawals')  loadWithdrawalsTab();
    else if (name === 'event-withdrawals') loadEventWithdrawalsTab();
    else if (name === 'logs')         loadLogsTab();
  }

  // ---- Mobile sidebar ----
  var sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('sidebar-open');
    });
  }

  // ---- Filter-tab pills (Vendors / Ads / News) ----
  document.querySelectorAll('.filter-tabs').forEach(function (group) {
    var section = group.closest('.section');
    if (!section) return;
    var sectionName = section.id.replace('section-', '');

    group.querySelectorAll('.filter-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        group.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var status = tab.getAttribute('data-filter');
        var f = status === 'all' ? '' : status;

        if (sectionName === 'vendors') loadVendorsTab(f);
        if (sectionName === 'ads')     loadAdsTab(f);
        if (sectionName === 'news')    { if (typeof loadNews === 'function') { loadNews().then(function () { renderNews(f || 'all'); }); } }
      });
    });
  });

  // ---- User search ----
  var userSearch = document.getElementById('userSearch');
  if (userSearch) {
    var searchTimer = null;
    userSearch.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { loadUsersTab(userSearch.value.trim()); }, 400);
    });
  }

  // ---- Initial load (Overview is the default active section) ----
  loadOverview();
  initNewsAdminCreate();
  initCourseModal();

  // ---- Logout ----
  var logoutBtn = document.getElementById('adminLogoutBtn') || document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('imc_token');
      localStorage.removeItem('imc_user');
      window.location.href = 'admin-login.html';
    });
  }
});

// ================================================
//   OVERVIEW
// ================================================
async function loadOverview() {
  var result = await IMC_API.getAdminStats();
  if (!result.success) return;
  var s = result.stats;

  var setText = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('totalRevenue', '₦' + (s.revenue.total || 0).toLocaleString());
  setText('revVendors',   '₦' + (s.revenue.vendors || 0).toLocaleString());
  setText('revAds',       '₦' + (s.revenue.ads || 0).toLocaleString());
  setText('revTickets',   '₦' + (s.revenue.eventTickets || 0).toLocaleString());
  setText('revCourses',   '₦' + (s.revenue.courses || 0).toLocaleString());

  setText('stat-users',            s.totalUsers);
  setText('stat-vendors',          s.totalVendors);
  setText('stat-pending-vendors',  s.pendingVendors);
  setText('stat-ambassadors',      s.totalAmbassadors);
  setText('stat-ads',              s.totalAds);
  setText('stat-news',             s.totalNews);
  setText('stat-courses',          s.totalCourses);
  setText('stat-withdrawals',      s.pendingWithdrawals);

  var badgeNews = document.getElementById('badgeNews');
  if (badgeNews) {
    if (s.pendingNews > 0) { badgeNews.textContent = s.pendingNews; badgeNews.style.display = 'inline-block'; }
    else badgeNews.style.display = 'none';
  }
  var badgeAds = document.getElementById('badgeAds');
  if (badgeAds) {
    if (s.pendingAds > 0) { badgeAds.textContent = s.pendingAds; badgeAds.style.display = 'inline-block'; }
    else badgeAds.style.display = 'none';
  }
}

// ================================================
//   USERS
// ================================================
async function loadUsersTab(search) {
  var tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetUsers({ limit: 200 });
  var users = (result.success && result.users) ? result.users : [];

  if (search) {
    var q = search.toLowerCase();
    users = users.filter(function (u) {
      return (u.firstName + ' ' + u.lastName + ' ' + u.email).toLowerCase().indexOf(q) !== -1;
    });
  }

  if (users.length === 0) { tbody.innerHTML = makeEmptyState('👥', 'No users found.'); return; }

  tbody.innerHTML = users.map(function (u) {
    return '<tr>' +
      '<td>' + esc((u.firstName || '') + ' ' + (u.lastName || '')) + '</td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td>' + esc(u.role) + '</td>' +
      '<td>' + esc(u.university || '—') + '</td>' +
      '<td>' + (u.isBlocked
        ? '<span class="status-badge rejected">Blocked</span>'
        : '<span class="status-badge approved">Active</span>') + '</td>' +
      '<td>' + fmtDate(u.createdAt) + '</td>' +
      '<td><div class="btn-group">' +
      '<button class="btn btn-sm ' + (u.isBlocked ? 'btn-success' : 'btn-danger') + '" ' +
      'onclick="toggleUserBlock(\'' + u._id + '\',' + (!u.isBlocked) + ')">' +
      (u.isBlocked ? 'Unblock' : 'Block') + '</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="deleteUserAdmin(\'' + u._id + '\')">Delete</button>' +
      '</div></td>' +
      '</tr>';
  }).join('');
}

async function toggleUserBlock(id, shouldBlock) {
  var result = await IMC_API.adminBlockUser(id, shouldBlock);
  if (result.success) loadUsersTab('');
  else alert(result.message || 'Could not update user.');
}

async function deleteUserAdmin(id) {
  if (!confirm('Delete this user permanently? This cannot be undone.')) return;
  var result = await IMC_API.adminDeleteUser(id);
  if (result.success) { loadUsersTab(''); loadOverview(); }
  else alert(result.message || 'Could not delete user.');
}

// ================================================
//   VENDORS
// ================================================
async function loadVendorsTab(filter) {
  var tbody = document.getElementById('vendorsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetVendors(filter);
  var vendors = (result.success && result.vendors) ? result.vendors : [];

  if (vendors.length === 0) { tbody.innerHTML = makeEmptyState('🏪', 'No vendors found.'); return; }

  tbody.innerHTML = vendors.map(function (v) {
    var actions = '<div class="btn-group">';
    if (v.status !== 'approved') actions += '<button class="btn btn-success btn-sm" onclick="setVendorStatus(\'' + v._id + '\',\'approved\')">Approve</button>';
    if (v.status !== 'rejected') actions += '<button class="btn btn-danger btn-sm" onclick="setVendorStatus(\'' + v._id + '\',\'rejected\')">Reject</button>';
    if (v.status !== 'suspended') actions += '<button class="btn btn-ghost btn-sm" onclick="setVendorStatus(\'' + v._id + '\',\'suspended\')">Suspend</button>';
    actions += '</div>';

    return '<tr>' +
      '<td>' + esc(v.bizName) + '</td>' +
      '<td>' + esc(v.fullName || '—') + '</td>' +
      '<td>' + esc(v.university || '—') + '</td>' +
      '<td>' + esc(v.category || '—') + '</td>' +
      '<td>' + esc(v.paymentStatus || '—') + '</td>' +
      '<td>' + statusBadgeHtml(v.status) + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function setVendorStatus(id, status) {
  var result = await IMC_API.updateVendorStatus(id, status);
  if (result.success) { loadVendorsTab(''); loadOverview(); }
  else alert(result.message || 'Could not update vendor.');
}

// ================================================
//   AMBASSADORS
// ================================================
async function loadAmbassadorsTab() {
  var tbody = document.getElementById('ambassadorsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetAmbassadors();
  var ambassadors = (result.success && result.ambassadors) ? result.ambassadors : [];

  if (ambassadors.length === 0) { tbody.innerHTML = makeEmptyState('⭐', 'No ambassadors found.'); return; }

  tbody.innerHTML = ambassadors.map(function (a) {
    var actions = '<div class="btn-group">';
    if (a.status !== 'active') actions += '<button class="btn btn-success btn-sm" onclick="setAmbassadorStatus(\'' + a._id + '\',\'active\')">Activate</button>';
    if (a.status !== 'suspended') actions += '<button class="btn btn-danger btn-sm" onclick="setAmbassadorStatus(\'' + a._id + '\',\'suspended\')">Suspend</button>';
    actions += '</div>';

    return '<tr>' +
      '<td>' + esc(a.fullName) + '</td>' +
      '<td>' + esc(a.email || '—') + '</td>' +
      '<td>' + esc(a.university || '—') + '</td>' +
      '<td>' + esc(a.refCode) + '</td>' +
      '<td>₦' + (a.earnings || 0).toLocaleString() + '</td>' +
      '<td>' + ((a.referrals || []).length) + '</td>' +
      '<td>' + statusBadgeHtml(a.status || 'active') + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function setAmbassadorStatus(id, status) {
  var result = await IMC_API.adminUpdateAmbassadorStatus(id, status);
  if (result.success) { loadAmbassadorsTab(); loadOverview(); }
  else alert(result.message || 'Could not update ambassador.');
}

// ================================================
//   AMBASSADOR TASKS — admin create/edit/delete/pause/activate
// ================================================
async function loadAmbassadorTasksTab() {
  var tbody = document.getElementById('ambassadorTasksTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetAmbassadorTasks();
  var tasks = (result.success && result.tasks) ? result.tasks : [];

  if (tasks.length === 0) { tbody.innerHTML = makeEmptyState('🎯', 'No tasks yet. Create one above.'); return; }

  tbody.innerHTML = tasks.map(function (t) {
    var actions = '<div class="btn-group">';
    actions += '<button class="btn btn-ghost btn-sm" onclick="openEditTaskForm(\'' + t._id + '\')">Edit</button>';
    if (t.status === 'active') {
      actions += '<button class="btn btn-warning btn-sm" onclick="setTaskStatus(\'' + t._id + '\',\'paused\')">Pause</button>';
    } else {
      actions += '<button class="btn btn-success btn-sm" onclick="setTaskStatus(\'' + t._id + '\',\'active\')">Activate</button>';
    }
    actions += '<button class="btn btn-danger btn-sm" onclick="deleteAmbassadorTask(\'' + t._id + '\')">Delete</button>';
    actions += '</div>';

    return '<tr>' +
      '<td>' + esc(t.title) + '</td>' +
      '<td>₦' + (t.rewardAmount || 0).toLocaleString() + '</td>' +
      '<td>' + esc(t.verificationMethod) + '</td>' +
      '<td><span class="status-badge ' + (t.status === 'active' ? 'approved' : 'pending') + '">' + esc(t.status) + '</span></td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

var EDITING_TASK_ID = null;

function openCreateTaskForm() {
  EDITING_TASK_ID = null;
  showTaskForm({ title: '', description: '', rewardAmount: '', rules: '', verificationMethod: 'manual', taskUrl: '' });
}

function openEditTaskForm(id) {
  IMC_API.adminGetAmbassadorTasks().then(function (result) {
    var task = (result.tasks || []).find(function (t) { return t._id === id; });
    if (!task) { alert('Task not found.'); return; }
    EDITING_TASK_ID = id;
    showTaskForm(task);
  });
}

function showTaskForm(task) {
  var title = prompt('Task title:', task.title || '');
  if (title === null) return;
  var description = prompt('Description:', task.description || '');
  if (description === null) return;
  var rewardAmount = prompt('Reward amount (₦):', task.rewardAmount || '');
  if (rewardAmount === null) return;
  var verificationMethod = prompt(
    'Verification method — one of: manual, link_proof, auto_referral\n' +
    '(for auto_referral, put the required referral count in Rules)',
    task.verificationMethod || 'manual'
  );
  if (verificationMethod === null) return;
  var rules = prompt('Rules (e.g. required referral count for auto_referral tasks):', task.rules || '');
  if (rules === null) return;
  var taskUrl = prompt('Task URL (optional, e.g. Telegram invite link):', task.taskUrl || '');
  if (taskUrl === null) return;

  var payload = {
    title: title.trim(),
    description: (description || '').trim(),
    rewardAmount: parseFloat(rewardAmount) || 0,
    verificationMethod: ['manual', 'link_proof', 'auto_referral'].indexOf(verificationMethod) !== -1 ? verificationMethod : 'manual',
    rules: (rules || '').trim(),
    taskUrl: (taskUrl || '').trim()
  };

  var apiCall = EDITING_TASK_ID
    ? IMC_API.adminUpdateAmbassadorTask(EDITING_TASK_ID, payload)
    : IMC_API.adminCreateAmbassadorTask(payload);

  apiCall.then(function (result) {
    if (result.success) loadAmbassadorTasksTab();
    else alert(result.message || 'Could not save task.');
  });
}

async function setTaskStatus(id, status) {
  var result = await IMC_API.adminSetAmbassadorTaskStatus(id, status);
  if (result.success) loadAmbassadorTasksTab();
  else alert(result.message || 'Could not update task.');
}

async function deleteAmbassadorTask(id) {
  if (!confirm('Delete this task permanently?')) return;
  var result = await IMC_API.adminDeleteAmbassadorTask(id);
  if (result.success) loadAmbassadorTasksTab();
  else alert(result.message || 'Could not delete task.');
}

// ================================================
//   TASK SUBMISSIONS — admin review (approve/reject)
// ================================================
async function loadTaskSubmissionsTab(filter) {
  var tbody = document.getElementById('taskSubmissionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetTaskSubmissions(filter || '');
  var submissions = (result.success && result.submissions) ? result.submissions : [];

  if (submissions.length === 0) { tbody.innerHTML = makeEmptyState('📋', 'No submissions found.'); return; }

  tbody.innerHTML = submissions.map(function (s) {
    var statusBadge = '<span class="status-badge ' + (s.status === 'approved' ? 'approved' : (s.status === 'rejected' ? 'rejected' : 'pending')) + '">' + esc(s.status) + '</span>';
    var actions = '';
    if (s.status === 'pending') {
      actions = '<div class="btn-group">' +
        '<button class="btn btn-success btn-sm" onclick="reviewTaskSubmission(\'' + s._id + '\',\'approved\')">Approve</button>' +
        '<button class="btn btn-danger btn-sm" onclick="reviewTaskSubmission(\'' + s._id + '\',\'rejected\')">Reject</button>' +
        '</div>';
    } else {
      actions = '—';
    }

    var userLabel = s.user ? ((s.user.firstName || '') + ' ' + (s.user.lastName || '') + ' (' + (s.user.email || '') + ')') : '—';

    return '<tr>' +
      '<td>' + esc(userLabel) + '</td>' +
      '<td>' + esc(s.task ? s.task.title : '—') + '</td>' +
      '<td>₦' + (s.rewardAmount || 0).toLocaleString() + '</td>' +
      '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(s.proof) + '">' + esc(s.proof || '—') + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function reviewTaskSubmission(id, status) {
  var reason = '';
  if (status === 'rejected') {
    reason = prompt('Reason for rejection (optional):', '') || '';
  }
  var result = await IMC_API.adminReviewTaskSubmission(id, status, reason);
  if (result.success) {
    loadTaskSubmissionsTab(document.getElementById('taskSubmissionFilter').value);
    loadAmbassadorsTab();
  } else {
    alert(result.message || 'Could not review submission.');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var subFilterEl = document.getElementById('taskSubmissionFilter');
  if (subFilterEl) {
    subFilterEl.addEventListener('change', function () { loadTaskSubmissionsTab(this.value); });
  }
});

// ================================================
//   ADS
// ================================================
async function loadAdsTab(filter) {
  var tbody = document.getElementById('adsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetAds(filter);
  var ads = (result.success && result.ads) ? result.ads : [];

  if (ads.length === 0) { tbody.innerHTML = makeEmptyState('📢', 'No ads found.'); return; }

  tbody.innerHTML = ads.map(function (a) {
    var actions = '<div class="btn-group">';
    if (a.status !== 'approved') actions += '<button class="btn btn-success btn-sm" onclick="setAdStatus(\'' + a._id + '\',\'approved\')">Approve</button>';
    if (a.status !== 'rejected') actions += '<button class="btn btn-danger btn-sm" onclick="setAdStatus(\'' + a._id + '\',\'rejected\')">Reject</button>';
    actions += '<button class="btn btn-ghost btn-sm" onclick="deleteAdAdmin(\'' + a._id + '\')">Delete</button>';
    actions += '</div>';

    return '<tr>' +
      '<td>' + esc(a.title) + '</td>' +
      '<td>' + esc(a.category || '—') + '</td>' +
      '<td>' + esc(a.ownerName || a.ownerEmail || '—') + '</td>' +
      '<td>' + esc(a.duration || '—') + '</td>' +
      '<td>' + esc(a.paymentStatus || '—') + '</td>' +
      '<td>' + statusBadgeHtml(a.status) + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function setAdStatus(id, status) {
  var result = await IMC_API.adminUpdateAdStatus(id, status);
  if (result.success) { loadAdsTab(''); loadOverview(); }
  else alert(result.message || 'Could not update ad.');
}

async function deleteAdAdmin(id) {
  if (!confirm('Delete this ad permanently?')) return;
  var result = await IMC_API.adminDeleteAd(id);
  if (result.success) { loadAdsTab(''); loadOverview(); }
  else alert(result.message || 'Could not delete ad.');
}

// ================================================
//   COURSES
// ================================================
async function loadCoursesTab() {
  var tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetCourses();
  var courses = (result.success && result.courses) ? result.courses : [];

  if (courses.length === 0) { tbody.innerHTML = makeEmptyState('🎓', 'No courses yet.'); return; }

  tbody.innerHTML = courses.map(function (c) {
    var priceText = c.isFree ? '<span class="status-badge approved">FREE</span>' : '₦' + (c.price || 0).toLocaleString();
    return '<tr>' +
      '<td>' + esc(c.title) + '<br><small style="color:#aaa;">' + esc(c.duration || '') + (c.lessons ? ' · ' + c.lessons + ' lessons' : '') + '</small></td>' +
      '<td>' + esc(c.category || '—') + '</td>' +
      '<td>' + priceText + '</td>' +
      '<td>' + esc(c.level || '—') + '</td>' +
      '<td>' + ((c.purchases || []).length) + '</td>' +
      '<td><div class="btn-group">' +
      '<button class="btn btn-ghost btn-sm" onclick="openCourseModal(\'' + c._id + '\')">Edit</button>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteCourseAdmin(\'' + c._id + '\')">Delete</button>' +
      '</div></td>' +
      '</tr>';
  }).join('');

  window.coursesCache = courses;
}

async function deleteCourseAdmin(id) {
  if (!confirm('Delete this course permanently?')) return;
  var result = await IMC_API.adminDeleteCourse(id);
  if (result.success) { loadCoursesTab(); loadOverview(); }
  else alert(result.message || 'Could not delete course.');
}

function initCourseModal() {
  var createBtn  = document.getElementById('createCourseBtn');
  var cancelBtn  = document.getElementById('courseModalCancel');
  var saveBtn    = document.getElementById('courseModalSave');
  var modal      = document.getElementById('courseModal');

  if (createBtn) createBtn.addEventListener('click', function () { openCourseModal(null); });
  if (cancelBtn) cancelBtn.addEventListener('click', function () { if (modal) modal.style.display = 'none'; });
  if (saveBtn)   saveBtn.addEventListener('click', saveCourseAdmin);
}

window.openCourseModal = function (courseId) {
  var modal = document.getElementById('courseModal');
  var errEl = document.getElementById('courseModalError');
  if (errEl) errEl.style.display = 'none';

  var course = null;
  if (courseId && window.coursesCache) {
    course = window.coursesCache.find(function (c) { return c._id === courseId; });
  }

  document.getElementById('courseModalTitle').textContent = course ? 'Edit Course' : 'Add New Course';
  document.getElementById('courseModal').setAttribute('data-editing-id', course ? course._id : '');

  document.getElementById('courseTitle').value       = course ? course.title       : '';
  document.getElementById('courseCategory').value    = course ? course.category    : '';
  document.getElementById('courseDescription').value = course ? course.description : '';
  document.getElementById('coursePrice').value        = course ? course.price       : '';
  document.getElementById('courseFileUrl').value      = course ? course.fileUrl     : '';
  document.getElementById('courseDuration').value     = course ? course.duration    : '';
  document.getElementById('courseLessons').value      = course ? course.lessons     : '';
  if (document.getElementById('courseLevel')) {
    document.getElementById('courseLevel').value = course ? (course.level || '') : '';
  }

  if (modal) modal.style.display = 'flex';
};

async function saveCourseAdmin() {
  var errEl = document.getElementById('courseModalError');
  if (errEl) errEl.style.display = 'none';

  var title = document.getElementById('courseTitle').value.trim();
  var category = document.getElementById('courseCategory').value.trim();
  var description = document.getElementById('courseDescription').value.trim();
  var price = document.getElementById('coursePrice').value;
  var fileUrl = document.getElementById('courseFileUrl').value.trim();

  if (!title || !category || !description || !fileUrl) {
    if (errEl) { errEl.textContent = 'Title, category, description, and file URL are required.'; errEl.style.display = 'block'; }
    return;
  }

  var formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('price', price || '0');
  formData.append('isFree', (!price || parseFloat(price) === 0) ? 'true' : 'false');
  formData.append('fileUrl', fileUrl);
  formData.append('duration', document.getElementById('courseDuration').value.trim());
  formData.append('lessons', document.getElementById('courseLessons').value || '0');
  var levelEl = document.getElementById('courseLevel');
  if (levelEl) formData.append('level', levelEl.value);

  var imageInput = document.getElementById('courseImageFile');
  if (imageInput && imageInput.files && imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  var editingId = document.getElementById('courseModal').getAttribute('data-editing-id');
  var result = editingId
    ? await IMC_API.adminUpdateCourse(editingId, formData)
    : await IMC_API.adminCreateCourse(formData);

  if (result.success) {
    document.getElementById('courseModal').style.display = 'none';
    loadCoursesTab();
    loadOverview();
  } else if (errEl) {
    errEl.textContent = result.message || 'Could not save course.';
    errEl.style.display = 'block';
  }
}

// ================================================
//   EVENTS (read-only)
// ================================================
async function loadEventsTab() {
  var tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.getAdminEvents();
  var events = (result.success && result.events) ? result.events : [];

  if (events.length === 0) { tbody.innerHTML = makeEmptyState('📅', 'No events found.'); return; }

  tbody.innerHTML = events.map(function (e) {
    return '<tr>' +
      '<td>' + esc(e.title) + '</td>' +
      '<td>' + esc(e.university || '—') + '</td>' +
      '<td>' + fmtDate(e.eventDate) + '</td>' +
      '<td>' + esc(e.eventType || '—') + '</td>' +
      '<td>' + (e.ticketsSold || 0) + '</td>' +
      '<td>' + statusBadgeHtml(e.status || 'active') + '</td>' +
      '</tr>';
  }).join('');
}

// ================================================
//   NOTIFICATIONS
// ================================================
async function loadNotificationsTab() {
  var tbody = document.getElementById('notificationsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.getAdminNotifications();
  var notifs = (result.success && result.notifications) ? result.notifications : [];

  var totalEl  = document.getElementById('notif-total');
  var unreadEl = document.getElementById('notif-unread');
  if (totalEl)  totalEl.textContent  = result.totalCount  != null ? result.totalCount  : notifs.length;
  if (unreadEl) unreadEl.textContent = result.unreadCount != null ? result.unreadCount : notifs.filter(function (n) { return !n.isRead; }).length;

  if (notifs.length === 0) { tbody.innerHTML = makeEmptyState('🔔', 'No notifications yet.'); return; }

  tbody.innerHTML = notifs.slice(0, 100).map(function (n) {
    return '<tr>' +
      '<td>' + esc(n.type || 'general') + '</td>' +
      '<td>' + esc(n.title || '') + (n.message ? ' — ' + esc(n.message) : '') + '</td>' +
      '<td>' + (n.isRead
        ? '<span class="status-badge approved">Read</span>'
        : '<span class="status-badge pending">Unread</span>') + '</td>' +
      '<td>' + fmtDate(n.createdAt) + '</td>' +
      '</tr>';
  }).join('');
}

// ================================================
//   PAYMENTS (read-only)
// ================================================
async function loadPaymentsTab() {
  var tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetPayments();
  var payments = (result.success && result.payments) ? result.payments : [];

  if (payments.length === 0) { tbody.innerHTML = makeEmptyState('💳', 'No payments found.'); return; }

  tbody.innerHTML = payments.slice(0, 200).map(function (p) {
    return '<tr>' +
      '<td>' + esc(p.type || '—') + '</td>' +
      '<td>' + esc(p.name || '—') + '</td>' +
      '<td>' + esc(p.email || '—') + '</td>' +
      '<td>₦' + (p.amount || 0).toLocaleString() + '</td>' +
      '<td>' + esc(p.reference || '—') + '</td>' +
      '<td>' + fmtDate(p.date || p.createdAt) + '</td>' +
      '</tr>';
  }).join('');
}

// ================================================
//   AMBASSADOR WITHDRAWALS
// ================================================
async function loadWithdrawalsTab() {
  var tbody = document.getElementById('withdrawalsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetWithdrawals();
  var requests = (result.success && result.withdrawals) ? result.withdrawals : [];

  if (requests.length === 0) { tbody.innerHTML = makeEmptyState('💸', 'No withdrawal requests.'); return; }

  tbody.innerHTML = requests.map(function (w) {
    var actions = w.status === 'pending'
      ? '<div class="btn-group">' +
        '<button class="btn btn-success btn-sm" onclick="setAmbassadorWithdrawal(\'' + w.ambassadorId + '\',\'' + w._id + '\',\'paid\')">Mark Paid</button>' +
        '<button class="btn btn-danger btn-sm" onclick="setAmbassadorWithdrawal(\'' + w.ambassadorId + '\',\'' + w._id + '\',\'rejected\')">Reject</button>' +
        '</div>'
      : '—';

    return '<tr>' +
      '<td>' + esc(w.ambassadorName || '—') + '</td>' +
      '<td>' + esc(w.bankName || '—') + '</td>' +
      '<td>' + esc(w.accountNum || '—') + '</td>' +
      '<td>₦' + (w.amount || 0).toLocaleString() + '</td>' +
      '<td>' + statusBadgeHtml(w.status) + '</td>' +
      '<td>' + fmtDate(w.requestedAt) + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function setAmbassadorWithdrawal(ambId, withdrawalId, status) {
  var result = await IMC_API.adminUpdateWithdrawal(ambId, withdrawalId, status);
  if (result.success) { loadWithdrawalsTab(); loadOverview(); }
  else alert(result.message || 'Could not update withdrawal.');
}

// ================================================
//   EVENT CREATOR WITHDRAWALS (previously not
//   implemented at all — the section/table existed
//   in the HTML but no JS ever populated it)
// ================================================
async function loadEventWithdrawalsTab() {
  var tbody = document.getElementById('eventWithdrawalsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetEventWithdrawals();
  var requests = (result.success && result.withdrawals) ? result.withdrawals : [];

  if (requests.length === 0) { tbody.innerHTML = makeEmptyState('💸', 'No event withdrawal requests.'); return; }

  tbody.innerHTML = requests.map(function (w) {
    var actions = w.status === 'pending'
      ? '<div class="btn-group">' +
        '<button class="btn btn-success btn-sm" onclick="setEventWithdrawal(\'' + w.eventId + '\',\'' + w._id + '\',\'paid\')">Mark Paid</button>' +
        '<button class="btn btn-danger btn-sm" onclick="setEventWithdrawal(\'' + w.eventId + '\',\'' + w._id + '\',\'rejected\')">Reject</button>' +
        '</div>'
      : '—';

    return '<tr>' +
      '<td>' + esc(w.eventTitle || '—') + '</td>' +
      '<td>' + esc(w.organizerName || '—') + '</td>' +
      '<td>' + esc(w.bankName || '—') + '</td>' +
      '<td>' + esc(w.accountNum || '—') + '</td>' +
      '<td>₦' + (w.amount || 0).toLocaleString() + '</td>' +
      '<td>' + statusBadgeHtml(w.status) + '</td>' +
      '<td>' + fmtDate(w.requestedAt) + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

async function setEventWithdrawal(eventId, withdrawalId, status) {
  var result = await IMC_API.adminUpdateEventWithdrawal(eventId, withdrawalId, status);
  if (result.success) { loadEventWithdrawalsTab(); loadOverview(); }
  else alert(result.message || 'Could not update withdrawal.');
}

// ================================================
//   AUDIT LOGS (previously not implemented at all)
// ================================================
async function loadLogsTab() {
  var tbody = document.getElementById('logsTableBody');
  if (!tbody) return;
  tbody.innerHTML = makeEmptyState('⏳', 'Loading...');

  var result = await IMC_API.adminGetLogs();
  var logs = (result.success && result.logs) ? result.logs : [];

  if (logs.length === 0) { tbody.innerHTML = makeEmptyState('📋', 'No logs yet.'); return; }

  tbody.innerHTML = logs.slice(0, 200).map(function (l) {
    return '<tr>' +
      '<td>' + esc(l.adminEmail || '—') + '</td>' +
      '<td>' + esc(l.action || '—') + '</td>' +
      '<td>' + esc(l.targetType || '—') + '</td>' +
      '<td>' + esc(l.details || '—') + '</td>' +
      '<td>' + esc(l.ip || '—') + '</td>' +
      '<td>' + fmtDate(l.createdAt) + '</td>' +
      '<td>' + statusBadgeHtml(l.status || 'success') + '</td>' +
      '</tr>';
  }).join('');
}


// ================================================
//   CREATE NEWS FORM (already real - was just never called)
// ================================================
function initNewsAdminCreate() {
  var imgInput = document.getElementById('newsAdminImageFile');
  var vidInput = document.getElementById('newsAdminVideoFile');

  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); this.value=''; return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById('newsAdminImagePreview').src = e.target.result;
        document.getElementById('newsAdminImagePlaceholder').style.display = 'none';
        document.getElementById('newsAdminImagePreviewWrap').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (vidInput) {
    vidInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB.'); this.value=''; return; }
      var url = URL.createObjectURL(file);
      document.getElementById('newsAdminVideoPreview').src = url;
      document.getElementById('newsAdminVideoPlaceholder').style.display = 'none';
      document.getElementById('newsAdminVideoPreviewWrap').style.display = 'block';
    });
  }

  function doPublish(status) {
    var title    = document.getElementById('newsAdminTitle').value.trim();
    var category = document.getElementById('newsAdminCategory').value.trim();
    var content  = document.getElementById('newsAdminContent').value.trim();

    var errBox = document.getElementById('createNewsError');
    var errMsg = document.getElementById('createNewsErrorMsg');
    var okBox  = document.getElementById('createNewsSuccess');
    errBox.style.display = 'none';
    okBox.style.display  = 'none';

    if (!title)   { errMsg.textContent = 'Please enter a title.';   errBox.style.display='flex'; return; }
    if (!content) { errMsg.textContent = 'Please write the content.'; errBox.style.display='flex'; return; }

    var formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('content', content);
    formData.append('status', status);

    var imgFile = imgInput && imgInput.files[0];
    var vidFile = vidInput && vidInput.files[0];
    if (imgFile) formData.append('image', imgFile);
    if (vidFile) formData.append('video', vidFile);

    var btnText = document.getElementById('newsAdminPublishText');
    var spinner = document.getElementById('newsAdminPublishSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline';

    IMC_API.createNewsAdmin(formData).then(function (result) {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';

      if (result.success) {
        okBox.style.display = 'flex';
        document.getElementById('newsAdminTitle').value = '';
        document.getElementById('newsAdminCategory').value = '';
        document.getElementById('newsAdminContent').value = '';
        if (imgInput) imgInput.value = '';
        if (vidInput) vidInput.value = '';
        document.getElementById('newsAdminImagePlaceholder').style.display = 'flex';
        document.getElementById('newsAdminImagePreviewWrap').style.display = 'none';
        document.getElementById('newsAdminVideoPlaceholder').style.display = 'flex';
        document.getElementById('newsAdminVideoPreviewWrap').style.display = 'none';
        loadNewsAdminTab('');
        loadOverview();
      } else {
        errMsg.textContent = result.message || 'Could not publish news.';
        errBox.style.display = 'flex';
      }
    });
  }

  var pubBtn = document.getElementById('newsAdminPublishBtn');
  var draftBtn = document.getElementById('newsAdminDraftBtn');
  if (pubBtn) pubBtn.addEventListener('click', function () { doPublish('approved'); });
  if (draftBtn) draftBtn.addEventListener('click', function () { doPublish('draft'); });
}

function removeNewsAdminImage() {
  document.getElementById('newsAdminImageFile').value = '';
  document.getElementById('newsAdminImagePlaceholder').style.display = 'flex';
  document.getElementById('newsAdminImagePreviewWrap').style.display = 'none';
}

function removeNewsAdminVideo() {
  document.getElementById('newsAdminVideoFile').value = '';
  document.getElementById('newsAdminVideoPlaceholder').style.display = 'flex';
  document.getElementById('newsAdminVideoPreviewWrap').style.display = 'none';
}

function removeAdminNewsUpload() {
  var fi = document.getElementById('adminNewsImageFile');
  var pi = document.getElementById('adminNewsImgPreview');
  var ph = document.getElementById('adminNewsImgPlaceholder');
  var pw = document.getElementById('adminNewsImgPreviewWrap');
  if (fi) fi.value = '';
  if (pi) pi.src   = '';
  if (ph) ph.style.display = 'flex';
  if (pw) pw.style.display = 'none';
}

function removeAdminNewsVideoUpload() {
  var fv = document.getElementById('adminNewsVideoFile');
  var pv = document.getElementById('adminNewsVidPreview');
  var vh = document.getElementById('adminNewsVidPlaceholder');
  var vw = document.getElementById('adminNewsVidPreviewWrap');
  if (fv) fv.value = '';
  if (pv) pv.src   = '';
  if (vh) vh.style.display = 'flex';
  if (vw) vw.style.display = 'none';
}



// ================================================
//   LEARNING HUB ADMIN — self-contained block, wired
//   to the real API (unlike most of the rest of this
//   file, which reads/writes localStorage mock data).
//   Deliberately a separate DOMContentLoaded listener
//   so it runs independently of the existing handler
//   above, which throws partway through on every load.
// ================================================
document.addEventListener('DOMContentLoaded', function () {

  var typeLabels = {
    course: 'Course', ebook: 'E-book', past_question: 'Past Question',
    lecture_note: 'Lecture Note', study_material: 'Study Material', exam_prep: 'Exam Prep'
  };

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---- Load + render moderation table ----
  window.loadLearningAdminTab = async function (filter) {
    var tbody = document.getElementById('learningTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Loading...</td></tr>';

    var result;
    try {
      result = await IMC_API.getAllMaterialsAdmin(filter ? { status: filter } : {});
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Error loading materials: ' + err.message + '</td></tr>';
      return;
    }

    if (!result.success) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Error: ' + (result.message || 'Could not load materials.') + '</td></tr>';
      return;
    }

    var materials = result.materials || [];

    updateLearningBadge(materials);

    if (materials.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No materials found.</td></tr>';
      return;
    }

    tbody.innerHTML = materials.map(function (m) {
      var statusBadge = '<span class="status-badge ' + m.status + '">' + m.status + '</span>';
      var priceText = m.isFree ? 'Free' : '₦' + (m.price || 0).toLocaleString();

      var actions = '<div class="btn-group">';
      if (m.status !== 'approved') {
        actions += '<button class="btn btn-success btn-sm" onclick="approveLearningMaterial(\'' + m._id + '\')">Approve</button>';
      }
      if (m.status !== 'rejected') {
        actions += '<button class="btn btn-danger btn-sm" onclick="rejectLearningMaterial(\'' + m._id + '\')">Reject</button>';
      }
      actions += '<button class="btn btn-ghost btn-sm" onclick="deleteLearningMaterialAdmin(\'' + m._id + '\')">Delete</button>';
      actions += '</div>';

      return '<tr>' +
        '<td>' + esc(m.title) + '</td>' +
        '<td>' + (typeLabels[m.materialType] || m.materialType) + '</td>' +
        '<td>' + esc(m.uploaderName || m.uploaderEmail || '—') + ' <span style="color:#aaa;font-size:11px;">(' + m.uploaderRole + ')</span></td>' +
        '<td>' + priceText + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + (m.downloadCount || 0) + '</td>' +
        '<td>' + actions + '</td>' +
        '</tr>';
    }).join('');
  };

  function updateLearningBadge(materials) {
    var badge = document.getElementById('badgeLearning');
    if (!badge) return;
    var pendingCount = materials.filter(function (m) { return m.status === 'pending'; }).length;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  window.approveLearningMaterial = async function (id) {
    var result = await IMC_API.updateMaterialStatus(id, 'approved');
    if (result.success) {
      loadLearningAdminTab(document.getElementById('learningStatusFilter').value);
    } else {
      alert(result.message || 'Could not approve.');
    }
  };

  window.rejectLearningMaterial = async function (id) {
    var reason = prompt('Reason for rejection (optional):', '');
    if (reason === null) return;
    var result = await IMC_API.updateMaterialStatus(id, 'rejected', reason);
    if (result.success) {
      loadLearningAdminTab(document.getElementById('learningStatusFilter').value);
    } else {
      alert(result.message || 'Could not reject.');
    }
  };

  window.deleteLearningMaterialAdmin = async function (id) {
    if (!confirm('Delete this material permanently? This cannot be undone.')) return;
    var result = await IMC_API.deleteMaterialAdmin(id);
    if (result.success) {
      loadLearningAdminTab(document.getElementById('learningStatusFilter').value);
    } else {
      alert(result.message || 'Could not delete.');
    }
  };

  // ---- Filter dropdown ----
  var filterEl = document.getElementById('learningStatusFilter');
  if (filterEl) {
    filterEl.addEventListener('change', function () {
      loadLearningAdminTab(this.value);
    });
  }

  // ---- Admin direct upload modal ----
  var openBtn  = document.getElementById('openLearningUploadBtn');
  var modal    = document.getElementById('learningUploadModal');
  var isFreeCk = document.getElementById('adminUpIsFree');
  var priceField = document.getElementById('adminUpPriceField');

  if (openBtn && modal) {
    openBtn.addEventListener('click', function () { modal.style.display = 'flex'; });
  }
  window.closeLearningUploadModal = function () { modal.style.display = 'none'; };

  if (isFreeCk) {
    isFreeCk.addEventListener('change', function () {
      priceField.style.display = this.checked ? 'none' : 'block';
    });
  }

  var submitBtn = document.getElementById('adminUpSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async function () {
      var errBox = document.getElementById('learningUploadError');
      var okBox  = document.getElementById('learningUploadSuccess');
      errBox.style.display = 'none';
      okBox.style.display  = 'none';

      var title = document.getElementById('adminUpTitle').value.trim();
      var description = document.getElementById('adminUpDescription').value.trim();
      var fileInput = document.getElementById('adminUpFile');

      if (!title || !description) {
        errBox.textContent = 'Title and description are required.';
        errBox.style.display = 'block';
        return;
      }
      if (!fileInput.files || !fileInput.files[0]) {
        errBox.textContent = 'Please select a file.';
        errBox.style.display = 'block';
        return;
      }

      var formData = new FormData();
      formData.append('materialType', document.getElementById('adminUpType').value);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('university', document.getElementById('adminUpUniversity').value.trim());
      formData.append('courseCode', document.getElementById('adminUpCourseCode').value.trim());
      formData.append('isFree', isFreeCk.checked ? 'true' : 'false');
      if (!isFreeCk.checked) {
        formData.append('pricingMode', 'fixed');
        formData.append('price', document.getElementById('adminUpPrice').value);
      }
      formData.append('file', fileInput.files[0]);
      var coverInput = document.getElementById('adminUpCoverImage');
      if (coverInput.files && coverInput.files[0]) {
        formData.append('coverImage', coverInput.files[0]);
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';

      var result;
      try {
        result = await IMC_API.uploadMaterial(formData);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish';
        errBox.textContent = 'Upload failed: ' + err.message;
        errBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-upload"></i> Publish';

      if (result.success) {
        okBox.textContent = 'Published!';
        okBox.style.display = 'block';
        setTimeout(function () {
          closeLearningUploadModal();
          okBox.style.display = 'none';
          loadLearningAdminTab('');
        }, 1000);
      } else {
        errBox.textContent = result.message || 'Upload failed.';
        errBox.style.display = 'block';
      }
    });
  }

});

// ================================================
//   CAMPUS CONNECT ADMIN — same pattern as Learning Hub admin
// ================================================
document.addEventListener('DOMContentLoaded', function () {

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var navItem = document.querySelector('.nav-item[data-section="connect"]');
  if (navItem) {
    navItem.addEventListener('click', function () {
      loadConnectAdminTab('');
    });
  }

  window.loadConnectAdminTab = async function (filter) {
    var tbody = document.getElementById('connectTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Loading...</td></tr>';

    var result;
    try {
      result = await IMC_API.adminGetCommunities(filter);
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Error loading communities: ' + err.message + '</td></tr>';
      return;
    }

    if (!result.success) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Error: ' + (result.message || 'Could not load communities.') + '</td></tr>';
      return;
    }

    var communities = result.communities || [];

    var badge = document.getElementById('badgeConnect');
    if (badge) {
      var pending = communities.filter(function (c) { return c.status === 'pending'; }).length;
      if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-block'; }
      else { badge.style.display = 'none'; }
    }

    if (communities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No communities found.</td></tr>';
      return;
    }

    tbody.innerHTML = communities.map(function (c) {
      var statusBadge = '<span class="status-badge ' + c.status + '">' + c.status + '</span>';
      var actions = '<div class="btn-group">';
      if (c.status !== 'approved') {
        actions += '<button class="btn btn-success btn-sm" onclick="approveCommunity(\'' + c._id + '\')">Approve</button>';
      }
      if (c.status !== 'rejected') {
        actions += '<button class="btn btn-danger btn-sm" onclick="rejectCommunity(\'' + c._id + '\')">Reject</button>';
      }
      if (!c.verified) {
        actions += '<button class="btn btn-ghost btn-sm" onclick="verifyCommunity(\'' + c._id + '\')">Verify</button>';
      }
      actions += '<button class="btn btn-ghost btn-sm" onclick="deleteCommunityAdmin(\'' + c._id + '\')">Delete</button>';
      actions += '</div>';

      return '<tr>' +
        '<td>' + esc(c.communityName) + (c.featured ? ' ⭐' : '') + (c.verified ? ' ✅' : '') + '</td>' +
        '<td>' + esc(c.university) + '</td>' +
        '<td>' + esc(c.platform) + '</td>' +
        '<td>' + esc(c.creatorName || c.creatorEmail || '—') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + (c.memberCount || 0) + '</td>' +
        '<td>' + actions + '</td>' +
        '</tr>';
    }).join('');
  };

  window.approveCommunity = async function (id) {
    var result = await IMC_API.adminUpdateCommunityStatus(id, 'approved');
    if (result.success) loadConnectAdminTab(document.getElementById('connectStatusFilter').value);
    else alert(result.message || 'Could not approve.');
  };

  window.rejectCommunity = async function (id) {
    var reason = prompt('Reason for rejection (optional):', '');
    if (reason === null) return;
    var result = await IMC_API.adminUpdateCommunityStatus(id, 'rejected', reason);
    if (result.success) loadConnectAdminTab(document.getElementById('connectStatusFilter').value);
    else alert(result.message || 'Could not reject.');
  };

  window.verifyCommunity = async function (id) {
    var result = await IMC_API.adminUpdateCommunity(id, { verified: true });
    if (result.success) loadConnectAdminTab(document.getElementById('connectStatusFilter').value);
    else alert(result.message || 'Could not verify.');
  };

  window.deleteCommunityAdmin = async function (id) {
    if (!confirm('Delete this community permanently?')) return;
    var result = await IMC_API.adminDeleteCommunity(id);
    if (result.success) loadConnectAdminTab(document.getElementById('connectStatusFilter').value);
    else alert(result.message || 'Could not delete.');
  };

  var filterEl = document.getElementById('connectStatusFilter');
  if (filterEl) {
    filterEl.addEventListener('change', function () { loadConnectAdminTab(this.value); });
  }

  loadConnectAdminTab('');
});