// ================================================
//   AMBASSADOR DASHBOARD — ambassador-dashboard.js
//   Connected to real backend API
// ================================================

// Holds the logged-in ambassador's real record from the backend so
// action handlers (claim task, etc.) don't need to re-fetch it.
var CURRENT_AMBASSADOR = null;

// ================================================
//   ERROR BOUNDARY — turns a silent white screen into
//   a visible, screenshot-able error message.
// ================================================
function showFatalError(context, err) {
  console.error('[Ambassador Dashboard] ' + context + ':', err);
  var main = document.querySelector('.dashboard-main') || document.body;
  var banner = document.createElement('div');
  banner.style.cssText =
    'background:#fdecea;border:1px solid #f5c2c0;color:#611a15;' +
    'padding:16px 20px;border-radius:10px;margin:16px;font-family:sans-serif;';
  banner.innerHTML =
    '<strong>Something went wrong loading this page.</strong>' +
    '<p style="margin:8px 0 0;font-size:13px;">' +
    'Please screenshot this and send it to support:<br>' +
    '<code style="display:block;margin-top:6px;background:#fff;padding:8px;border-radius:6px;word-break:break-all;">' +
    context + ': ' + (err && err.message ? err.message : String(err)) +
    '</code></p>';
  main.prepend(banner);
}

function safeRun(context, fn) {
  try {
    fn();
  } catch (err) {
    showFatalError(context, err);
  }
}

// ================================================
//   MAIN INIT
// ================================================
document.addEventListener('DOMContentLoaded', async function () {
  try {

    // ---- Auth check ----
    // Token is the real session — not the separate imc_logged_in flag,
    // which can drift from it (see navbar.js for the general fix).
    var loggedIn    = localStorage.getItem('imc_token');
    var currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');

    if (!loggedIn || !currentUser) {
      window.location.href = 'login.html';
      return;
    }

    // ---- Get ambassador profile from backend ----
    var result = await IMC_API.getMyAmbassadorProfile();

    if (!result.success || !result.isAmbassador || !result.ambassador ||
        result.ambassador.status === 'suspended') {
      window.location.href = 'ambassador.html';
      return;
    }

    var ambassador = result.ambassador;
    CURRENT_AMBASSADOR = ambassador;

    // Welcome name
    setEl('ambWelcomeName', (ambassador.fullName || '').split(' ')[0] || 'Ambassador');

    // Stats
    var referralCount = (ambassador.referrals || []).length;
    var earnings      = ambassador.earnings || 0;
    var tasksDone     = (ambassador.tasksDone || []).length;

    setEl('statReferrals', referralCount);
    setEl('statEarnings',  '₦' + earnings.toLocaleString());
    setEl('statTasks',     tasksDone);

    // News count — best effort. The public news endpoint only returns
    // approved articles, so a pending submission won't be counted until
    // an admin approves it.
    IMC_API.getNews().then(function (newsResult) {
      var allNews = (newsResult && newsResult.news) || [];
      var newsCount = allNews.filter(function (n) {
        return n.authorEmail === ambassador.email;
      }).length;
      setEl('statNews', newsCount);
      safeRun('Performance tab', function () { renderPerformance(ambassador, newsCount); });
    }).catch(function () {
      setEl('statNews', 0);
      safeRun('Performance tab', function () { renderPerformance(ambassador, 0); });
    });

    // Referral link — points directly at vendor.html (a real static file
    // that already captures, stores, and submits the ref code) instead of
    // through the /join rewrite, which has proven unreliable in production.
    var baseUrl = window.location.origin + '/';
    var refLink = baseUrl + 'vendor?ref=' + ambassador.refCode;

    setEl('referralLinkText',     refLink);
    setEl('referralCodeDisplay',  ambassador.refCode);

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

    // ---- Render tabs — each wrapped so one failure can't blank the rest ----
    safeRun('Referrals tab',   function () { renderReferrals(ambassador); });
    safeRun('Earnings tab',    function () { renderEarnings(ambassador); });
    safeRun('Campus Tasks tab',function () { renderTasks(ambassador); });
    safeRun('My Profile tab',  function () { renderAmbProfile(ambassador); });

    // ---- Tab navigation ----
    safeRun('Tab navigation', initAmbTabs);

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
        IMC_API.logout();
      });
    }

    // ---- Submit News ----
    safeRun('Submit News setup', function () { initNewsFileUploads(); });
    safeRun('Submit News setup', function () { initNewsSubmit(ambassador); });

    // ---- Withdrawals ----
    safeRun('Withdraw tab setup', function () { initWithdrawForm(); });
    safeRun('Withdraw tab data',  function () { loadWithdrawSection(); });

  } catch (err) {
    showFatalError('Dashboard failed to load', err);
  }
}); // end DOMContentLoaded


