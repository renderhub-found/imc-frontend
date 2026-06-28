// ================================================
//   ADMIN DASHBOARD — admin-dashboard.js
//   COMPLETELY FIXED VERSION
// ================================================

window.addEventListener('DOMContentLoaded', function () {

  // ---- Admin check ----
  var isAdmin = localStorage.getItem('imc_admin');
  if (!isAdmin) {
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;' +
      'height:100vh;font-family:Inter,sans-serif;text-align:center;padding:20px;">' +
      '<div>' +
      '<div style="font-size:60px;margin-bottom:16px;">🔒</div>' +
      '<h2 style="font-size:22px;color:#1a1a2e;margin-bottom:10px;">Admin Access Required</h2>' +
      '<p style="color:#888;font-size:14px;margin-bottom:20px;">Open browser console (F12) and run:</p>' +
      '<code style="display:block;background:#f4f6fb;padding:12px 18px;' +
      'border-radius:8px;color:#1a3c8f;font-weight:700;margin-bottom:20px;">' +
      "localStorage.setItem('imc_admin','true')" +
      '</code>' +
      '<p style="color:#aaa;font-size:13px;margin-bottom:16px;">Then refresh the page.</p>' +
      '<a href="index.html" style="color:#1a3c8f;font-weight:700;">← Back to Home</a>' +
      '</div></div>';
    return;
  }

  // ---- Load all tabs ----
  loadOverview();
  loadVendorsTab('');
  loadAmbassadorsTab();
  loadUsersTab('');
  loadAdsTab('');
  loadNewsAdminTab('');
  loadCoursesTab();
  loadPaymentsTab();
  loadReferralsTab();

// New tabs
loadWithdrawalsTab();
loadNotificationsTab();
loadSettingsTab();
initAdminNewsForm();
updateNotifBadge();

  // ---- TAB NAVIGATION ----
  var links = document.querySelectorAll('.sidebar-link[data-tab]');
  var tabs  = document.querySelectorAll('.dash-tab');

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var tabId = this.getAttribute('data-tab');

      links.forEach(function (l) { l.classList.remove('active'); });
      tabs.forEach(function  (t) { t.classList.remove('active'); });

      this.classList.add('active');
      var tabEl = document.getElementById('tab-' + tabId);
      if (tabEl) tabEl.classList.add('active');

      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('sidebar-open');
    });
  });

// Reload dynamic tabs on switch
if (tabId === 'notifications') loadNotificationsTab();
if (tabId === 'withdrawals')   loadWithdrawalsTab();
if (tabId === 'settings')      loadSettingsTab();
if (tabId === 'news')          loadNewsAdminTab('');

  // ---- Mobile sidebar ----
  var sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('sidebar-open');
    });
  }

  // ---- Filter listeners ----
  var vendorFilter = document.getElementById('vendorStatusFilter');
  if (vendorFilter) {
    vendorFilter.addEventListener('change', function () {
      loadVendorsTab(this.value);
    });
  }

  var adFilter = document.getElementById('adStatusFilter');
  if (adFilter) {
    adFilter.addEventListener('change', function () {
      loadAdsTab(this.value);
    });
  }

  var newsFilter = document.getElementById('newsStatusFilter');
  if (newsFilter) {
    newsFilter.addEventListener('change', function () {
      loadNewsAdminTab(this.value);
    });
  }

  var userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', function () {
      loadUsersTab(this.value.trim());
    });
  }

  // ---- Add course toggle ----
  var showCourseForm = document.getElementById('showAddCourseForm');
  if (showCourseForm) {
    showCourseForm.addEventListener('click', function () {
      var form = document.getElementById('addCourseForm');
      if (form) form.style.display = 'block';
      this.style.display = 'none';
    });
  }

  var cancelCourse = document.getElementById('cancelCourseForm');
  if (cancelCourse) {
    cancelCourse.addEventListener('click', function () {
      var form = document.getElementById('addCourseForm');
      if (form) form.style.display = 'none';
      if (showCourseForm) showCourseForm.style.display = 'flex';
    });
  }

  var saveCourse = document.getElementById('saveCourseBtn');
  if (saveCourse) {
    saveCourse.addEventListener('click', saveNewCourse);
  }

}); // end DOMContentLoaded


