document.addEventListener('DOMContentLoaded', function () {
  var currentType = '';
  var debounceTimer = null;

  var typeLabels = {
    course:         'Course',
    ebook:          'E-book',
    past_question:  'Past Question',
    lecture_note:   'Lecture Note',
    study_material: 'Study Material',
    exam_prep:      'Exam Prep'
  };

  // ---- Advanced filter toggle ----
  var advToggle  = document.getElementById('hubAdvToggle');
  var advPanel   = document.getElementById('hubAdvPanel');
  var advChevron = document.getElementById('hubAdvChevron');
  if (advToggle) {
    advToggle.addEventListener('click', function () {
      advPanel.classList.toggle('open');
      advChevron.classList.toggle('fa-chevron-down');
      advChevron.classList.toggle('fa-chevron-up');
    });
  }

  // ---- Type tabs ----
  document.querySelectorAll('.hub-type-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.hub-type-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentType = tab.getAttribute('data-type') || '';
      loadMaterials();
    });
  });

  function buildFilters() {
    var f = {};
    if (currentType) f.materialType = currentType;

    var search = getVal('hubSearchInput');
    if (search) f.search = search;

    var priceFilter = getVal('hubPriceFilter');
    if (priceFilter === 'free') f.free = 'true';
    if (priceFilter === 'paid') f.paid = 'true';

    f.sort = getVal('hubSortFilter') || 'newest';

    var uni = getVal('hubUniversity'); if (uni) f.university = uni;
    var fac = getVal('hubFaculty');    if (fac) f.faculty = fac;
    var dep = getVal('hubDepartment'); if (dep) f.department = dep;
    var lvl = getVal('hubLevel');      if (lvl) f.level = lvl;
    var cc  = getVal('hubCourseCode'); if (cc)  f.courseCode = cc;
    var sem = getVal('hubSemester');   if (sem) f.semester = sem;

    return f;
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  async function loadMaterials() {
    var loadingEl = document.getElementById('hubLoading');
    var gridEl    = document.getElementById('hubGrid');
    var emptyEl   = document.getElementById('hubEmpty');

    loadingEl.style.display = 'block';
    gridEl.innerHTML = '';
    emptyEl.style.display = 'none';

    var result = await IMC_API.getLearningMaterials(buildFilters());
    loadingEl.style.display = 'none';

    var materials = (result.success && result.materials) ? result.materials : [];

    document.getElementById('hubResultCount').textContent =
      materials.length + ' result' + (materials.length !== 1 ? 's' : '');
    document.getElementById('totalMaterialsCount').textContent = materials.length;
    document.getElementById('freeCountStat').textContent =
      materials.filter(function (m) { return m.isFree; }).length;

    if (materials.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }

    gridEl.innerHTML = materials.map(renderCard).join('');
  }

  function renderCard(m) {
    var img = m.coverImage || 'https://placehold.co/400x260/1a3c8f/ffffff?text=' + encodeURIComponent(typeLabels[m.materialType] || 'Material');
    var priceBadge = m.isFree
      ? '<span class="hub-price-badge free">FREE</span>'
      : '<span class="hub-price-badge">₦' + (m.price || 0).toLocaleString() + '</span>';

    var metaBits = [];
    if (m.university) metaBits.push(esc(m.university));
    if (m.courseCode) metaBits.push(esc(m.courseCode));
    if (m.level) metaBits.push(esc(m.level) + ' Level');

    return '<a href="material-details.html?id=' + m._id + '" class="course-card" style="text-decoration:none;color:inherit;position:relative;">' +
      '<span class="hub-material-badge">' + (typeLabels[m.materialType] || m.materialType) + '</span>' +
      priceBadge +
      '<div class="course-card-img-wrap"><img class="course-card-img" src="' + img + '" alt="' + esc(m.title) + '"/></div>' +
      '<div class="course-card-body">' +
      '<h4>' + esc(m.title) + '</h4>' +
      '<div class="hub-meta-row">' + metaBits.join(' · ') + '</div>' +
      '</div>' +
      '<div class="course-card-footer">' +
      '<span><i class="fas fa-download"></i> ' + (m.downloadCount || 0) + '</span>' +
      '<span>' + (m.isFree ? 'Download' : 'Purchase') + ' →</span>' +
      '</div>' +
      '</a>';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---- Wire up filter inputs ----
  ['hubPriceFilter', 'hubSortFilter', 'hubSemester'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', loadMaterials);
  });

  ['hubSearchInput', 'hubUniversity', 'hubFaculty', 'hubDepartment', 'hubLevel', 'hubCourseCode'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadMaterials, 400);
      });
    }
  });

  loadMaterials();
});