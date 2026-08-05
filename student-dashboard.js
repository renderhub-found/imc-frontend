// ================================================
//   ERROR BOUNDARY — same pattern applied to the
//   Ambassador dashboard after its white-screen incident,
//   built in here from day one instead of bolted on later.
// ================================================
function showFatalError(context, err) {
  console.error('[Student Dashboard] ' + context + ':', err);
  var main = document.querySelector('.dashboard-main') || document.body;
  var banner = document.createElement('div');
  banner.style.cssText =
    'background:#fdecea;border:1px solid #f5c2c0;color:#611a15;' +
    'padding:16px 20px;border-radius:10px;margin:16px;font-family:sans-serif;';
  banner.innerHTML =
    '<strong>Something went wrong loading this page.</strong>' +
    '<p style="margin:8px 0 0;font-size:13px;">Please screenshot this and send it to support:<br>' +
    '<code style="display:block;margin-top:6px;background:#fff;padding:8px;border-radius:6px;word-break:break-all;">' +
    context + ': ' + (err && err.message ? err.message : String(err)) + '</code></p>';
  main.prepend(banner);
}

function safeRun(context, fn) {
  try { fn(); } catch (err) { showFatalError(context, err); }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

var typeLabels = {
  course: 'Course', ebook: 'E-book', past_question: 'Past Question',
  lecture_note: 'Lecture Note', study_material: 'Study Material', exam_prep: 'Exam Prep'
};

document.addEventListener('DOMContentLoaded', async function () {
  try {

    if (!IMC_API.isLoggedIn()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    var currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');
    var welcomeEl = document.getElementById('sdWelcomeName');
    if (welcomeEl && currentUser) {
      welcomeEl.textContent = currentUser.firstName || 'Student';
    }

    // ---- Tabs ----
    safeRun('Tab navigation', initTabs);

    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function () {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('sidebar-open');
      });
    }

    // ---- Logout ----
    var logoutEl = document.getElementById('sdLogout');
    if (logoutEl) {
      logoutEl.addEventListener('click', function (e) {
        e.preventDefault();
        IMC_API.logout();
      });
    }

    // ---- Load each section, independently, so one failure
    //      can't blank the rest ----
    safeRun('My Downloads', loadDownloads);
    safeRun('My Purchases', loadPurchases);
    safeRun('My Uploads',   loadUploads);
    safeRun('Upload form setup', initUploadForm);

    // ---- Deep link e.g. student-dashboard.html?tab=upload ----
    var wantedTab = new URLSearchParams(window.location.search).get('tab');
    if (wantedTab) {
      var link = document.querySelector('.sidebar-link[data-tab="' + wantedTab + '"]');
      if (link) link.click();
    }

  } catch (err) {
    showFatalError('Dashboard failed to load', err);
  }
});

// ================================================
//   TABS
// ================================================
function initTabs() {
  var links = document.querySelectorAll('.sidebar-link[data-tab]');
  var tabs  = document.querySelectorAll('.dash-tab');

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        var tabId = this.getAttribute('data-tab');
        links.forEach(function (l) { l.classList.remove('active'); });
        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var target = document.getElementById('tab-' + tabId);
        if (target) target.classList.add('active');
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('sidebar-open');
      } catch (err) {
        showFatalError('Switching tab', err);
      }
    });
  });
}

// ================================================
//   MY DOWNLOADS / PURCHASES
// ================================================
async function loadDownloads() {
  var result = await IMC_API.getMyMaterialDownloads();
  var list = document.getElementById('downloadsList');
  var materials = (result.success && result.materials) ? result.materials : [];

  if (materials.length === 0) {
    list.innerHTML = '<p style="color:#aaa;">No downloads yet. <a href="learning-hub.html">Browse the Learning Hub</a>.</p>';
    return;
  }

  list.innerHTML = materials.map(function (m) {
    return renderItemRow(m, m.fileUrl ? '<a href="' + m.fileUrl + '" target="_blank" class="btn-view-profile" style="padding:8px 16px;">Download</a>' : '');
  }).join('');
}

async function loadPurchases() {
  var result = await IMC_API.getMyMaterialPurchases();
  var list = document.getElementById('purchasesList');
  var materials = (result.success && result.materials) ? result.materials : [];

  if (materials.length === 0) {
    list.innerHTML = '<p style="color:#aaa;">No purchases yet. <a href="learning-hub.html">Browse the Learning Hub</a>.</p>';
    return;
  }

  list.innerHTML = materials.map(function (m) {
    var priceTag = '<span style="font-weight:700;color:#1a3c8f;">₦' + (m.price || 0).toLocaleString() + '</span>';
    return renderItemRow(m, priceTag + ' &nbsp; <a href="' + m.fileUrl + '" target="_blank" class="btn-view-profile" style="padding:8px 16px;">Download</a>');
  }).join('');
}