// ================================================
//   TAB NAVIGATION
// ================================================
function initAmbTabs() {
  var sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  var allTabs       = document.querySelectorAll('.dash-tab');
  if (!sidebarLinks.length) return;

  sidebarLinks.forEach(function (link) {
    var newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);

    newLink.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        var tabId = this.getAttribute('data-tab');
        if (!tabId) return;

        document.querySelectorAll('.sidebar-link[data-tab]')
          .forEach(function (l) { l.classList.remove('active'); });
        allTabs.forEach(function (t) { t.classList.remove('active'); });

        this.classList.add('active');
        var tabEl = document.getElementById('tab-' + tabId);
        if (tabEl) tabEl.classList.add('active');

        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('sidebar-open');
      } catch (err) {
        showFatalError('Switching to "' + (this.getAttribute('data-tab') || '?') + '" tab', err);
      }
    });
  });
}


// ================================================
//   HELPERS
// ================================================
function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function formatRefDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
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

  var rows = '';
  for (var i = 0; i < referrals.length; i++) {
    var ref = referrals[i];
    rows +=
      '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (ref.vendorName || 'Vendor') + '</td>' +
      '<td>' + formatRefDate(ref.date) + '</td>' +
      '<td style="color:#2d8653;font-weight:700;">₦' + (ref.commission || 500).toLocaleString() + '</td>' +
      '</tr>';
  }

  container.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>#</th><th>Vendor</th><th>Date</th><th>Commission</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   EARNINGS TAB
// ================================================
function renderEarnings(ambassador) {
  var earnings  = ambassador.earnings || 0;
  var referrals = ambassador.referrals || [];

  var refEarned = 0;
  for (var i = 0; i < referrals.length; i++) {
    refEarned += (referrals[i].commission || 2000);
  }
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
      '<span class="earn-val" style="color:#2d8653;">₦' + earnings.toLocaleString() + '</span>' +
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
      '<td style="font-weight:700;color:#2d8653;">₦' + (referrals[i].commission || 500).toLocaleString() + '</td>' +
      '<td>' + formatRefDate(referrals[i].date) + '</td>' +
      '<td><span class="status-badge approved">✅ Earned</span></td>' +
      '</tr>';
  }

  tableEl.innerHTML =
    '<table class="data-table"><thead><tr>' +
    '<th>Source</th><th>Amount</th><th>Date</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table>';
}


// ================================================
//   TASKS TAB — admin-defined tasks, server-verified.
//   No reward is ever credited client-side; ambassadors submit
//   proof and an admin approves it before earnings change.
// ================================================
var TASKS_CACHE       = [];
var MY_SUBMISSIONS_CACHE = [];

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function renderTasks(ambassador) {
  var container = document.getElementById('tasksGrid');
  if (!container) return;

  container.innerHTML = '<div class="empty-state-card"><p>Loading tasks…</p></div>';

  var tasksResult = await IMC_API.getAmbassadorTasks();
  var subsResult  = await IMC_API.getMyTaskSubmissions();

  TASKS_CACHE          = (tasksResult.success ? tasksResult.tasks : []) || [];
  MY_SUBMISSIONS_CACHE = (subsResult.success ? subsResult.submissions : []) || [];

  if (TASKS_CACHE.length === 0) {
    container.innerHTML =
      '<div class="empty-state-card"><div style="font-size:40px;">📋</div>' +
      '<p>No tasks available yet.</p></div>';
    return;
  }

  var doneCount = MY_SUBMISSIONS_CACHE.filter(function (s) { return s.status === 'approved'; }).length;
  setEl('statTasks', doneCount);

  var html = '';

  for (var i = 0; i < TASKS_CACHE.length; i++) {
    var task = TASKS_CACHE[i];
    var submission = MY_SUBMISSIONS_CACHE.find(function (s) { return s.task && s.task._id === task._id; });

    var actionHtml;
    if (submission && submission.status === 'approved') {
      actionHtml = '<span class="status-badge approved">✅ Approved</span>';
    } else if (submission && submission.status === 'pending') {
      actionHtml = '<span class="status-badge pending">⏳ Awaiting review</span>';
    } else if (submission && submission.status === 'rejected') {
      actionHtml =
        '<span class="status-badge rejected" style="display:block;margin-bottom:6px;">❌ Rejected' +
        (submission.rejectionReason ? ': ' + esc(submission.rejectionReason) : '') + '</span>' +
        '<button class="btn-claim-task" onclick="openTaskSubmitModal(\'' + task._id + '\')">Resubmit</button>';
    } else {
      actionHtml =
        '<button class="btn-claim-task" onclick="openTaskSubmitModal(\'' + task._id + '\')">' +
        'Submit proof</button>';
    }

    html +=
      '<div class="task-card' + (submission && submission.status === 'approved' ? ' task-done' : '') + '">' +
      '<div class="task-icon">🎯</div>' +
      '<div class="task-body">' +
      '<h4>' + esc(task.title) + '</h4>' +
      '<p>' + esc(task.description) + '</p>' +
      (task.rules ? '<p style="font-size:12px;color:#888;">Rules: ' + esc(task.rules) + '</p>' : '') +
      (task.taskUrl ? '<div style="margin-top:8px;"><a href="' + esc(task.taskUrl) + '" target="_blank" class="btn-task-link">' +
        '<i class="fas fa-external-link-alt"></i> Open Task Link</a></div>' : '') +
      '<div class="task-reward"><i class="fas fa-coins" style="color:#f59f00;"></i> ' +
      'Reward: <strong>₦' + (task.rewardAmount || 0).toLocaleString() + '</strong></div>' +
      '</div>' +
      '<div class="task-action">' + actionHtml + '</div>' +
      '</div>';
  }

  container.innerHTML = html;
}