// ================================================
//   OVERVIEW
// ================================================
function loadOverview() {
  var users       = JSON.parse(localStorage.getItem('imc_users')       || '[]');
  var vendors     = JSON.parse(localStorage.getItem('imc_vendors')     || '[]');
  var ambassadors = JSON.parse(localStorage.getItem('imc_ambassadors') || '[]');
  var ads         = JSON.parse(localStorage.getItem('imc_ads')         || '[]');
  var news        = JSON.parse(localStorage.getItem('imc_news')        || '[]');
  var courses     = JSON.parse(localStorage.getItem('imc_courses')     || '[]');
  var purchases   = JSON.parse(localStorage.getItem('imc_purchases')   || '[]');
  var messages    = JSON.parse(localStorage.getItem('imc_contact_messages') || '[]');

  var pendingVendors  = vendors.filter(function(v){ return v.status==='pending';  }).length;
  var approvedVendors = vendors.filter(function(v){ return v.status==='approved'; }).length;
  var pendingAds      = ads.filter(function(a){ return a.status==='pending'; }).length;
  var pendingNews     = news.filter(function(n){ return n.status==='pending'; }).length;

  var vendorRevenue  = vendors.filter(function(v){ return v.paymentStatus==='paid'; }).length * 5000;
  var adRevenue      = 0;
  for(var i=0;i<ads.length;i++){ if(ads[i].paymentStatus==='paid') adRevenue += (ads[i].price||0); }
  var courseRevenue  = 0;
  for(var j=0;j<purchases.length;j++){ courseRevenue += (purchases[j].price||0); }
  var totalRevenue   = vendorRevenue + adRevenue + courseRevenue;

  var statsEl = document.getElementById('overviewStats');
  if (statsEl) {
    statsEl.innerHTML =
      makeStatCard('Total Users',       users.length,       'fas fa-users',          '#e8f0fe','#1a3c8f') +
      makeStatCard('Total Vendors',     vendors.length,     'fas fa-store',          '#fff3e0','#e85d04') +
      makeStatCard('Ambassadors',       ambassadors.length, 'fas fa-user-tie',       '#e8f5e9','#2d8653') +
      makeStatCard('Pending Vendors',   pendingVendors,     'fas fa-clock',          '#fff8e1','#f59f00') +
      makeStatCard('Active Vendors',    approvedVendors,    'fas fa-check-circle',   '#e8f5e9','#2d8653') +
      makeStatCard('Pending Ads',       pendingAds,         'fas fa-ad',             '#fce4ec','#c62828') +
      makeStatCard('Total Courses',     courses.length,     'fas fa-graduation-cap', '#e0f2fe','#0369a1') +
      makeStatCard('Revenue',           '₦'+totalRevenue.toLocaleString(), 'fas fa-wallet','#e8f5e9','#2d8653');
  }

  var activityEl = document.getElementById('recentActivity');
  if (activityEl) {
    activityEl.innerHTML =
      '<div class="admin-activity-card">' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">📊 Quick Summary</h3>' +
      '<div class="activity-rows">' +
      makeActivityRow('Approved Vendors', approvedVendors, 'approved') +
      makeActivityRow('Pending Vendors',  pendingVendors,  'pending')  +
      makeActivityRow('Pending Ads',      pendingAds,      'pending')  +
      makeActivityRow('Pending News',     pendingNews,     'pending')  +
      makeActivityRow('Course Purchases', purchases.length,'approved') +
      makeActivityRow('Contact Messages', messages.length, 'approved') +
      '<div class="activity-row" style="border-top:2px solid #f0f0f0;padding-top:12px;margin-top:6px;">' +
      '<span style="font-weight:700;">Total Revenue</span>' +
      '<span style="font-weight:800;color:#2d8653;">₦' + totalRevenue.toLocaleString() + '</span>' +
      '</div>' +
      '</div></div>';
  }
}

function makeStatCard(label, value, icon, bg, color) {
  return '<div class="stat-card">' +
    '<div class="stat-icon" style="background:' + bg + ';">' +
    '<i class="' + icon + '" style="color:' + color + ';"></i></div>' +
    '<div><p class="stat-label">' + label + '</p>' +
    '<h3 class="stat-value">' + value + '</h3></div>' +
    '</div>';
}

function makeActivityRow(label, value, status) {
  return '<div class="activity-row">' +
    '<span>' + label + '</span>' +
    '<span class="status-badge ' + status + '">' + value + '</span>' +
    '</div>';
}


