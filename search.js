// ================================================
//   INSIDE MY CAMPUS — SEARCH SYSTEM (search.js)
//   Connected to real backend API
// ================================================

// ================================================
//   MAIN SEARCH FUNCTION
//   Called from the homepage search bar
// ================================================
async function performSearch(query) {
  if (!query || query.trim() === '') return;

  const q = query.trim().toLowerCase();

  // Fetch real data from the backend. All of these are public, unauthenticated
  // endpoints. Run them in parallel so search stays fast.
  const [vendorsRes, productsRes, newsRes, coursesRes, eventsRes, adsRes] =
    await Promise.all([
      IMC_API.getVendors(),
      IMC_API.getAllProducts(),
      IMC_API.getNews(),
      IMC_API.getCourses(),
      IMC_API.getEvents(),
      IMC_API.getAds()
    ]);

  const vendors  = (vendorsRes  && vendorsRes.vendors)  || [];
  const products = (productsRes && productsRes.products) || [];
  const news     = (newsRes     && newsRes.news)         || [];
  const courses  = (coursesRes  && coursesRes.courses)   || [];
  const events   = (eventsRes   && eventsRes.events)     || [];
  const ads      = (adsRes      && adsRes.ads)            || [];

  // Search each category (partial, case-insensitive keyword matching)
  const vendorResults  = searchVendors(vendors, q);
  const productResults = searchProducts(products, q);
  const newsResults    = searchNews(news, q);
  const courseResults  = searchCourses(courses, q);
  const eventResults   = searchEvents(events, q);
  const adResults      = searchAds(ads, q);

  const totalResults =
    vendorResults.length  +
    productResults.length +
    newsResults.length    +
    courseResults.length  +
    eventResults.length   +
    adResults.length;

  showSearchModal(
    query, totalResults,
    vendorResults, productResults, newsResults, courseResults, eventResults, adResults
  );
}

function has(field, q) {
  return String(field || '').toLowerCase().includes(q);
}


// ================================================
//   SEARCH: VENDORS
// ================================================
function searchVendors(vendors, q) {
  return vendors.filter(function (v) {
    return v.status === 'approved' && (
      has(v.bizName, q) || has(v.category, q) ||
      has(v.university, q) || has(v.description, q) || has(v.fullName, q)
    );
  });
}


// ================================================
//   SEARCH: PRODUCTS
// ================================================
function searchProducts(products, q) {
  return products.filter(function (p) {
    return has(p.name, q) || has(p.category, q) ||
      has(p.description, q) || has(p.university, q) || has(p.vendorName, q);
  });
}


// ================================================
//   SEARCH: NEWS
// ================================================
function searchNews(news, q) {
  return news.filter(function (n) {
    return has(n.title, q) || has(n.content, q) || has(n.university, q);
  });
}


// ================================================
//   SEARCH: COURSES
// ================================================
function searchCourses(courses, q) {
  return courses.filter(function (c) {
    return has(c.title, q) || has(c.category, q) || has(c.description, q);
  });
}


// ================================================
//   SEARCH: EVENTS
// ================================================
function searchEvents(events, q) {
  return events.filter(function (e) {
    return has(e.title, q) || has(e.description, q) ||
      has(e.university, q) || has(e.location, q);
  });
}


// ================================================
//   SEARCH: ADS
// ================================================
function searchAds(ads, q) {
  return ads.filter(function (a) {
    return a.status === 'approved' && (
      has(a.title, q) || has(a.category, q) ||
      has(a.description, q) || has(a.location, q)
    );
  });
}