// ---- Submit proof for a task (server verifies + admin approves; no client-side reward) ----
function openTaskSubmitModal(taskId) {
  var task = TASKS_CACHE.find(function (t) { return t._id === taskId; });
  if (!task) return;

  var proof = prompt(
    (task.verificationMethod === 'link_proof'
      ? 'Paste the link proving you completed "' + task.title + '":'
      : 'Describe how you completed "' + task.title + '" (or paste a proof link):'),
    ''
  );
  if (proof === null) return;
  if (!proof.trim() && task.verificationMethod !== 'auto_referral') {
    alert('Proof is required.');
    return;
  }

  submitTaskProof(taskId, proof.trim());
}

async function submitTaskProof(taskId, proof) {
  var result = await IMC_API.submitAmbassadorTask(taskId, proof);
  if (!result.success) {
    alert(result.message || 'Could not submit task.');
    return;
  }
  alert(result.message || 'Submitted!');
  if (CURRENT_AMBASSADOR) {
    // Refresh ambassador profile in case an auto_referral task auto-approved
    var refreshed = await IMC_API.getMyAmbassadorProfile();
    if (refreshed.success && refreshed.vendor === undefined) {
      // getMyAmbassadorProfile shape varies by endpoint; re-pull earnings if present
    }
    renderTasks(CURRENT_AMBASSADOR);
    renderEarnings(CURRENT_AMBASSADOR);
  }
}

// ---- Switch to news tab ----
function switchToNewsTab() {
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(function (l) { l.classList.remove('active'); });
  document.querySelectorAll('.dash-tab').forEach(function (t) { t.classList.remove('active'); });

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
    statCard2('fas fa-users',     '#e8f5e9', '#2d8653', 'Referrals',  referrals) +
    statCard2('fas fa-coins',     '#fff8e1', '#f59f00', 'Earnings',   '₦' + earnings.toLocaleString()) +
    statCard2('fas fa-tasks',     '#e8f0fe', '#1a3c8f', 'Tasks Done', tasks) +
    statCard2('fas fa-newspaper', '#fce4ec', '#c62828', 'News',       newsCount) +
    '</div>' +
    '<div class="progress-section">' +
    '<h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:16px;">Progress to Next Rank</h3>' +
    progressBar('Referrals (' + referrals + '/5)', refPct,  '#2d8653') +
    progressBar('Tasks ('     + tasks     + '/6)', taskPct, '#1a3c8f') +
    '</div>';
}

function statCard2(icon, bg, color, label, value) {
  return '<div class="stat-card">' +
    '<div class="stat-icon" style="background:' + bg + ';">' +
    '<i class="' + icon + '" style="color:' + color + ';"></i></div>' +
    '<div><p class="stat-label">' + label + '</p>' +
    '<h3 class="stat-value">' + value + '</h3></div></div>';
}

function progressBar(label, pct, color) {
  return '<div class="progress-item">' +
    '<div class="progress-label"><span>' + label + '</span><span>' + pct + '%</span></div>' +
    '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct +
    '%;background:' + color + ';"></div></div></div>';
}


