// ================================================
//   AMBASSADOR DASHBOARD — ambassador-dashboard.js
//   FULLY FIXED — No ReferenceErrors
// ================================================

// Global tasks array — defined at top level so ALL
// functions can access it without reference errors
var AMBASSADOR_TASKS = [
  {
    id: 'T001',
    title: 'Share referral link on WhatsApp Status',
    reward: 100,
    icon: '📲',
    desc: 'Post your referral link on WhatsApp Status for 24 hours.',
    link: 'https://wa.me/?text=Join%20Inside%20My%20Campus!',
    linkLabel: 'Open WhatsApp'
  },
  {
    id: 'T002',
    title: 'Refer your first vendor',
    reward: 2000,
    icon: '🏪',
    desc: 'Get one business owner to register as a vendor.',
    link: null,
    linkLabel: null
  },
  {
    id: 'T003',
    title: 'Submit a campus news article',
    reward: 100,
    icon: '📰',
    desc: 'Submit one news article about your university.',
    link: null,
    linkLabel: 'Go to Submit News'
  },
  {
    id: 'T004',
    title: 'Get 3 vendor referrals',
    reward: 6000,
    icon: '🎯',
    desc: 'Refer 3 different vendors using your referral link.',
    link: null,
    linkLabel: null
  },
  {
    id: 'T005',
    title: 'Post about IMC on Instagram',
    reward: 300,
    icon: '📸',
    desc: 'Tag @insidemycampus in an Instagram post.',
    link: 'https://www.instagram.com/insidemycampus',
    linkLabel: 'Open Instagram'
  },
  {
    id: 'T006',
    title: 'Refer 5 vendors — Superstar Task',
    reward: 10000,
    icon: '⭐',
    desc: 'Refer 5 vendors and claim your superstar reward.',
    link: null,
    linkLabel: null
  }
];

// ================================================
//   MAIN INIT
// ================================================
document.addEventListener('DOMContentLoaded', function () {

  // Auth check
  var loggedIn    = localStorage.getItem('imc_logged_in');
  var currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );

  if (!loggedIn || !currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Find ambassador record
  var ambassadors = JSON.parse(
    localStorage.getItem('imc_ambassadors') || '[]'
  );
  var ambassador = null;
  for (var i = 0; i < ambassadors.length; i++) {
    if (ambassadors[i].email === currentUser.email) {
      ambassador = ambassadors[i];
      break;
    }
  }

  if (!ambassador) {
    window.location.href = 'ambassador.html';
    return;
  }

  // Fill welcome name
  var welcomeEl = document.getElementById('ambWelcomeName');
  if (welcomeEl) {
    welcomeEl.textContent =
      (ambassador.fullName || '').split(' ')[0] || 'Ambassador';
  }

  // Fill stats
  var referralCount = (ambassador.referrals || []).length;
  var earnings      = ambassador.earnings || 0;
  var tasksDone     = (ambassador.tasksDone || []).length;

  var allNews   = JSON.parse(localStorage.getItem('imc_news') || '[]');
  var newsCount = 0;
  for (var n = 0; n < allNews.length; n++) {
    if (allNews[n].authorEmail === ambassador.email) newsCount++;
  }

  setEl('statReferrals', referralCount);
  setEl('statEarnings',  '₦' + earnings.toLocaleString());
  setEl('statTasks',     tasksDone);
  setEl('statNews',      newsCount);

  // Referral link
  var baseUrl  = window.location.origin + '/';
  var refLink  = baseUrl + 'vendor.html?ref=' + ambassador.refCode;

  var refLinkEl = document.getElementById('referralLinkText');
  var refCodeEl = document.getElementById('referralCodeDisplay');
  if (refLinkEl) refLinkEl.textContent = refLink;
  if (refCodeEl) refCodeEl.textContent = ambassador.refCode;

  // Copy button
  var copyBtn = document.getElementById('copyReferralBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var btn = this;
      var doCopy = function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = '#2d8653';
        setTimeout(function () {
          btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
          btn.style.background = '';
        }, 2000);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(refLink).then(doCopy);
      } else {
        var el = document.createElement('textarea');
        el.value = refLink;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        doCopy();
      }
    });
  }

  // ---- Render all tab content ----
  renderReferrals(ambassador);
  renderEarnings(ambassador);
  renderTasks(ambassador);
  renderPerformance(ambassador, newsCount);
  renderAmbProfile(ambassador);
  initWithdrawal(ambassador);

  // ---- TAB NAVIGATION ---- (fixed)
  initAmbTabs();

  // ---- Mobile sidebar ----
  var sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('sidebar-open');
    });
  }

  // ---- Logout ----
  var logoutEl = document.getElementById('ambLogout');
  if (logoutEl) {
    logoutEl.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('imc_logged_in');
      localStorage.removeItem('imc_user');
      window.location.href = 'index.html';
    });
  }

  // ---- Submit News ----
  initNewsSubmit(ambassador);

  // ---- News file uploads ----
  initNewsFileUploads();

  // ---- Withdrawal ----
  // Already handled in initWithdrawal(ambassador)

}); // end DOMContentLoaded