// ================================================
//   SHOW SEARCH RESULTS MODAL
// ================================================
function showSearchModal(query, total, vendors, products, news, courses, events, ads) {
  const existing = document.getElementById('searchResultsModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id    = 'searchResultsModal';
  modal.className = 'search-modal-overlay';

  modal.innerHTML = `
    <div class="search-modal-box">

      <div class="search-modal-header">
        <div class="search-modal-title">
          <i class="fas fa-search"></i>
          Results for "<strong>${escHtml(query)}</strong>"
        </div>
        <div class="search-modal-meta">
          ${total} result${total !== 1 ? 's' : ''} found
        </div>
        <button class="search-modal-close" id="closeSearchModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="search-modal-bar">
        <i class="fas fa-search" style="color:#aaa;"></i>
        <input type="text" id="searchModalInput" value="${escHtml(query)}"
          placeholder="Search again..." class="search-modal-input"/>
        <button class="search-modal-go" id="searchModalGo">Search</button>
      </div>

      <div class="search-tabs">
        <button class="search-tab active" data-section="all">All (${total})</button>
        <button class="search-tab" data-section="vendors">Vendors (${vendors.length})</button>
        <button class="search-tab" data-section="products">Products (${products.length})</button>
        <button class="search-tab" data-section="news">News (${news.length})</button>
        <button class="search-tab" data-section="courses">Courses (${courses.length})</button>
        <button class="search-tab" data-section="events">Events (${events.length})</button>
        <button class="search-tab" data-section="ads">Ads (${ads.length})</button>
      </div>

      <div class="search-results-body" id="searchResultsBody">
        ${total === 0
          ? `<div class="search-empty">
               <div style="font-size:48px;">🔍</div>
               <h3>No results found for "${escHtml(query)}"</h3>
               <p>Try searching for:</p>
               <div class="search-suggestions">
                 <span onclick="retrySearch('food')">Food</span>
                 <span onclick="retrySearch('fashion')">Fashion</span>
                 <span onclick="retrySearch('UNILAG')">UNILAG</span>
                 <span onclick="retrySearch('gadgets')">Gadgets</span>
                 <span onclick="retrySearch('hostel')">Hostel</span>
               </div>
             </div>`
          : buildResultsHTML(vendors, products, news, courses, events, ads)
        }
      </div>

    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  setTimeout(() => modal.classList.add('active'), 10);

  document.getElementById('closeSearchModal').addEventListener('click', closeSearchModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeSearchModal();
  });

  document.getElementById('searchModalGo').addEventListener('click', function () {
    const newQuery = document.getElementById('searchModalInput').value.trim();
    if (newQuery) {
      closeSearchModal();
      setTimeout(() => performSearch(newQuery), 200);
    }
  });

  document.getElementById('searchModalInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('searchModalGo').click();
  });

  document.querySelectorAll('.search-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const section = this.getAttribute('data-section');
      filterSearchResults(section, vendors, products, news, courses, events, ads);
    });
  });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


// ================================================
//   BUILD ALL RESULTS HTML
// ================================================
function buildResultsHTML(vendors, products, news, courses, events, ads) {
  let html = '';

  if (vendors.length > 0) {
    html += `
      <div class="search-section" id="section-vendors">
        <h3 class="search-section-title"><i class="fas fa-store"></i> Vendors (${vendors.length})</h3>
        <div class="search-results-grid">${vendors.map(v => vendorResultCard(v)).join('')}</div>
      </div>`;
  }

  if (products.length > 0) {
    html += `
      <div class="search-section" id="section-products">
        <h3 class="search-section-title"><i class="fas fa-box"></i> Products (${products.length})</h3>
        <div class="search-results-grid">${products.map(p => productResultCard(p)).join('')}</div>
      </div>`;
  }

  if (news.length > 0) {
    html += `
      <div class="search-section" id="section-news">
        <h3 class="search-section-title"><i class="fas fa-newspaper"></i> News (${news.length})</h3>
        <div class="search-results-list">${news.map(n => newsResultCard(n)).join('')}</div>
      </div>`;
  }

  if (courses.length > 0) {
    html += `
      <div class="search-section" id="section-courses">
        <h3 class="search-section-title"><i class="fas fa-graduation-cap"></i> Courses (${courses.length})</h3>
        <div class="search-results-grid">${courses.map(c => courseResultCard(c)).join('')}</div>
      </div>`;
  }

  if (events.length > 0) {
    html += `
      <div class="search-section" id="section-events">
        <h3 class="search-section-title"><i class="fas fa-calendar"></i> Events (${events.length})</h3>
        <div class="search-results-list">${events.map(e => eventResultCard(e)).join('')}</div>
      </div>`;
  }

  if (ads.length > 0) {
    html += `
      <div class="search-section" id="section-ads">
        <h3 class="search-section-title"><i class="fas fa-ad"></i> Ads (${ads.length})</h3>
        <div class="search-results-grid">${ads.map(a => adResultCard(a)).join('')}</div>
      </div>`;
  }

  return html;
}


// ================================================
//   RESULT CARD BUILDERS
// ================================================
function vendorResultCard(v) {
  return `
    <div class="result-card" onclick="closeSearchModal();window.location.href='vendor-profile.html?id=${v._id}'">
      <div class="result-card-img-wrap">
        <div class="result-vendor-avatar">${escHtml(v.bizName).charAt(0).toUpperCase()}</div>
      </div>
      <div class="result-card-body">
        <h4>${escHtml(v.bizName)}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${escHtml(v.category)} &nbsp;·&nbsp;
          <i class="fas fa-university"></i> ${escHtml(v.university)}
        </p>
        <p class="result-desc">${escHtml((v.description || '').substring(0, 70))}...</p>
        <a href="vendor-profile.html?id=${v._id}" class="result-link">View Store →</a>
      </div>
    </div>
  `;
}

function productResultCard(p) {
  return `
    <div class="result-card" onclick="closeSearchModal()">
      <img src="${p.image || 'https://via.placeholder.com/80x80'}" alt="${escHtml(p.name)}"
        class="result-card-img" onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${escHtml(p.name)}</h4>
        <p class="result-meta">
          <i class="fas fa-store"></i> ${escHtml(p.vendorName)} &nbsp;·&nbsp;
          <i class="fas fa-university"></i> ${escHtml(p.university)}
        </p>
        <p class="result-price">₦${parseInt(p.price || 0).toLocaleString()}</p>
        <p class="result-desc">${escHtml((p.description || '').substring(0, 60))}...</p>
      </div>
    </div>
  `;
}

function newsResultCard(n) {
  return `
    <div class="result-list-item" onclick="window.location.href='campus-news.html?id=${n._id}'">
      <img src="${n.image || 'https://via.placeholder.com/70x50'}" alt="${escHtml(n.title)}"
        class="result-list-img" onerror="this.src='https://via.placeholder.com/70x50'"/>
      <div class="result-list-body">
        <h4>${escHtml(n.title)}</h4>
        <p class="result-meta">
          <i class="fas fa-university"></i> ${escHtml(n.university)} &nbsp;·&nbsp;
          <i class="fas fa-calendar"></i> ${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
        </p>
        <p class="result-desc">${escHtml((n.content || '').substring(0, 80))}...</p>
      </div>
      <i class="fas fa-chevron-right result-arrow"></i>
    </div>
  `;
}

function courseResultCard(c) {
  return `
    <div class="result-card" onclick="window.location.href='online-courses.html?id=${c._id}'">
      <img src="${c.image || 'https://via.placeholder.com/80x80'}" alt="${escHtml(c.title)}"
        class="result-card-img" onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${escHtml(c.title)}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${escHtml(c.category)} &nbsp;·&nbsp;
          <i class="fas fa-signal"></i> ${escHtml(c.level)}
        </p>
        <p class="result-price">
          ${c.isFree ? '<span style="color:#2d8653;">FREE</span>' : '₦' + (c.price || 0).toLocaleString()}
        </p>
      </div>
    </div>
  `;
}

function eventResultCard(e) {
  return `
    <div class="result-list-item" onclick="window.location.href='events.html?id=${e._id}'">
      <img src="${e.coverImage || 'https://via.placeholder.com/70x50'}" alt="${escHtml(e.title)}"
        class="result-list-img" onerror="this.src='https://via.placeholder.com/70x50'"/>
      <div class="result-list-body">
        <h4>${escHtml(e.title)}</h4>
        <p class="result-meta">
          <i class="fas fa-university"></i> ${escHtml(e.university)} &nbsp;·&nbsp;
          <i class="fas fa-map-marker-alt"></i> ${escHtml(e.location)} &nbsp;·&nbsp;
          <i class="fas fa-calendar"></i> ${e.eventDate ? new Date(e.eventDate).toLocaleDateString() : ''}
        </p>
      </div>
      <i class="fas fa-chevron-right result-arrow"></i>
    </div>
  `;
}

function adResultCard(a) {
  return `
    <div class="result-card">
      <img src="${a.image || 'https://via.placeholder.com/80x80'}" alt="${escHtml(a.title)}"
        class="result-card-img" onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${escHtml(a.title)}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${escHtml(a.category)} &nbsp;·&nbsp;
          <i class="fas fa-map-marker-alt"></i> ${escHtml(a.location)}
        </p>
        <p class="result-desc">${escHtml((a.description || '').substring(0, 60))}...</p>
        <a href="tel:${escHtml(a.contact)}" class="result-link"><i class="fas fa-phone"></i> Call Now</a>
      </div>
    </div>
  `;
}


// ================================================
//   FILTER RESULTS BY TAB
// ================================================
function filterSearchResults(section, vendors, products, news, courses, events, ads) {
  const body = document.getElementById('searchResultsBody');

  if (section === 'all') {
    body.innerHTML = buildResultsHTML(vendors, products, news, courses, events, ads);
    return;
  }

  const map = {
    vendors:  { data: vendors,  fn: vendorResultCard,  type: 'grid', label: 'Vendors',  icon: 'fa-store'          },
    products: { data: products, fn: productResultCard, type: 'grid', label: 'Products', icon: 'fa-box'            },
    news:     { data: news,     fn: newsResultCard,    type: 'list', label: 'News',     icon: 'fa-newspaper'      },
    courses:  { data: courses,  fn: courseResultCard,  type: 'grid', label: 'Courses',  icon: 'fa-graduation-cap' },
    events:   { data: events,   fn: eventResultCard,   type: 'list', label: 'Events',   icon: 'fa-calendar'       },
    ads:      { data: ads,      fn: adResultCard,      type: 'grid', label: 'Ads',      icon: 'fa-ad'             }
  };

  const cfg = map[section];
  if (!cfg) return;

  if (cfg.data.length === 0) {
    body.innerHTML = `
      <div class="search-empty">
        <div style="font-size:40px;">📭</div>
        <p>No ${cfg.label.toLowerCase()} found.</p>
      </div>`;
    return;
  }

  const wrapClass = cfg.type === 'list' ? 'search-results-list' : 'search-results-grid';

  body.innerHTML = `
    <div class="search-section">
      <h3 class="search-section-title"><i class="fas ${cfg.icon}"></i> ${cfg.label} (${cfg.data.length})</h3>
      <div class="${wrapClass}">${cfg.data.map(item => cfg.fn(item)).join('')}</div>
    </div>`;
}


// ================================================
//   CLOSE SEARCH MODAL
// ================================================
function closeSearchModal() {
  const modal = document.getElementById('searchResultsModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}


// ================================================
//   RETRY SEARCH (from suggestion chips)
// ================================================
function retrySearch(term) {
  closeSearchModal();
  setTimeout(() => performSearch(term), 250);
}


// ================================================
//   LIVE SEARCH SUGGESTIONS (dropdown)
// ================================================
let __searchSuggestSeq = 0;

async function showSearchSuggestions(query, inputEl) {
  const existing = document.getElementById('searchSuggestBox');
  if (existing) existing.remove();

  if (!query || query.length < 2) return;

  const q = query.toLowerCase();
  const mySeq = ++__searchSuggestSeq;

  const [vendorsRes, coursesRes, newsRes] = await Promise.all([
    IMC_API.getVendors(),
    IMC_API.getCourses(),
    IMC_API.getNews()
  ]);

  // If the user kept typing while this request was in flight, drop the
  // stale result instead of showing suggestions for an old query.
  if (mySeq !== __searchSuggestSeq) return;

  const vendors = (vendorsRes && vendorsRes.vendors) || [];
  const courses = (coursesRes && coursesRes.courses) || [];
  const news    = (newsRes    && newsRes.news)       || [];

  const suggestions = [];

  vendors.filter(v => v.status === 'approved').forEach(v => {
    if (has(v.bizName, q)) {
      suggestions.push({ icon: '🏪', text: v.bizName, sub: v.category + ' · ' + v.university });
    }
    if (has(v.university, q) && !suggestions.find(s => s.text === v.university)) {
      suggestions.push({ icon: '🏫', text: v.university, sub: 'University' });
    }
  });

  courses.forEach(c => {
    if (has(c.title, q)) {
      suggestions.push({ icon: '🎓', text: c.title, sub: 'Course · ' + c.category });
    }
  });

  news.forEach(n => {
    if (has(n.title, q)) {
      suggestions.push({ icon: '📰', text: n.title, sub: 'News · ' + n.university });
    }
  });

  const categories = ['Food','Fashion','Gadgets','Beauty','Services','Printing','Barbing Salon'];
  categories.forEach(cat => {
    if (has(cat, q)) suggestions.push({ icon: '🏷️', text: cat, sub: 'Category' });
  });

  if (suggestions.length === 0) return;

  const box = document.createElement('div');
  box.id = 'searchSuggestBox';
  box.className = 'search-suggest-box';

  box.innerHTML = suggestions.slice(0, 6).map(function (s) {
    return `
      <div class="suggest-item" onclick="selectSuggestion('${escHtml(s.text)}')">
        <span class="suggest-icon">${s.icon}</span>
        <div class="suggest-text">
          <span class="suggest-main">${escHtml(s.text)}</span>
          <span class="suggest-sub">${escHtml(s.sub)}</span>
        </div>
      </div>
    `;
  }).join('');

  const searchBar = inputEl.closest('.search-bar') || inputEl.parentElement;
  searchBar.style.position = 'relative';
  searchBar.appendChild(box);
}

function selectSuggestion(text) {
  const inputs = document.querySelectorAll('.search-bar input, #heroSearchInput');
  inputs.forEach(inp => { inp.value = text; });

  const box = document.getElementById('searchSuggestBox');
  if (box) box.remove();

  performSearch(text);
}