// ================================================
//   PROFILE TAB
// ================================================
function renderAmbProfile(ambassador) {
  var setVal = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('ambFullName',   ambassador.fullName);
  setVal('ambUniversity', ambassador.university);
  setVal('ambDepartment', ambassador.department);
  setVal('ambPhone',      ambassador.phone);
  setVal('ambWhatsapp',   ambassador.whatsApp);
  setVal('ambSocial',     ambassador.social);
  setVal('ambEmail',      ambassador.email);

  var picPreview = document.getElementById('ambProfilePicPreview');
  if (picPreview && ambassador.profilePicture) {
    picPreview.src = ambassador.profilePicture;
    picPreview.style.display = 'inline-block';
  }

  initAmbProfileEdit();
}

function initAmbProfileEdit() {
  var saveBtn = document.getElementById('ambProfileSaveBtn');
  var errBox  = document.getElementById('ambProfileError');
  var okBox   = document.getElementById('ambProfileSuccess');

  if (saveBtn && !saveBtn.dataset.wired) {
    saveBtn.dataset.wired = 'true';
    saveBtn.addEventListener('click', async function () {
      errBox.style.display = 'none';
      okBox.style.display  = 'none';

      var data = {
        fullName:   document.getElementById('ambFullName').value.trim(),
        university: document.getElementById('ambUniversity').value.trim(),
        department: document.getElementById('ambDepartment').value.trim(),
        phone:      document.getElementById('ambPhone').value.trim(),
        whatsApp:   document.getElementById('ambWhatsapp').value.trim(),
        social:     document.getElementById('ambSocial').value.trim()
      };

      var result = await IMC_API.updateAmbassadorProfile(data);
      if (result.success) {
        okBox.textContent = 'Profile updated!';
        okBox.style.display = 'block';
      } else {
        errBox.textContent = result.message || 'Could not update profile.';
        errBox.style.display = 'block';
      }
    });
  }

  var picFile = document.getElementById('ambProfilePicFile');
  if (picFile && !picFile.dataset.wired) {
    picFile.dataset.wired = 'true';
    picFile.addEventListener('change', async function () {
      var file = this.files[0];
      if (!file) return;

      var formData = new FormData();
      formData.append('image', file);

      var result = await IMC_API.uploadAmbassadorProfilePicture(formData);
      if (result.success) {
        var picPreview = document.getElementById('ambProfilePicPreview');
        if (picPreview) {
          picPreview.src = result.profilePicture;
          picPreview.style.display = 'inline-block';
        }
      } else {
        alert(result.message || 'Could not upload picture.');
      }
    });
  }
}

function infoItem(label, value) {
  return '<div class="profile-info-item">' +
    '<span class="profile-label">' + label + '</span>' +
    '<span class="profile-value">' + (value || '—') + '</span></div>';
}


// ================================================
//   NEWS SUBMIT (real backend, file uploads)
// ================================================
function initNewsFileUploads() {
  var imgInput = document.getElementById('ambNewsImageFile');
  var vidInput = document.getElementById('ambNewsVideoFile');

  if (imgInput) {
    imgInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); this.value = ''; return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        var prev = document.getElementById('ambNewsImagePreview');
        var ph   = document.getElementById('ambNewsImagePlaceholder');
        var wrap = document.getElementById('ambNewsImagePreviewWrap');
        if (prev) prev.src = e.target.result;
        if (ph)   ph.style.display   = 'none';
        if (wrap) wrap.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (vidInput) {
    vidInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50MB.'); this.value = ''; return; }
      var ph = document.getElementById('ambNewsVideoPlaceholder');
      if (ph) ph.textContent = '🎥 ' + file.name;
    });
  }
}