// ================================================
//   TAB NAVIGATION — Fixed properly
// ================================================
function initAmbTabs() {
  var sidebarLinks = document.querySelectorAll(
    '.sidebar-link[data-tab]'
  );
  var allTabs = document.querySelectorAll('.dash-tab');

  if (!sidebarLinks.length) return;

  sidebarLinks.forEach(function (link) {
    // Clone to remove any old listeners
    var newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);

    newLink.addEventListener('click', function (e) {
      e.preventDefault();

      var tabId = this.getAttribute('data-tab');
      if (!tabId) return;

      // Remove active from all
      document.querySelectorAll('.sidebar-link[data-tab]')
        .forEach(function (l) { l.classList.remove('active'); });
      allTabs.forEach(function (t) {
        t.classList.remove('active');
      });

      // Activate this one
      this.classList.add('active');
      var tabEl = document.getElementById('tab-' + tabId);
      if (tabEl) tabEl.classList.add('active');

      // Close sidebar on mobile
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('sidebar-open');
    });
  });
}


// ================================================
//   HELPER: Set element text safely
// ================================================
function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}


// ================================================
//   REFERRALS TAB
// ================================================
function renderReferrals(ambassador) {
  var container = document.getElementById('referralsTable');
  if (!container) return;

  var referrals = ambassador.referrals || [];

  if (referrals.length === 0) {
    container.innerHTML =
      '<div class="empty-state-card">' +
      '<div style="font-size:40px;">🔗</div>' +
      '<p>No referrals yet. Share your link to start earning!</p>' +
      '</div>';
    return;
  }

  var vendors = JSON.parse(
    localStorage.getItem('imc_vendors') || '[]'
  );

  var rows = '';
  for (var i = 0; i < referrals.length; i++) {
    var ref    = referrals[i];
    var vendor = null;
    for (var j = 0; j < vendors.length; j++) {
      if (vendors[j].id === ref.vendorId) {
        vendor = vendors[j]; break;
      }
    }
    rows +=
      '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (vendor ? vendor.bizName : 'Unknown') + '</td>' +
      '<td>' + (vendor ? vendor.university : '—') + '</td>' +
      '<td>' + (ref.date || '—') + '</td>' +
      '<td style="color:#2d8653;font-weight:700;">₦500</td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>#</th><th>Vendor</th><th>University</th>' +
    '<th>Date</th><th>Commission</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   EARNINGS TAB
// ================================================
function renderEarnings(ambassador) {
  var earnings  = ambassador.earnings || 0;
  var referrals = ambassador.referrals || [];
  var refEarned = referrals.length * 500;
  var taskExtra = Math.max(0, earnings - refEarned);

  var summaryEl = document.getElementById('earningsSummary');
  if (summaryEl) {
    summaryEl.innerHTML =
      '<div class="earnings-big-card">' +
      '<div class="earnings-total">' +
      '<p>Total Earnings</p>' +
      '<h2>₦' + earnings.toLocaleString() + '</h2>' +
      '</div>' +
      '<div class="earnings-breakdown">' +
      '<div class="earn-item">' +
      '<span class="earn-label">Referral Commissions</span>' +
      '<span class="earn-val">₦' + refEarned.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="earn-item">' +
      '<span class="earn-label">Task Rewards</span>' +
      '<span class="earn-val">₦' + taskExtra.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="earn-item earn-total-row">' +
      '<span class="earn-label">Total</span>' +
      '<span class="earn-val" style="color:#2d8653;">₦' +
      earnings.toLocaleString() + '</span>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  var tableEl = document.getElementById('earningsTable');
  if (!tableEl) return;

  if (referrals.length === 0) {
    tableEl.innerHTML =
      '<div class="empty-state-card">' +
      '<div style="font-size:40px;">💰</div>' +
      '<p>No earnings yet. Start referring vendors!</p>' +
      '</div>';
    return;
  }

  var rows = '';
  for (var i = 0; i < referrals.length; i++) {
    rows +=
      '<tr>' +
      '<td>Vendor Referral</td>' +
      '<td style="font-weight:700;color:#2d8653;">₦500</td>' +
      '<td>' + (referrals[i].date || '—') + '</td>' +
      '<td><span class="status-badge approved">✅ Earned</span></td>' +
      '</tr>';
  }

  tableEl.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Source</th><th>Amount</th><th>Date</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   TASKS TAB — Uses AMBASSADOR_TASKS global array
// ================================================
function renderTasks(ambassador) {
  var container = document.getElementById('tasksGrid');
  if (!container) return;

  // Safety check — use global array
  var tasks = AMBASSADOR_TASKS || [];

  if (tasks.length === 0) {
    container.innerHTML =
      '<div class="empty-state-card">' +
      '<div style="font-size:40px;">📋</div>' +
      '<p>No tasks available yet.</p>' +
      '</div>';
    return;
  }

  var doneTasks    = ambassador.tasksDone || [];
  var refCount     = (ambassador.referrals || []).length;
  var visitedTasks = {};
  try {
    visitedTasks = JSON.parse(
      localStorage.getItem('imc_visited_tasks') || '{}'
    );
  } catch (e) {
    visitedTasks = {};
  }

  var html = '';

  for (var i = 0; i < tasks.length; i++) {
    var task    = tasks[i];
    var isDone  = doneTasks.indexOf(task.id) !== -1;
    var visited = visitedTasks[task.id] || false;

    // Determine if task can be claimed
    var canClaim = false;
    if (task.id === 'T002' && refCount >= 1) canClaim = true;
    if (task.id === 'T004' && refCount >= 3) canClaim = true;
    if (task.id === 'T006' && refCount >= 5) canClaim = true;
    if (task.id === 'T003') canClaim = true;
    if ((task.id === 'T001' || task.id === 'T005') && visited) {
      canClaim = true;
    }

    // Link button
    var linkHtml = '';
    if (task.link) {
      linkHtml =
        '<div style="margin-top:8px;">' +
        '<a href="' + task.link + '" target="_blank" ' +
        'class="btn-task-link" ' +
        'onclick="markTaskVisited(\'' + task.id + '\')">' +
        '<i class="fas fa-external-link-alt"></i> ' +
        (task.linkLabel || 'Open Link') +
        '</a>' +
        '</div>';
    } else if (task.id === 'T003') {
      linkHtml =
        '<div style="margin-top:8px;">' +
        '<button class="btn-task-link" ' +
        'onclick="switchToNewsTab()">' +
        '<i class="fas fa-newspaper"></i> Submit News' +
        '</button>' +
        '</div>';
    }

    // Action button
    var actionHtml = '';
    if (isDone) {
      actionHtml =
        '<span class="status-badge approved">✅ Done</span>';
    } else if (canClaim) {
      actionHtml =
        '<button class="btn-claim-task" ' +
        'onclick="claimTask(\'' + task.id + '\',' +
        task.reward + ')">' +
        'Claim ₦' + task.reward.toLocaleString() +
        '</button>';
    } else if (task.link && !visited) {
      actionHtml =
        '<span class="status-badge pending" ' +
        'style="font-size:11px;white-space:nowrap;">' +
        '👆 Click link first</span>';
    } else {
      actionHtml =
        '<span class="status-badge pending">⏳ In Progress</span>';
    }

    html +=
      '<div class="task-card' + (isDone ? ' task-done' : '') + '">' +
      '<div class="task-icon">' + task.icon + '</div>' +
      '<div class="task-body">' +
      '<h4>' + task.title + '</h4>' +
      '<p>' + task.desc + '</p>' +
      '<div class="task-reward">' +
      '<i class="fas fa-coins" style="color:#f59f00;"></i> ' +
      'Reward: <strong>₦' + task.reward.toLocaleString() + '</strong>' +
      '</div>' +
      linkHtml +
      '</div>' +
      '<div class="task-action">' + actionHtml + '</div>' +
      '</div>';
  }

  container.innerHTML = html;
}


// ---- Claim task ----
function claimTask(taskId, reward) {
  var currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );
  if (!currentUser) return;

  var ambassadors = JSON.parse(
    localStorage.getItem('imc_ambassadors') || '[]'
  );
  var ambIndex = -1;
  for (var i = 0; i < ambassadors.length; i++) {
    if (ambassadors[i].email === currentUser.email) {
      ambIndex = i; break;
    }
  }
  if (ambIndex === -1) return;

  var doneTasks = ambassadors[ambIndex].tasksDone || [];
  if (doneTasks.indexOf(taskId) !== -1) {
    alert('You already claimed this reward!'); return;
  }

  doneTasks.push(taskId);
  ambassadors[ambIndex].tasksDone = doneTasks;
  ambassadors[ambIndex].earnings =
    (ambassadors[ambIndex].earnings || 0) + reward;

  localStorage.setItem(
    'imc_ambassadors', JSON.stringify(ambassadors)
  );

  setEl('statTasks',    doneTasks.length);
  setEl('statEarnings',
    '₦' + ambassadors[ambIndex].earnings.toLocaleString()
  );

  renderTasks(ambassadors[ambIndex]);
  alert('🎉 ₦' + reward.toLocaleString() + ' reward claimed!');
}

// ---- Mark task link visited ----
function markTaskVisited(taskId) {
  var visited = {};
  try {
    visited = JSON.parse(
      localStorage.getItem('imc_visited_tasks') || '{}'
    );
  } catch (e) { visited = {}; }

  visited[taskId] = true;
  localStorage.setItem(
    'imc_visited_tasks', JSON.stringify(visited)
  );

  var currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );
  if (!currentUser) return;

  var ambassadors = JSON.parse(
    localStorage.getItem('imc_ambassadors') || '[]'
  );
  for (var i = 0; i < ambassadors.length; i++) {
    if (ambassadors[i].email === currentUser.email) {
      setTimeout(function () {
        renderTasks(ambassadors[i]);
      }, 600);
      break;
    }
  }
}

// ---- Switch to news tab ----
function switchToNewsTab() {
  document.querySelectorAll('.sidebar-link[data-tab]')
    .forEach(function (l) { l.classList.remove('active'); });
  document.querySelectorAll('.dash-tab')
    .forEach(function (t) { t.classList.remove('active'); });

  var newsLink = document.querySelector('[data-tab="news"]');
  var newsTab  = document.getElementById('tab-news');
  if (newsLink) newsLink.classList.add('active');
  if (newsTab)  newsTab.classList.add('active');
}


// ================================================
//   PERFORMANCE TAB
// ================================================
function renderPerformance(ambassador, newsCount) {
  var referrals = (ambassador.referrals || []).length;
  var earnings  = ambassador.earnings || 0;
  var tasks     = (ambassador.tasksDone || []).length;
  var score     = (referrals * 30) + (tasks * 15) + (newsCount * 10);

  var rank = 'Starter 🌱';
  if (score >= 200) rank = 'Rising Star ⭐';
  if (score >= 400) rank = 'Top Performer 🏆';
  if (score >= 600) rank = 'Campus Legend 👑';

  var refPct  = Math.min(100, Math.round(referrals / 5 * 100));
  var taskPct = Math.min(100, Math.round(tasks / 6 * 100));

  var container = document.getElementById('performanceCards');
  if (!container) return;

  container.innerHTML =
    '<div class="performance-rank-card">' +
    '<div class="rank-title">Your Rank</div>' +
    '<div class="rank-value">' + rank + '</div>' +
    '<div class="rank-score">Score: ' + score + ' pts</div>' +
    '</div>' +

    '<div class="stats-grid" style="margin-top:20px;">' +
    statCard2('fas fa-users',          '#e8f5e9', '#2d8653', 'Referrals',  referrals) +
    statCard2('fas fa-coins',          '#fff8e1', '#f59f00', 'Earnings',   '₦' + earnings.toLocaleString()) +
    statCard2('fas fa-tasks',          '#e8f0fe', '#1a3c8f', 'Tasks Done', tasks) +
    statCard2('fas fa-newspaper',      '#fce4ec', '#c62828', 'News',       newsCount) +
    '</div>' +

    '<div class="progress-section">' +
    '<h3 style="font-size:15px;font-weight:700;' +
    'color:#1a1a2e;margin-bottom:16px;">Progress to Next Rank</h3>' +
    progressBar('Referrals (' + referrals + '/5)', refPct,  '#2d8653') +
    progressBar('Tasks ('     + tasks     + '/6)', taskPct, '#1a3c8f') +
    '</div>';
}

function statCard2(icon, bg, color, label, value) {
  return '<div class="stat-card">' +
    '<div class="stat-icon" style="background:' + bg + ';">' +
    '<i class="' + icon + '" style="color:' + color + ';"></i>' +
    '</div>' +
    '<div><p class="stat-label">' + label + '</p>' +
    '<h3 class="stat-value">' + value + '</h3></div>' +
    '</div>';
}

function progressBar(label, pct, color) {
  return '<div class="progress-item">' +
    '<div class="progress-label">' +
    '<span>' + label + '</span>' +
    '<span>' + pct + '%</span>' +
    '</div>' +
    '<div class="progress-bar-bg">' +
    '<div class="progress-bar-fill" style="width:' + pct +
    '%;background:' + color + ';"></div>' +
    '</div>' +
    '</div>';
}

async function loadWithdrawSection() {
  var result = await IMC_API.getMyWithdrawals();
  if (!result.success) return;

  var balanceEl = document.getElementById('ambWithdrawBalance');
  if (balanceEl) balanceEl.textContent = '₦' + (result.earnings || 0).toLocaleString();

  var historyContainer = document.getElementById('withdrawHistoryContainer');
  if (!historyContainer) return;

  var withdrawals = result.withdrawals || [];
  if (withdrawals.length === 0) {
    historyContainer.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:20px;">No withdrawal requests yet.</p>';
    return;
  }

  historyContainer.innerHTML = withdrawals.slice().reverse().map(function (w) {
    var statusClass = w.status === 'paid' ? 'approved' : w.status === 'rejected' ? 'rejected' : 'pending';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;">' +
      '<div>' +
      '<strong>₦' + (w.amount || 0).toLocaleString() + '</strong><br/>' +
      '<span style="font-size:12px;color:#888;">' + (w.bankName || '') + ' · ' + new Date(w.date).toLocaleDateString() + '</span>' +
      '</div>' +
      '<span class="status ' + statusClass + '" style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">' + w.status + '</span>' +
      '</div>';
  }).join('');
}

function initWithdrawForm() {
  var btn = document.getElementById('withdrawSubmitBtn');
  if (!btn) return;

  btn.addEventListener('click', async function () {
    var amount      = parseFloat(document.getElementById('withdrawAmount').value);
    var bankName    = document.getElementById('withdrawBankName').value.trim();
    var accountNum  = document.getElementById('withdrawAccountNum').value.trim();
    var accountName = document.getElementById('withdrawAccountName').value.trim();

    var errBox = document.getElementById('withdrawError');
    var okBox  = document.getElementById('withdrawSuccess');
    errBox.style.display = 'none';
    okBox.style.display  = 'none';

    if (!amount || amount <= 0) { errBox.textContent = 'Enter a valid amount.'; errBox.style.display = 'block'; return; }
    if (!bankName || !accountNum || !accountName) {
      errBox.textContent = 'Please fill in all bank details.';
      errBox.style.display = 'block';
      return;
    }

    var result = await IMC_API.requestWithdrawal({
      amount: amount, bankName: bankName,
      accountNum: accountNum, accountName: accountName
    });

    if (result.success) {
      okBox.textContent = 'Withdrawal request submitted!';
      okBox.style.display = 'block';
      document.getElementById('withdrawAmount').value = '';
      document.getElementById('withdrawBankName').value = '';
      document.getElementById('withdrawAccountNum').value = '';
      document.getElementById('withdrawAccountName').value = '';
      loadWithdrawSection();
    } else {
      errBox.textContent = result.message || 'Withdrawal request failed.';
      errBox.style.display = 'block';
    }
  });
}

// ================================================
//   PROFILE TAB
// ================================================
function renderAmbProfile(ambassador) {
  var container = document.getElementById('ambProfileCard');
  if (!container) return;

  container.innerHTML =
    '<div class="profile-info-grid">' +
    infoItem('Full Name',     ambassador.fullName)    +
    infoItem('Username',      '@' + ambassador.username) +
    infoItem('Email',         ambassador.email)       +
    infoItem('WhatsApp',      ambassador.whatsApp)    +
    infoItem('University',    ambassador.university)  +
    infoItem('Social Media',  ambassador.social)      +
    '<div class="profile-info-item">' +
    '<span class="profile-label">Referral Code</span>' +
    '<span class="profile-value" style="color:#2d8653;font-weight:800;">' +
    ambassador.refCode + '</span></div>' +
    infoItem('Joined', ambassador.joinedDate) +
    '<div class="profile-info-item" style="grid-column:1/-1;">' +
    '<span class="profile-label">Why I Joined</span>' +
    '<span class="profile-value">' + ambassador.reason + '</span></div>' +
    '</div>';
}

function infoItem(label, value) {
  return '<div class="profile-info-item">' +
    '<span class="profile-label">' + label + '</span>' +
    '<span class="profile-value">' + (value || '—') + '</span>' +
    '</div>';
}


// ================================================
//   NEWS SUBMIT
// ================================================
function initNewsSubmit(ambassador) {
  var submitBtn = document.getElementById('submitNewsBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', function () {
    var title      = getVal('newsTitle');
    var university = getVal('newsUniversity');
    var content    = getVal('newsContent');
    var imgFile    = document.getElementById('newsImageFile');
    var vidFile    = document.getElementById('newsVideoFile');

    var errBox = document.getElementById('newsError');
    var errMsg = document.getElementById('newsErrorMsg');
    var okBox  = document.getElementById('newsSuccess');

    function showErr(msg) {
      if (errMsg) errMsg.textContent = msg;
      if (errBox) errBox.style.display = 'flex';
      if (okBox)  okBox.style.display  = 'none';
    }

    if (errBox) errBox.style.display = 'none';
    if (okBox)  okBox.style.display  = 'none';

    if (!title)      { showErr('Please enter a title.'); return; }
    if (!university) { showErr('Please enter the university.'); return; }
    if (!content)    { showErr('Please write the content.'); return; }

    function saveNewsItem(imgData, vidData) {
      var allNews = JSON.parse(
        localStorage.getItem('imc_news') || '[]'
      );
      allNews.push({
        id:          'NEWS-' + Date.now(),
        title:       title,
        university:  university,
        image:       imgData || 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=300&fit=crop',
        video:       vidData || null,
        content:     content,
        authorEmail: ambassador.email,
        authorName:  ambassador.fullName,
        status:      'pending',
        pinned:      false,
        date:        new Date().toLocaleDateString(),
        tags:        [university]
      });
      localStorage.setItem('imc_news', JSON.stringify(allNews));

      // Clear form
      setInputVal('newsTitle',      '');
      setInputVal('newsUniversity', '');
      setInputVal('newsContent',    '');
      removeNewsUpload('image');
      removeNewsUpload('video');

      // Update stat
      var statNewsEl = document.getElementById('statNews');
      if (statNewsEl) {
        statNewsEl.textContent =
          parseInt(statNewsEl.textContent || 0) + 1;
      }

      if (okBox) {
        okBox.style.display = 'flex';
        setTimeout(function () { okBox.style.display = 'none'; }, 4000);
      }
    }

    var imgFileObj = imgFile && imgFile.files[0];
    var vidFileObj = vidFile && vidFile.files[0];

    if (imgFileObj) {
      var rdr = new FileReader();
      rdr.onload = function (e) {
        var imgData = e.target.result;
        if (vidFileObj) {
          var vrdr = new FileReader();
          vrdr.onload = function (ve) {
            saveNewsItem(imgData, ve.target.result);
          };
          vrdr.readAsDataURL(vidFileObj);
        } else {
          saveNewsItem(imgData, null);
        }
      };
      rdr.readAsDataURL(imgFileObj);
    } else {
      saveNewsItem(null, null);
    }
  });
}


// ================================================
//   NEWS FILE UPLOADS
// ================================================
function initNewsFileUploads() {
  var newsImgInput = document.getElementById('newsImageFile');
  var newsVidInput = document.getElementById('newsVideoFile');

  if (newsImgInput) {
    newsImgInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB.'); this.value = ''; return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var prev = document.getElementById('newsImagePreview');
        var ph   = document.getElementById('newsImagePlaceholder');
        var wrap = document.getElementById('newsImagePreviewWrap');
        if (prev) prev.src = e.target.result;
        if (ph)   ph.style.display   = 'none';
        if (wrap) wrap.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (newsVidInput) {
    newsVidInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) {
        alert('Video must be under 50MB.'); this.value = ''; return;
      }
      var url  = URL.createObjectURL(file);
      var prev = document.getElementById('newsVideoPreview');
      var ph   = document.getElementById('newsVideoPlaceholder');
      var wrap = document.getElementById('newsVideoPreviewWrap');
      if (prev) prev.src = url;
      if (ph)   ph.style.display   = 'none';
      if (wrap) wrap.style.display = 'block';
    });
  }
}