function renderItemRow(m, actionHtml) {
  var img = m.coverImage || 'https://placehold.co/100x100/1a3c8f/ffffff?text=📄';
  return '<div class="sd-item-row">' +
    '<img src="' + img + '" alt=""/>' +
    '<div class="sd-item-info">' +
    '<h4>' + esc(m.title) + '</h4>' +
    '<span>' + (typeLabels[m.materialType] || m.materialType) +
    (m.university ? ' · ' + esc(m.university) : '') +
    (m.courseCode ? ' · ' + esc(m.courseCode) : '') + '</span>' +
    '</div>' +
    actionHtml +
    '</div>';
}

// ================================================
//   MY UPLOADS
// ================================================
var uploadsCache = [];
var currentUploadFilter = '';

async function loadUploads() {
  var result = await IMC_API.getMyMaterialUploads();
  uploadsCache = (result.success && result.materials) ? result.materials : [];
  renderUploads();

  document.querySelectorAll('#uploadsFilterPills .sd-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('#uploadsFilterPills .sd-pill').forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      currentUploadFilter = pill.getAttribute('data-status') || '';
      renderUploads();
    });
  });
}

function renderUploads() {
  var list = document.getElementById('uploadsList');
  var filtered = currentUploadFilter
    ? uploadsCache.filter(function (m) { return m.status === currentUploadFilter; })
    : uploadsCache;

  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:#aaa;">Nothing here yet.</p>';
    return;
  }

  list.innerHTML = filtered.map(function (m) {
    var badgeClass = 'sd-status-' + m.status;
    var badgeText  = m.status.charAt(0).toUpperCase() + m.status.slice(1);
    var badge = '<span class="sd-status-badge ' + badgeClass + '">' + badgeText + '</span>';
    return renderItemRow(m, badge);
  }).join('');
}

// ================================================
//   SUBMIT MATERIAL FORM
// ================================================
function initUploadForm() {
  var isFreeCheckbox = document.getElementById('upIsFree');
  var pricingFields   = document.getElementById('upPricingFields');
  var pricingMode     = document.getElementById('upPricingMode');
  var fixedField       = document.getElementById('upFixedPriceField');
  var perPageFields    = document.getElementById('upPerPageFields');

  function togglePricing() {
    pricingFields.style.display = isFreeCheckbox.checked ? 'none' : 'block';
  }
  function toggleMode() {
    var auto = pricingMode.value === 'auto_per_page';
    fixedField.style.display    = auto ? 'none' : 'block';
    perPageFields.style.display = auto ? 'block' : 'none';
  }

  if (isFreeCheckbox) isFreeCheckbox.addEventListener('change', togglePricing);
  if (pricingMode)    pricingMode.addEventListener('change', toggleMode);
  togglePricing();
  toggleMode();

  var submitBtn = document.getElementById('upSubmitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async function () {
    var errBox = document.getElementById('uploadError');
    var errMsg = document.getElementById('uploadErrorMsg');
    var okBox  = document.getElementById('uploadSuccess');
    var okMsg  = document.getElementById('uploadSuccessMsg');
    errBox.style.display = 'none';
    okBox.style.display  = 'none';

    var title = document.getElementById('upTitle').value.trim();
    var description = document.getElementById('upDescription').value.trim();
    var fileInput = document.getElementById('upFile');

    if (!title || !description) {
      errMsg.textContent = 'Title and description are required.';
      errBox.style.display = 'block';
      return;
    }
    if (!fileInput.files || !fileInput.files[0]) {
      errMsg.textContent = 'Please select a file to upload.';
      errBox.style.display = 'block';
      return;
    }

    var formData = new FormData();
    formData.append('materialType', document.getElementById('upType').value);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('university', document.getElementById('upUniversity').value.trim());
    formData.append('faculty', document.getElementById('upFaculty').value.trim());
    formData.append('department', document.getElementById('upDepartment').value.trim());
    formData.append('level', document.getElementById('upLevel').value.trim());
    formData.append('courseCode', document.getElementById('upCourseCode').value.trim());
    formData.append('semester', document.getElementById('upSemester').value);
    formData.append('isFree', isFreeCheckbox.checked ? 'true' : 'false');

    if (!isFreeCheckbox.checked) {
      formData.append('pricingMode', pricingMode.value);
      if (pricingMode.value === 'auto_per_page') {
        formData.append('pageCount', document.getElementById('upPageCount').value);
        formData.append('pricePerPage', document.getElementById('upPricePerPage').value);
      } else {
        formData.append('price', document.getElementById('upPrice').value);
      }
    }

    formData.append('file', fileInput.files[0]);
    var coverInput = document.getElementById('upCoverImage');
    if (coverInput.files && coverInput.files[0]) {
      formData.append('coverImage', coverInput.files[0]);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    var result = await IMC_API.uploadMaterial(formData);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Review';

    if (result.success) {
      okMsg.textContent = result.message || 'Submitted successfully!';
      okBox.style.display = 'block';
      document.getElementById('upTitle').value = '';
      document.getElementById('upDescription').value = '';
      fileInput.value = '';
      coverInput.value = '';
      safeRun('Refresh My Uploads after submit', loadUploads);
    } else {
      errMsg.textContent = result.message || 'Submission failed.';
      errBox.style.display = 'block';
    }
  });
}