function initNewsSubmit(ambassador) {
  var submitBtn = document.getElementById('submitNewsBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async function () {
    var title      = getVal('newsTitle');
    var university = getVal('newsUniversity');
    var content    = getVal('newsContent');

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
    if (!content)     { showErr('Please write the content.'); return; }

    var formData = new FormData();
    formData.append('title', title);
    formData.append('university', university);
    formData.append('content', content);

    var imgFile = document.getElementById('ambNewsImageFile').files[0];
    var vidFile = document.getElementById('ambNewsVideoFile').files[0];
    if (imgFile) formData.append('image', imgFile);
    if (vidFile) formData.append('video', vidFile);

    submitBtn.disabled = true;
    var originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    var result = await IMC_API.submitNewsWithFiles(formData);

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    if (!result.success) {
      showErr(result.message || 'Could not submit news. Please try again.');
      return;
    }

    // Clear form
    setInputVal('newsTitle', '');
    setInputVal('newsUniversity', '');
    setInputVal('newsContent', '');
    setInputVal('ambNewsImageFile', '', true);
    setInputVal('ambNewsVideoFile', '', true);

    var imgPh = document.getElementById('ambNewsImagePlaceholder');
    var imgWrap = document.getElementById('ambNewsImagePreviewWrap');
    if (imgPh)   imgPh.style.display   = 'flex';
    if (imgWrap) imgWrap.style.display = 'none';
    var vidPh = document.getElementById('ambNewsVideoPlaceholder');
    if (vidPh) vidPh.textContent = '🎥 Upload Video';

    if (okBox) {
      okBox.style.display = 'flex';
      setTimeout(function () { okBox.style.display = 'none'; }, 4000);
    }
  });
}

function setInputVal(id, val, isFile) {
  var el = document.getElementById(id);
  if (!el) return;
  if (isFile) { try { el.value = ''; } catch (e) {} }
  else { el.value = val; }
}


// ================================================
//   WITHDRAWAL SYSTEM (real backend)
// ================================================
async function loadWithdrawSection() {
  var result = await IMC_API.getMyWithdrawals();
  if (!result.success) return;

  var balanceEl = document.getElementById('ambWithdrawBalance');
  if (balanceEl) balanceEl.textContent = '₦' + (result.earnings || 0).toLocaleString();

  var historyContainer = document.getElementById('withdrawHistoryContainer');
  if (!historyContainer) return;

  var withdrawals = result.withdrawals || [];
  if (withdrawals.length === 0) {
    historyContainer.innerHTML =
      '<div class="empty-state-card"><div style="font-size:36px;">📋</div>' +
      '<p>No withdrawal requests yet.</p></div>';
    return;
  }

  historyContainer.innerHTML = withdrawals.slice().reverse().map(function (w) {
    var color = w.status === 'paid' ? '#2d8653' : w.status === 'rejected' ? '#c62828' : '#f59f00';
    var label = w.status === 'paid' ? '✅ Paid' : w.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
    return '<div class="withdraw-history-card">' +
      '<div class="withdraw-history-info">' +
      '<h4>' + (w.bankName || '—') + ' — ' + (w.accountNum || '') + '</h4>' +
      '<p>' + (w.accountName || '') + ' · ' + formatRefDate(w.date) + '</p>' +
      '</div>' +
      '<div class="withdraw-amount">₦' + (w.amount || 0).toLocaleString() + '</div>' +
      '<span class="status-badge" style="background:' + color + '22;color:' + color + ';">' + label + '</span>' +
      '</div>';
  }).join('');
}

function initWithdrawForm() {
  var btn = document.getElementById('withdrawSubmitBtn');
  if (!btn) return;

  btn.addEventListener('click', async function () {
    var amount      = parseFloat(getVal('withdrawAmount'));
    var bankName    = getVal('withdrawBankName');
    var accountNum  = getVal('withdrawAccountNum');
    var accountName = getVal('withdrawAccountName');

    var errBox = document.getElementById('withdrawError');
    var okBox  = document.getElementById('withdrawSuccess');
    if (errBox) errBox.style.display = 'none';
    if (okBox)  okBox.style.display  = 'none';

    function showErr(msg) {
      if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
    }

    if (!amount || amount < 500)         { showErr('Minimum withdrawal is ₦500.'); return; }
    if (!bankName || !accountNum || !accountName) {
      showErr('Please fill in all bank details.'); return;
    }
    if (accountNum.length !== 10)        { showErr('Enter a valid 10-digit account number.'); return; }

    btn.disabled = true;

    var result = await IMC_API.requestWithdrawal({
      amount: amount, bankName: bankName,
      accountNum: accountNum, accountName: accountName
    });

    btn.disabled = false;

    if (result.success) {
      if (okBox) {
        okBox.textContent = result.message || 'Withdrawal request submitted!';
        okBox.style.display = 'block';
        setTimeout(function () { okBox.style.display = 'none'; }, 4000);
      }
      setInputVal('withdrawAmount', '');
      setInputVal('withdrawBankName', '');
      setInputVal('withdrawAccountNum', '');
      setInputVal('withdrawAccountName', '');
      loadWithdrawSection();
    } else {
      showErr(result.message || 'Withdrawal request failed.');
    }
  });
}