function removeNewsUpload(type) {
  if (type === 'image') {
    setInputVal('newsImageFile', '', true);
    var pi = document.getElementById('newsImagePreview');
    var ph = document.getElementById('newsImagePlaceholder');
    var pw = document.getElementById('newsImagePreviewWrap');
    if (pi) pi.src = '';
    if (ph) ph.style.display = 'flex';
    if (pw) pw.style.display = 'none';
  } else {
    setInputVal('newsVideoFile', '', true);
    var pv = document.getElementById('newsVideoPreview');
    var vh = document.getElementById('newsVideoPlaceholder');
    var vw = document.getElementById('newsVideoPreviewWrap');
    if (pv) pv.src = '';
    if (vh) vh.style.display = 'flex';
    if (vw) vw.style.display = 'none';
  }
}


// ================================================
//   WITHDRAWAL SYSTEM
// ================================================
function initWithdrawal(ambassador) {
  var balEl = document.getElementById('withdrawBalanceDisplay');
  if (balEl) {
    balEl.textContent = '₦' + (ambassador.earnings || 0).toLocaleString();
  }

  renderWithdrawHistory(ambassador.email);

  var submitBtn = document.getElementById('withdrawSubmitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', function () {
    var accName = getVal('withdrawAccName');
    var bank    = getVal('withdrawBank');
    var accNum  = getVal('withdrawAccNum');
    var amount  = getVal('withdrawAmount');

    var errBox = document.getElementById('withdrawError');
    var errMsg = document.getElementById('withdrawErrorMsg');
    var okBox  = document.getElementById('withdrawSuccess');

    function showErr(msg) {
      if (errMsg) errMsg.textContent = msg;
      if (errBox) errBox.style.display = 'flex';
      if (okBox)  okBox.style.display  = 'none';
    }

    if (errBox) errBox.style.display = 'none';
    if (okBox)  okBox.style.display  = 'none';

    if (!accName)                  { showErr('Enter account name.'); return; }
    if (!bank)                     { showErr('Select your bank.'); return; }
    if (!accNum || accNum.length !== 10) {
      showErr('Enter valid 10-digit account number.'); return;
    }
    if (!amount || parseInt(amount) < 500) {
      showErr('Minimum withdrawal is ₦500.'); return;
    }
    if (parseInt(amount) > (ambassador.earnings || 0)) {
      showErr('Amount exceeds available balance.'); return;
    }

    var requests = JSON.parse(
      localStorage.getItem('imc_withdrawals') || '[]'
    );
    requests.push({
      id:          'WDR-' + Date.now(),
      ambEmail:    ambassador.email,
      ambName:     ambassador.fullName,
      accountName: accName,
      bankName:    bank,
      accountNum:  accNum,
      amount:      parseInt(amount),
      status:      'pending',
      date:        new Date().toLocaleDateString()
    });
    localStorage.setItem('imc_withdrawals', JSON.stringify(requests));

    setInputVal('withdrawAccName', '');
    setInputVal('withdrawAccNum',  '');
    setInputVal('withdrawAmount',  '');
    var bankEl = document.getElementById('withdrawBank');
    if (bankEl) bankEl.value = '';

    if (okBox) {
      okBox.style.display = 'flex';
      setTimeout(function () { okBox.style.display = 'none'; }, 4000);
    }

    renderWithdrawHistory(ambassador.email);
  });
}

