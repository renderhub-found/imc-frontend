var currentUniversity = null;

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('DOMContentLoaded', function () {
  loadUniversities();

  document.getElementById('ccBackToUnis').addEventListener('click', showUniversitiesStep);

  var debounce = null;
  ['ccFacultyFilter', 'ccDeptFilter'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(loadCommunities, 350);
    });
  });

  document.getElementById('ccRequestBtn').addEventListener('click', openCcModal);

  document.getElementById('ccSubmitBtn').addEventListener('click', submitCommunity);
});

async function loadUniversities() {
  var loading = document.getElementById('ccUniLoading');
  var grid    = document.getElementById('ccUniGrid');
  var empty   = document.getElementById('ccUniEmpty');

  var result = await IMC_API.getConnectUniversities();
  loading.style.display = 'none';

  var universities = (result.success && result.universities) ? result.universities : [];

  if (universities.length === 0) {
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = universities.map(function (u) {
    return '<div class="cc-uni-card" onclick="openUniversity(\'' + esc(u.university).replace(/'/g,"\\'") + '\')">' +
      '<div class="cc-uni-icon">🏫</div>' +
      '<div class="cc-uni-name">' + esc(u.university) + '</div>' +
      '<div class="cc-uni-count">' + u.communityCount + ' communit' + (u.communityCount !== 1 ? 'ies' : 'y') + '</div>' +
      '</div>';
  }).join('');
}

function openUniversity(uni) {
  currentUniversity = uni;
  document.getElementById('ccCurrentUni').textContent = uni;
  document.getElementById('ccStepUniversities').style.display = 'none';
  document.getElementById('ccStepCommunities').style.display = 'block';
  document.getElementById('ccFacultyFilter').value = '';
  document.getElementById('ccDeptFilter').value = '';
  loadCommunities();
}

function showUniversitiesStep() {
  document.getElementById('ccStepCommunities').style.display = 'none';
  document.getElementById('ccStepUniversities').style.display = 'block';
  currentUniversity = null;
}

var platformIcons = { WhatsApp: 'fa-whatsapp', Telegram: 'fa-telegram', Discord: 'fa-discord' };
var platformColors = { WhatsApp: '#25D366', Telegram: '#0088cc', Discord: '#5865F2' };

async function loadCommunities() {
  if (!currentUniversity) return;

  var loading = document.getElementById('ccCommLoading');
  var grid    = document.getElementById('ccCommunityGrid');
  var empty   = document.getElementById('ccCommEmpty');

  loading.style.display = 'block';
  grid.innerHTML = '';
  empty.style.display = 'none';

  var filters = { university: currentUniversity };
  var faculty = document.getElementById('ccFacultyFilter').value.trim();
  var dept    = document.getElementById('ccDeptFilter').value.trim();
  if (faculty) filters.faculty = faculty;
  if (dept)    filters.department = dept;

  var result = await IMC_API.getConnectCommunities(filters);
  loading.style.display = 'none';

  var communities = (result.success && result.communities) ? result.communities : [];

  if (communities.length === 0) {
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = communities.map(function (c) {
    var verifiedBadge = c.verified ? '<span class="cc-verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : '';
    return '<div class="cc-community-card">' +
      '<div class="cc-platform-icon ' + c.platform + '"><i class="fab ' + platformIcons[c.platform] + '"></i></div>' +
      '<h4 style="margin:0 0 4px;">' + esc(c.communityName) + '</h4>' +
      '<div style="font-size:12px;color:#888;margin-bottom:6px;">' +
      (c.faculty ? esc(c.faculty) + ' · ' : '') + (c.department ? esc(c.department) : '') +
      '</div>' +
      (c.description ? '<p style="font-size:13px;color:#555;margin-bottom:6px;">' + esc(c.description) + '</p>' : '') +
      '<div style="font-size:12px;color:#888;">👥 ' + (c.memberCount || 0) + ' members ' + verifiedBadge + '</div>' +
      '<a href="' + esc(c.groupLink) + '" target="_blank" class="cc-join-btn" style="background:' + platformColors[c.platform] + ';">' +
      'Join on ' + c.platform + '</a>' +
      '</div>';
  }).join('');
}

function openCcModal() {
  if (!IMC_API.isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }
  if (currentUniversity) document.getElementById('ccUniversity').value = currentUniversity;
  document.getElementById('ccFormError').style.display = 'none';
  document.getElementById('ccFormSuccess').style.display = 'none';
  document.getElementById('ccRequestModal').style.display = 'flex';
}

function closeCcModal() {
  document.getElementById('ccRequestModal').style.display = 'none';
}

async function submitCommunity() {
  var errBox = document.getElementById('ccFormError');
  var okBox  = document.getElementById('ccFormSuccess');
  errBox.style.display = 'none';
  okBox.style.display  = 'none';

  var data = {
    university:     document.getElementById('ccUniversity').value.trim(),
    faculty:        document.getElementById('ccFaculty').value.trim(),
    department:     document.getElementById('ccDepartment').value.trim(),
    communityName:  document.getElementById('ccCommunityName').value.trim(),
    platform:       document.getElementById('ccPlatform').value,
    groupLink:      document.getElementById('ccGroupLink').value.trim(),
    description:    document.getElementById('ccDescription').value.trim(),
    creatorName:    document.getElementById('ccCreatorName').value.trim(),
    creatorEmail:   document.getElementById('ccCreatorEmail').value.trim()
  };

  if (!data.university || !data.communityName || !data.groupLink) {
    errBox.textContent = 'University, community name, and group link are required.';
    errBox.style.display = 'block';
    return;
  }

  var btn = document.getElementById('ccSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  var result = await IMC_API.createCommunity(data);

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Review';

  if (result.success) {
    okBox.textContent = result.message || 'Submitted! An admin will review it shortly.';
    okBox.style.display = 'block';
    setTimeout(closeCcModal, 1800);
  } else {
    errBox.textContent = result.message || 'Submission failed.';
    errBox.style.display = 'block';
  }
}