// ================================================
//   VENDORS TAB
// ================================================
function loadVendorsTab(filter) {
  var vendors = JSON.parse(localStorage.getItem('imc_vendors') || '[]');
  if (filter) {
    vendors = vendors.filter(function(v){ return v.status === filter; });
  }
  var container = document.getElementById('vendorsTable');
  if (!container) return;

  if (vendors.length === 0) {
    container.innerHTML = makeEmptyState('🏪','No vendors found.'); return;
  }

  var rows = '';
  for (var i = 0; i < vendors.length; i++) {
    var v = vendors[i];
    var statusLabel = v.status==='approved' ? '✅ Approved'
      : v.status==='rejected' ? '❌ Rejected' : '⏳ Pending';
    rows +=
      '<tr>' +
      '<td><strong>' + v.bizName + '</strong></td>' +
      '<td>' + v.fullName + '<br><small style="color:#aaa;">' + v.email + '</small></td>' +
      '<td>' + v.university + '</td>' +
      '<td>' + v.category + '</td>' +
      '<td>' + v.joinedDate + '</td>' +
      '<td><span class="status-badge ' + v.status + '">' + statusLabel + '</span></td>' +
      '<td><div class="action-btns">' +
      (v.status !== 'approved' ?
        '<button class="btn-approve" onclick="updateVendorStatus(\'' + v.id + '\',\'approved\')">Approve</button>' : '') +
      (v.status !== 'rejected' ?
        '<button class="btn-reject" onclick="updateVendorStatus(\'' + v.id + '\',\'rejected\')">Reject</button>' : '') +
      '<button class="btn-view-detail" onclick="viewVendorDetail(\'' + v.id + '\')">View</button>' +
      '</div></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Business</th><th>Owner</th><th>University</th>' +
    '<th>Category</th><th>Date</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function updateVendorStatus(vendorId, newStatus) {
  var vendors = JSON.parse(localStorage.getItem('imc_vendors') || '[]');
  for (var i = 0; i < vendors.length; i++) {
    if (vendors[i].id === vendorId) {
      vendors[i].status = newStatus; break;
    }
  }
  localStorage.setItem('imc_vendors', JSON.stringify(vendors));
  alert('Vendor ' + newStatus + ' successfully!');
  var filter = document.getElementById('vendorStatusFilter');
  loadVendorsTab(filter ? filter.value : '');
  loadOverview();
}

function viewVendorDetail(vendorId) {
  var vendors = JSON.parse(localStorage.getItem('imc_vendors') || '[]');
  var v = null;
  for (var i = 0; i < vendors.length; i++) {
    if (vendors[i].id === vendorId) { v = vendors[i]; break; }
  }
  if (!v) return;
  alert('VENDOR DETAILS\n\n' +
    'Business: ' + v.bizName + '\n' +
    'Owner: '    + v.fullName + '\n' +
    'Email: '    + v.email + '\n' +
    'WhatsApp: ' + v.whatsApp + '\n' +
    'University: '+ v.university + '\n' +
    'Category: ' + v.category + '\n' +
    'Status: '   + v.status + '\n\n' +
    'Description:\n' + v.description);
}


// ================================================
//   AMBASSADORS TAB
// ================================================
function loadAmbassadorsTab() {
  var ambassadors = JSON.parse(localStorage.getItem('imc_ambassadors') || '[]');
  var container   = document.getElementById('ambassadorsTable');
  if (!container) return;

  if (ambassadors.length === 0) {
    container.innerHTML = makeEmptyState('🎓','No ambassadors yet.'); return;
  }

  var rows = '';
  for (var i = 0; i < ambassadors.length; i++) {
    var a = ambassadors[i];
    rows +=
      '<tr>' +
      '<td><strong>' + a.fullName + '</strong><br>' +
      '<small style="color:#aaa;">' + a.email + '</small></td>' +
      '<td>@' + a.username + '</td>' +
      '<td>' + a.university + '</td>' +
      '<td>' + (a.referrals||[]).length + '</td>' +
      '<td style="color:#2d8653;font-weight:700;">₦' + (a.earnings||0).toLocaleString() + '</td>' +
      '<td>' + a.joinedDate + '</td>' +
      '<td><span style="background:#e8f5e9;color:#2d8653;font-size:11px;' +
      'font-weight:700;padding:3px 8px;border-radius:5px;">' + a.refCode + '</span></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Name</th><th>Username</th><th>University</th>' +
    '<th>Referrals</th><th>Earnings</th><th>Joined</th><th>Ref Code</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   USERS TAB
// ================================================
function loadUsersTab(search) {
  var users     = JSON.parse(localStorage.getItem('imc_users') || '[]');
  var container = document.getElementById('usersTable');
  if (!container) return;

  if (search) {
    var q = search.toLowerCase();
    users = users.filter(function(u) {
      return u.email.toLowerCase().includes(q) ||
        ((u.firstName||'') + ' ' + (u.lastName||'')).toLowerCase().includes(q);
    });
  }

  if (users.length === 0) {
    container.innerHTML = makeEmptyState('👤','No users found.'); return;
  }

  var rows = '';
  for (var i = 0; i < users.length; i++) {
    var u       = users[i];
    var blocked = u.blocked || false;
    var role    = u.role || 'student';
    rows +=
      '<tr>' +
      '<td><strong>' + (u.firstName||'') + ' ' + (u.lastName||'') + '</strong></td>' +
      '<td>' + u.email + '</td>' +
      '<td>' + (u.university||'—') + '</td>' +
      '<td>' +
      '<select class="role-select" onchange="changeUserRole(\'' + u.email + '\',this.value)">' +
      '<option value="student"'    + (role==='student'    ?' selected':'') + '>Student</option>' +
      '<option value="vendor"'     + (role==='vendor'     ?' selected':'') + '>Vendor</option>' +
      '<option value="ambassador"' + (role==='ambassador' ?' selected':'') + '>Ambassador</option>' +
      '<option value="admin"'      + (role==='admin'      ?' selected':'') + '>Admin</option>' +
      '</select></td>' +
      '<td>' + (u.joined||'—') + '</td>' +
      '<td><span class="status-badge ' + (blocked?'rejected':'approved') + '">' +
      (blocked?'🚫 Blocked':'✅ Active') + '</span></td>' +
      '<td><button class="' + (blocked?'btn-approve':'btn-reject') + '" ' +
      'onclick="toggleBlockUser(\'' + u.email + '\')">' +
      (blocked?'Unblock':'Block') + '</button></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Name</th><th>Email</th><th>University</th>' +
    '<th>Role</th><th>Joined</th><th>Status</th><th>Action</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function toggleBlockUser(email) {
  var users = JSON.parse(localStorage.getItem('imc_users') || '[]');
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      users[i].blocked = !users[i].blocked;
      alert('User ' + (users[i].blocked ? 'blocked' : 'unblocked') + '.');
      break;
    }
  }
  localStorage.setItem('imc_users', JSON.stringify(users));
  loadUsersTab('');
}

function changeUserRole(email, newRole) {
  var users = JSON.parse(localStorage.getItem('imc_users') || '[]');
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      users[i].role = newRole; break;
    }
  }
  localStorage.setItem('imc_users', JSON.stringify(users));
}