function renderWithdrawHistory(email) {
  var container = document.getElementById('withdrawHistoryList');
  if (!container) return;

  var all    = JSON.parse(localStorage.getItem('imc_withdrawals') || '[]');
  var myReqs = all.filter(function (r) { return r.ambEmail === email; });

  if (myReqs.length === 0) {
    container.innerHTML =
      '<div class="empty-state-card">' +
      '<div style="font-size:36px;">📋</div>' +
      '<p>No withdrawal requests yet.</p>' +
      '</div>';
    return;
  }

  container.innerHTML = myReqs.map(function (r) {
    var color = r.status === 'paid' ? '#2d8653'
      : r.status === 'rejected' ? '#c62828' : '#f59f00';
    var label = r.status === 'paid' ? '✅ Paid'
      : r.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
    return '<div class="withdraw-history-card">' +
      '<div class="withdraw-history-info">' +
      '<h4>' + r.bankName + ' — ' + r.accountNum + '</h4>' +
      '<p>' + r.accountName + ' · ' + r.date + '</p>' +
      '</div>' +
      '<div class="withdraw-amount">₦' + r.amount.toLocaleString() + '</div>' +
      '<span class="status-badge" style="background:' + color +
      '22;color:' + color + ';">' + label + '</span>' +
      '</div>';
  }).join('');
}


// ================================================
//   UTILITY HELPERS
// ================================================
function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setInputVal(id, val, isFile) {
  var el = document.getElementById(id);
  if (!el) return;
  if (isFile) { try { el.value = ''; } catch (e) {} }
  else { el.value = val; }
}