// ================================================
//   ADS TAB
// ================================================
function loadAdsTab(filter) {
  var ads = JSON.parse(localStorage.getItem('imc_ads') || '[]');
  if (filter) {
    ads = ads.filter(function(a){ return a.status === filter; });
  }
  var container = document.getElementById('adsAdminList');
  if (!container) return;

  if (ads.length === 0) {
    container.innerHTML = makeEmptyState('📢','No ads found.'); return;
  }

  var html = '';
  for (var i = 0; i < ads.length; i++) {
    var ad        = ads[i];
    var statusLbl = ad.status==='approved' ? '✅ Live'
      : ad.status==='rejected' ? '❌ Rejected' : '⏳ Pending';

    html +=
      '<div class="admin-review-card">' +
      '<img src="' + ad.image + '" alt="' + ad.title + '" class="admin-review-img" ' +
      'onerror="this.src=\'https://via.placeholder.com/120x80\'"/>' +
      '<div class="admin-review-body">' +
      '<h4>' + ad.title + '</h4>' +
      '<p class="admin-review-meta">' +
      '<i class="fas fa-tag"></i> ' + ad.category + ' &nbsp;|&nbsp; ' +
      '<i class="fas fa-map-marker-alt"></i> ' + ad.location + ' &nbsp;|&nbsp; ' +
      '<i class="fas fa-calendar"></i> ' + ad.date + '</p>' +
      '<p class="admin-review-desc">' + ad.description + '</p>' +
      '<p style="font-size:12px;color:#888;">By: ' + ad.ownerName +
      ' · ₦' + (ad.price||0).toLocaleString() + ' paid</p>' +
      '</div>' +
      '<div class="admin-review-actions">' +
      '<span class="status-badge ' + ad.status + '" style="margin-bottom:8px;display:block;">' +
      statusLbl + '</span>' +
      (ad.status !== 'approved' ?
        '<button class="btn-approve" onclick="updateAdStatus(\'' + ad.id + '\',\'approved\')">Approve</button>' : '') +
      (ad.status !== 'rejected' ?
        '<button class="btn-reject" onclick="updateAdStatus(\'' + ad.id + '\',\'rejected\')">Reject</button>' : '') +
      '</div></div>';
  }

  container.innerHTML = html;
}

function updateAdStatus(adId, newStatus) {
  var ads = JSON.parse(localStorage.getItem('imc_ads') || '[]');
  for (var i = 0; i < ads.length; i++) {
    if (ads[i].id === adId) { ads[i].status = newStatus; break; }
  }
  localStorage.setItem('imc_ads', JSON.stringify(ads));
  alert('Ad ' + newStatus + '!');
  var filter = document.getElementById('adStatusFilter');
  loadAdsTab(filter ? filter.value : '');
  loadOverview();
}


// ================================================
//   NEWS TAB
// ================================================
function loadNewsAdminTab(filter) {
  var news = JSON.parse(localStorage.getItem('imc_news') || '[]');
  if (filter) {
    news = news.filter(function(n){ return n.status === filter; });
  }
  var container = document.getElementById('newsAdminList');
  if (!container) return;

  if (news.length === 0) {
    container.innerHTML = makeEmptyState('📰','No news found.'); return;
  }

  var html = '';
  for (var i = 0; i < news.length; i++) {
    var n         = news[i];
    var statusLbl = n.status==='approved' ? '✅ Published'
      : n.status==='rejected' ? '❌ Rejected' : '⏳ Pending';

    html +=
      '<div class="admin-review-card">' +
      '<img src="' + n.image + '" alt="' + n.title + '" class="admin-review-img" ' +
      'onerror="this.src=\'https://via.placeholder.com/120x80\'"/>' +
      '<div class="admin-review-body">' +
      '<h4>' + n.title + (n.pinned ? ' <span class="pinned-badge" style="font-size:11px;">📌 Pinned</span>' : '') + '</h4>' +
      '<p class="admin-review-meta">' +
      '<i class="fas fa-university"></i> ' + n.university +
      ' &nbsp;|&nbsp; <i class="fas fa-calendar"></i> ' + n.date + '</p>' +
      '<p class="admin-review-desc">' + n.content.substring(0,100) + '...</p>' +
      '<p style="font-size:12px;color:#888;">By: ' + n.authorName + '</p>' +
      '</div>' +
      '<div class="admin-review-actions">' +
      '<span class="status-badge ' + n.status + '" style="margin-bottom:8px;display:block;">' +
      statusLbl + '</span>' +
      (n.status !== 'approved' ?
        '<button class="btn-approve" onclick="updateNewsStatus(\'' + n.id + '\',\'approved\')">Approve</button>' : '') +
      (n.status !== 'rejected' ?
        '<button class="btn-reject" onclick="updateNewsStatus(\'' + n.id + '\',\'rejected\')">Reject</button>' : '') +
      '<button class="btn-view-detail" onclick="togglePinNews(\'' + n.id + '\')">' +
      (n.pinned ? 'Unpin' : '📌 Pin') + '</button>' +
      '</div></div>';
  }

  container.innerHTML = html;
}

function updateNewsStatus(newsId, newStatus) {
  var news = JSON.parse(localStorage.getItem('imc_news') || '[]');
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === newsId) { news[i].status = newStatus; break; }
  }
  localStorage.setItem('imc_news', JSON.stringify(news));
  alert('News ' + newStatus + '!');
  var filter = document.getElementById('newsStatusFilter');
  loadNewsAdminTab(filter ? filter.value : '');
  loadOverview();
}

function togglePinNews(newsId) {
  var news = JSON.parse(localStorage.getItem('imc_news') || '[]');
  for (var i = 0; i < news.length; i++) {
    if (news[i].id === newsId) {
      news[i].pinned = !news[i].pinned;
      alert('News ' + (news[i].pinned ? 'pinned' : 'unpinned') + '!');
      break;
    }
  }
  localStorage.setItem('imc_news', JSON.stringify(news));
  var filter = document.getElementById('newsStatusFilter');
  loadNewsAdminTab(filter ? filter.value : '');
}


// ================================================
//   COURSES TAB
// ================================================
function loadCoursesTab() {
  var courses   = JSON.parse(localStorage.getItem('imc_courses') || '[]');
  var container = document.getElementById('coursesAdminTable');
  if (!container) return;

  if (courses.length === 0) {
    container.innerHTML = makeEmptyState('🎓','No courses yet.'); return;
  }

  var rows = '';
  for (var i = 0; i < courses.length; i++) {
    var c = courses[i];
    rows +=
      '<tr>' +
      '<td><strong>' + c.title + '</strong><br>' +
      '<small style="color:#aaa;">' + c.duration + ' · ' + c.lessons + ' lessons</small></td>' +
      '<td>' + c.category + '</td>' +
      '<td>' + (c.isFree ?
        '<span class="status-badge approved">FREE</span>' :
        '<strong style="color:#e85d04;">₦' + c.price.toLocaleString() + '</strong>') + '</td>' +
      '<td>' + c.level + '</td>' +
      '<td>' + c.students + '</td>' +
      '<td><button class="btn-reject" onclick="deleteCourse(\'' + c.id + '\')">Delete</button></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Course</th><th>Category</th><th>Price</th>' +
    '<th>Level</th><th>Students</th><th>Action</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function deleteCourse(courseId) {
  if (!confirm('Delete this course? This cannot be undone.')) return;
  var courses = JSON.parse(localStorage.getItem('imc_courses') || '[]');
  courses = courses.filter(function(c){ return c.id !== courseId; });
  localStorage.setItem('imc_courses', JSON.stringify(courses));
  alert('Course deleted.');
  loadCoursesTab();
  loadOverview();
}

function saveNewCourse() {
  var title    = document.getElementById('newCourseTitle').value.trim();
  var category = document.getElementById('newCourseCategory').value;
  var price    = document.getElementById('newCoursePrice').value;
  var level    = document.getElementById('newCourseLevel').value;
  var duration = document.getElementById('newCourseDuration').value.trim();
  var lessons  = document.getElementById('newCourseLessons').value;
  var image    = document.getElementById('newCourseImage').value.trim();
  var fileUrl  = document.getElementById('newCourseFile').value.trim();
  var desc     = document.getElementById('newCourseDesc').value.trim();

  var errBox = document.getElementById('courseFormError');
  var errMsg = document.getElementById('courseFormErrorMsg');
  if (errBox) errBox.style.display = 'none';

  function showErr(msg) {
    if (errMsg) errMsg.textContent = msg;
    if (errBox) errBox.style.display = 'flex';
  }

  if (!title)    { showErr('Please enter a course title.'); return; }
  if (!category) { showErr('Please select a category.'); return; }
  if (price==='') { showErr('Please enter a price (0 for free).'); return; }
  if (!fileUrl)  { showErr('Please enter a download URL.'); return; }
  if (!desc)     { showErr('Please add a description.'); return; }

  var priceNum = parseInt(price);
  var courses  = JSON.parse(localStorage.getItem('imc_courses') || '[]');

  courses.push({
    id:          'CRS-' + Date.now(),
    title:       title,
    category:    category,
    instructor:  'IMC Academy',
    description: desc,
    price:       priceNum,
    isFree:      priceNum === 0,
    image:       image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=300&fit=crop',
    fileUrl:     fileUrl,
    duration:    duration || '2 hours',
    lessons:     parseInt(lessons) || 10,
    level:       level,
    rating:      4.5,
    students:    0,
    tags:        [category]
  });

  localStorage.setItem('imc_courses', JSON.stringify(courses));
  alert('✅ Course added successfully!');

  var ids = ['newCourseTitle','newCoursePrice','newCourseDuration',
             'newCourseLessons','newCourseImage','newCourseFile','newCourseDesc'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var catEl = document.getElementById('newCourseCategory');
  if (catEl) catEl.value = '';

  var form        = document.getElementById('addCourseForm');
  var showBtn     = document.getElementById('showAddCourseForm');
  if (form)    form.style.display    = 'none';
  if (showBtn) showBtn.style.display = 'flex';

  loadCoursesTab();
  loadOverview();
}


// ================================================
//   PAYMENTS TAB
// ================================================
function loadPaymentsTab() {
  var vendors   = JSON.parse(localStorage.getItem('imc_vendors')   || '[]');
  var ads       = JSON.parse(localStorage.getItem('imc_ads')       || '[]');
  var purchases = JSON.parse(localStorage.getItem('imc_purchases') || '[]');

  var allPayments = [];

  for (var i = 0; i < vendors.length; i++) {
    if (vendors[i].paymentStatus === 'paid') {
      allPayments.push({
        type:'Vendor Registration', name:vendors[i].bizName,
        email:vendors[i].email, amount:5000, date:vendors[i].joinedDate
      });
    }
  }
  for (var j = 0; j < ads.length; j++) {
    if (ads[j].paymentStatus === 'paid') {
      allPayments.push({
        type:'Ad Posting', name:ads[j].title,
        email:ads[j].ownerEmail, amount:ads[j].price||0, date:ads[j].date
      });
    }
  }
  for (var k = 0; k < purchases.length; k++) {
    allPayments.push({
      type:'Course Purchase', name:purchases[k].courseTitle,
      email:purchases[k].userEmail, amount:purchases[k].price||0, date:purchases[k].date
    });
  }

  var container = document.getElementById('paymentsAdminTable');
  if (!container) return;

  if (allPayments.length === 0) {
    container.innerHTML = makeEmptyState('💰','No payments yet.'); return;
  }

  var total = 0;
  for (var p = 0; p < allPayments.length; p++) {
    total += allPayments[p].amount;
  }

  var rows = '';
  for (var r = 0; r < allPayments.length; r++) {
    var pay = allPayments[r];
    rows +=
      '<tr>' +
      '<td><span class="admin-type-badge">' + pay.type + '</span></td>' +
      '<td>' + pay.name + '</td>' +
      '<td style="font-size:12px;color:#888;">' + pay.email + '</td>' +
      '<td style="font-weight:700;color:#2d8653;">₦' + (pay.amount||0).toLocaleString() + '</td>' +
      '<td>' + pay.date + '</td>' +
      '<td><span class="status-badge approved">✅ Paid</span></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<div style="background:linear-gradient(135deg,#1a3c8f,#2d5fd4);' +
    'border-radius:12px;padding:20px 24px;margin-bottom:20px;color:white;">' +
    '<p style="font-size:13px;opacity:0.8;">Total Platform Revenue</p>' +
    '<h2 style="font-size:32px;font-weight:800;">₦' + total.toLocaleString() + '</h2>' +
    '</div>' +
    '<table class="data-table"><thead><tr>' +
    '<th>Type</th><th>Name</th><th>Email</th>' +
    '<th>Amount</th><th>Date</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   REFERRALS TAB
// ================================================
function loadReferralsTab() {
  var ambassadors = JSON.parse(localStorage.getItem('imc_ambassadors') || '[]');
  var container   = document.getElementById('referralsAdminTable');
  if (!container) return;

  if (ambassadors.length === 0) {
    container.innerHTML = makeEmptyState('🔗','No referral data yet.'); return;
  }

  var rows = '';
  for (var i = 0; i < ambassadors.length; i++) {
    var a     = ambassadors[i];
    var count = (a.referrals || []).length;
    var comm  = a.earnings || 0;
    rows +=
      '<tr>' +
      '<td><strong>' + a.fullName + '</strong><br>' +
      '<small style="color:#aaa;">' + a.email + '</small></td>' +
      '<td><span style="background:#e8f5e9;color:#2d8653;font-size:11px;' +
      'font-weight:700;padding:3px 8px;border-radius:5px;">' + a.refCode + '</span></td>' +
      '<td>' + a.university + '</td>' +
      '<td style="font-weight:700;text-align:center;">' + count + '</td>' +
      '<td style="font-weight:700;color:#e85d04;">₦' + comm.toLocaleString() + '</td>' +
      '<td><span class="status-badge approved">✅ Active</span></td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Ambassador</th><th>Ref Code</th><th>University</th>' +
    '<th>Referrals</th><th>Commission</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   HELPER
// ================================================
function makeEmptyState(icon, msg) {
  return '<div class="empty-state-card">' +
    '<div style="font-size:40px;">' + icon + '</div>' +
    '<p>' + msg + '</p></div>';
}

// ================================================
//   ADMIN NOTIFICATION SYSTEM
// ================================================

function addAdminNotification(type, message) {
  var notifs = JSON.parse(
    localStorage.getItem('imc_admin_notifs') || '[]'
  );
  notifs.unshift({
    id:      'NOTIF-' + Date.now(),
    type:    type,
    message: message,
    date:    new Date().toLocaleDateString(),
    time:    new Date().toLocaleTimeString(),
    read:    false
  });
  // Keep only last 50
  if (notifs.length > 50) notifs = notifs.slice(0, 50);
  localStorage.setItem('imc_admin_notifs', JSON.stringify(notifs));
  updateNotifBadge();
}

function updateNotifBadge() {
  var notifs  = JSON.parse(
    localStorage.getItem('imc_admin_notifs') || '[]'
  );
  var unread  = notifs.filter(function (n) { return !n.read; }).length;
  var badge   = document.getElementById('adminNotifBadge');
  if (!badge) return;
  if (unread > 0) {
    badge.style.display  = 'inline-block';
    badge.textContent    = unread > 99 ? '99+' : unread;
  } else {
    badge.style.display  = 'none';
  }
}

function loadNotificationsTab() {
  var notifs    = JSON.parse(
    localStorage.getItem('imc_admin_notifs') || '[]'
  );
  var container = document.getElementById('adminNotificationsList');
  if (!container) return;

  // Mark all as read when tab opens
  notifs.forEach(function (n) { n.read = true; });
  localStorage.setItem('imc_admin_notifs', JSON.stringify(notifs));
  updateNotifBadge();

  if (notifs.length === 0) {
    container.innerHTML = makeEmptyState('🔔', 'No notifications yet.');
    return;
  }

  var iconMap = {
    vendor:     '🏪',
    ambassador: '🎓',
    withdrawal: '💰',
    ad:         '📢',
    news:       '📰',
    course:     '🎓'
  };

  container.innerHTML = notifs.map(function (n) {
    return '<div class="notif-card' + (n.read ? ' read' : '') + '">' +
      '<div class="notif-icon">' +
      (iconMap[n.type] || '🔔') + '</div>' +
      '<div class="notif-body">' +
      '<h4>' + n.message + '</h4>' +
      '<p>' + n.date + ' at ' + n.time + '</p>' +
      '</div>' +
      '</div>';
  }).join('');
}

function clearAllNotifications() {
  localStorage.setItem('imc_admin_notifs', '[]');
  updateNotifBadge();
  loadNotificationsTab();
}


// ================================================
//   WITHDRAWAL REQUESTS TAB
// ================================================

function loadWithdrawalsTab() {
  var requests  = JSON.parse(
    localStorage.getItem('imc_withdrawals') || '[]'
  );
  var container = document.getElementById('withdrawalRequestsList');
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = makeEmptyState('💰', 'No withdrawal requests yet.');
    return;
  }

  container.innerHTML = requests.map(function (r) {
    var statusColor = r.status === 'paid'
      ? '#2d8653' : r.status === 'rejected'
      ? '#c62828' : '#f59f00';
    var statusLabel = r.status === 'paid'
      ? '✅ Paid' : r.status === 'rejected'
      ? '❌ Rejected' : '⏳ Pending';

    return '<div class="admin-review-card" ' +
      'style="flex-wrap:wrap;gap:12px;">' +
      '<div style="flex:1;min-width:200px;">' +
      '<h4 style="font-size:14px;font-weight:700;' +
      'color:#1a1a2e;margin-bottom:6px;">' +
      r.ambName + '</h4>' +
      '<p style="font-size:13px;color:#555;margin-bottom:3px;">' +
      '<i class="fas fa-university" style="color:#1a3c8f;' +
      'margin-right:6px;"></i>' + r.bankName + '</p>' +
      '<p style="font-size:13px;color:#555;margin-bottom:3px;">' +
      '<i class="fas fa-hashtag" style="color:#1a3c8f;' +
      'margin-right:6px;"></i>' + r.accountNum + '</p>' +
      '<p style="font-size:13px;color:#555;margin-bottom:3px;">' +
      '<i class="fas fa-user" style="color:#1a3c8f;' +
      'margin-right:6px;"></i>' + r.accountName + '</p>' +
      '<p style="font-size:12px;color:#aaa;">' + r.date + '</p>' +
      '</div>' +
      '<div style="text-align:center;">' +
      '<div style="font-size:22px;font-weight:800;' +
      'color:#2d8653;margin-bottom:8px;">' +
      '₦' + r.amount.toLocaleString() + '</div>' +
      '<span class="status-badge" ' +
      'style="background:' + statusColor + '22;' +
      'color:' + statusColor + ';display:block;' +
      'margin-bottom:10px;">' + statusLabel + '</span>' +
      (r.status === 'pending' ?
        '<div class="action-btns" style="justify-content:center;">' +
        '<button class="btn-approve" ' +
        'onclick="updateWithdrawal(\'' + r.id + '\',\'paid\')">' +
        'Mark Paid</button>' +
        '<button class="btn-reject" ' +
        'onclick="updateWithdrawal(\'' + r.id + '\',\'rejected\')">' +
        'Reject</button>' +
        '</div>' : '') +
      '</div>' +
      '</div>';
  }).join('');
}

function updateWithdrawal(id, newStatus) {
  var requests = JSON.parse(
    localStorage.getItem('imc_withdrawals') || '[]'
  );
  for (var i = 0; i < requests.length; i++) {
    if (requests[i].id === id) {
      requests[i].status = newStatus; break;
    }
  }
  localStorage.setItem('imc_withdrawals', JSON.stringify(requests));
  alert('Withdrawal ' + newStatus + '!');
  loadWithdrawalsTab();
}


// ================================================
//   ADMIN POST NEWS SYSTEM
// ================================================

function initAdminNewsForm() {
  var showBtn    = document.getElementById('showPostNewsForm');
  var cancelBtn  = document.getElementById('cancelAdminNewsForm');
  var saveBtn    = document.getElementById('saveAdminNewsBtn');
  var formEl     = document.getElementById('adminPostNewsForm');
  var imgInput   = document.getElementById('adminNewsImageFile');
  var vidInput   = document.getElementById('adminNewsVideoFile');

  if (showBtn) {
    showBtn.addEventListener('click', function () {
      if (formEl) formEl.style.display = 'block';
      this.style.display = 'none';
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      if (formEl)  formEl.style.display    = 'none';
      if (showBtn) showBtn.style.display   = 'flex';
    });
  }

  // Image preview
  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB.'); this.value = ''; return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var prev = document.getElementById('adminNewsImgPreview');
        var ph   = document.getElementById('adminNewsImgPlaceholder');
        var wrap = document.getElementById('adminNewsImgPreviewWrap');
        if (prev) prev.src = e.target.result;
        if (ph)   ph.style.display   = 'none';
        if (wrap) wrap.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  // Video preview
  if (vidInput) {
    vidInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) {
        alert('Video must be under 50MB.'); this.value = ''; return;
      }
      var url  = URL.createObjectURL(file);
      var prev = document.getElementById('adminNewsVidPreview');
      var ph   = document.getElementById('adminNewsVidPlaceholder');
      var wrap = document.getElementById('adminNewsVidPreviewWrap');
      if (prev) prev.src = url;
      if (ph)   ph.style.display   = 'none';
      if (wrap) wrap.style.display = 'block';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var title   = (document.getElementById('adminNewsTitle') || {}).value || '';
      var uni     = (document.getElementById('adminNewsUni') || {}).value || '';
      var content = (document.getElementById('adminNewsContent') || {}).value || '';
      var pinned  = (document.getElementById('adminNewsPin') || {}).value === 'yes';
      var imgFile = document.getElementById('adminNewsImageFile');
      var vidFile = document.getElementById('adminNewsVideoFile');

      title   = title.trim();
      uni     = uni.trim();
      content = content.trim();

      var errBox = document.getElementById('adminNewsError');
      var errMsg = document.getElementById('adminNewsErrorMsg');

      function showErr(msg) {
        if (errMsg) errMsg.textContent = msg;
        if (errBox) errBox.style.display = 'flex';
      }
      if (errBox) errBox.style.display = 'none';

      if (!title)   { showErr('Please enter a title.'); return; }
      if (!uni)     { showErr('Please enter university.'); return; }
      if (!content) { showErr('Please write the content.'); return; }

      function saveAdminNews(imgData, vidData) {
        var allNews = JSON.parse(
          localStorage.getItem('imc_news') || '[]'
        );
        allNews.unshift({
          id:          'NEWS-ADM-' + Date.now(),
          title:       title,
          university:  uni,
          image:       imgData || 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=300&fit=crop',
          video:       vidData || null,
          content:     content,
          authorEmail: 'admin@imc.com',
          authorName:  'IMC Editorial',
          status:      'approved',
          pinned:      pinned,
          date:        new Date().toLocaleDateString(),
          tags:        [uni]
        });
        localStorage.setItem('imc_news', JSON.stringify(allNews));
        alert('✅ News published successfully!');
        if (formEl)  formEl.style.display  = 'none';
        if (showBtn) showBtn.style.display = 'flex';
        // Clear form
        var ids = ['adminNewsTitle','adminNewsUni','adminNewsContent'];
        ids.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        removeAdminNewsUpload();
        removeAdminNewsVideoUpload();
        loadNewsAdminTab('');
        loadOverview();
      }

      var imgFileObj = imgFile ? imgFile.files[0] : null;
      var vidFileObj = vidFile ? vidFile.files[0] : null;

      if (imgFileObj) {
        var rdr = new FileReader();
        rdr.onload = function (e) {
          var imgData = e.target.result;
          if (vidFileObj) {
            var vrdr = new FileReader();
            vrdr.onload = function (ve) {
              saveAdminNews(imgData, ve.target.result);
            };
            vrdr.readAsDataURL(vidFileObj);
          } else {
            saveAdminNews(imgData, null);
          }
        };
        rdr.readAsDataURL(imgFileObj);
      } else {
        saveAdminNews(null, null);
      }
    });
  }
}

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
//   SETTINGS TAB
// ================================================

function loadSettingsTab() {
  var settings = JSON.parse(
    localStorage.getItem('imc_settings') || '{}'
  );
  var fields = {
    'settingsPlatformName': settings.platformName || 'Inside My Campus',
    'settingsEmail':        settings.email        || 'hello@insidemycampus.com',
    'settingsWhatsApp':     settings.whatsApp     || '+2348012345678',
    'settingsInstagram':    settings.instagram    || '@insidemycampus',
    'settingsTwitter':      settings.twitter      || '@insidemycampus',
    'settingsVendorFee':    settings.vendorFee    || '5000',
    'settingsAmbComm':      settings.ambComm      || '2000'
  };
  Object.keys(fields).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = fields[id];
  });

  var saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var newSettings = {
        platformName: (document.getElementById('settingsPlatformName') || {}).value || '',
        email:        (document.getElementById('settingsEmail')        || {}).value || '',
        whatsApp:     (document.getElementById('settingsWhatsApp')     || {}).value || '',
        instagram:    (document.getElementById('settingsInstagram')    || {}).value || '',
        twitter:      (document.getElementById('settingsTwitter')      || {}).value || '',
        vendorFee:    (document.getElementById('settingsVendorFee')    || {}).value || '',
        ambComm:      (document.getElementById('settingsAmbComm')      || {}).value || ''
      };
      localStorage.setItem('imc_settings', JSON.stringify(newSettings));
      var okBox = document.getElementById('settingsSuccess');
      if (okBox) {
        okBox.style.display = 'flex';
        setTimeout(function () { okBox.style.display = 'none'; }, 3000);
      }
    });
  }
}