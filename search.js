// ================================================
//   INSIDE MY CAMPUS — SEARCH SYSTEM (search.js)
// ================================================

// ================================================
//   MAIN SEARCH FUNCTION
//   Called from the homepage search bar
// ================================================
function performSearch(query) {
  if (!query || query.trim() === '') return;

  const q = query.trim().toLowerCase();

  // Gather all data from localStorage
  const vendors  = JSON.parse(localStorage.getItem('imc_vendors')  || '[]');
  const products = JSON.parse(localStorage.getItem('imc_products') || '[]');
  const news     = JSON.parse(localStorage.getItem('imc_news')     || '[]');
  const courses  = JSON.parse(localStorage.getItem('imc_courses')  || '[]');
  const ads      = JSON.parse(localStorage.getItem('imc_ads')      || '[]');

  // Search each category
  const vendorResults  = searchVendors(vendors, q);
  const productResults = searchProducts(products, vendors, q);
  const newsResults    = searchNews(news, q);
  const courseResults  = searchCourses(courses, q);
  const adResults      = searchAds(ads, q);

  const totalResults =
    vendorResults.length  +
    productResults.length +
    newsResults.length    +
    courseResults.length  +
    adResults.length;

  // Show results in modal
  showSearchModal(
    query,
    totalResults,
    vendorResults,
    productResults,
    newsResults,
    courseResults,
    adResults
  );
}


// ================================================
//   SEARCH: VENDORS
// ================================================
function searchVendors(vendors, q) {
  return vendors.filter(function (v) {
    return (
      v.status === 'approved' && (
        v.bizName.toLowerCase().includes(q)      ||
        v.category.toLowerCase().includes(q)     ||
        v.university.toLowerCase().includes(q)   ||
        v.description.toLowerCase().includes(q)  ||
        v.fullName.toLowerCase().includes(q)
      )
    );
  });
}


// ================================================
//   SEARCH: PRODUCTS
// ================================================
function searchProducts(products, vendors, q) {
  return products.filter(function (p) {
    return (
      p.name.toLowerCase().includes(q)        ||
      p.category.toLowerCase().includes(q)    ||
      p.description.toLowerCase().includes(q) ||
      p.university.toLowerCase().includes(q)  ||
      p.vendorName.toLowerCase().includes(q)
    );
  });
}


// ================================================
//   SEARCH: NEWS
// ================================================
function searchNews(news, q) {
  return news.filter(function (n) {
    return (
      n.status === 'approved' && (
        n.title.toLowerCase().includes(q)      ||
        n.content.toLowerCase().includes(q)    ||
        n.university.toLowerCase().includes(q)
      )
    );
  });
}


// ================================================
//   SEARCH: COURSES
// ================================================
function searchCourses(courses, q) {
  return courses.filter(function (c) {
    return (
      c.title.toLowerCase().includes(q)       ||
      c.category.toLowerCase().includes(q)    ||
      c.description.toLowerCase().includes(q)
    );
  });
}


// ================================================
//   SEARCH: ADS
// ================================================
function searchAds(ads, q) {
  return ads.filter(function (a) {
    return (
      a.status === 'approved' && (
        a.title.toLowerCase().includes(q)       ||
        a.category.toLowerCase().includes(q)    ||
        a.description.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      )
    );
  });
}


// ================================================
//   SHOW SEARCH RESULTS MODAL
// ================================================
function showSearchModal(
  query, total,
  vendors, products, news, courses, ads
) {
  // Remove existing modal if any
  const existing = document.getElementById('searchResultsModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id    = 'searchResultsModal';
  modal.className = 'search-modal-overlay';

  modal.innerHTML = `
    <div class="search-modal-box">

      <!-- Header -->
      <div class="search-modal-header">
        <div class="search-modal-title">
          <i class="fas fa-search"></i>
          Results for "<strong>${query}</strong>"
        </div>
        <div class="search-modal-meta">
          ${total} result${total !== 1 ? 's' : ''} found
        </div>
        <button class="search-modal-close"
          id="closeSearchModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Search Again Bar -->
      <div class="search-modal-bar">
        <i class="fas fa-search" style="color:#aaa;"></i>
        <input type="text"
          id="searchModalInput"
          value="${query}"
          placeholder="Search again..."
          class="search-modal-input"/>
        <button class="search-modal-go"
          id="searchModalGo">Search</button>
      </div>

      <!-- Filter Tabs -->
      <div class="search-tabs">
        <button class="search-tab active"
          data-section="all">
          All (${total})
        </button>
        <button class="search-tab"
          data-section="vendors">
          Vendors (${vendors.length})
        </button>
        <button class="search-tab"
          data-section="products">
          Products (${products.length})
        </button>
        <button class="search-tab"
          data-section="news">
          News (${news.length})
        </button>
        <button class="search-tab"
          data-section="courses">
          Courses (${courses.length})
        </button>
        <button class="search-tab"
          data-section="ads">
          Ads (${ads.length})
        </button>
      </div>

      <!-- Results Body -->
      <div class="search-results-body" id="searchResultsBody">
        ${total === 0
          ? `<div class="search-empty">
               <div style="font-size:48px;">🔍</div>
               <h3>No results found for "${query}"</h3>
               <p>Try searching for:</p>
               <div class="search-suggestions">
                 <span onclick="retrySearch('food')">Food</span>
                 <span onclick="retrySearch('fashion')">Fashion</span>
                 <span onclick="retrySearch('UNILAG')">UNILAG</span>
                 <span onclick="retrySearch('gadgets')">Gadgets</span>
                 <span onclick="retrySearch('hostel')">Hostel</span>
               </div>
             </div>`
          : buildResultsHTML(vendors, products, news, courses, ads)
        }
      </div>

    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Animate in
  setTimeout(() => modal.classList.add('active'), 10);

  // Close button
  document.getElementById('closeSearchModal').addEventListener(
    'click', closeSearchModal
  );

  // Click outside to close
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeSearchModal();
  });

  // Search again
  document.getElementById('searchModalGo').addEventListener(
    'click', function () {
      const newQuery =
        document.getElementById('searchModalInput').value.trim();
      if (newQuery) {
        closeSearchModal();
        setTimeout(() => performSearch(newQuery), 200);
      }
    }
  );

  // Enter key in modal search
  document.getElementById('searchModalInput').addEventListener(
    'keydown', function (e) {
      if (e.key === 'Enter') {
        document.getElementById('searchModalGo').click();
      }
    }
  );

  // Tab switching
  document.querySelectorAll('.search-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.search-tab')
        .forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const section = this.getAttribute('data-section');
      filterSearchResults(
        section, vendors, products, news, courses, ads
      );
    });
  });
}


// ================================================
//   BUILD ALL RESULTS HTML
// ================================================
function buildResultsHTML(vendors, products, news, courses, ads) {
  let html = '';

  // Vendors Section
  if (vendors.length > 0) {
    html += `
      <div class="search-section" id="section-vendors">
        <h3 class="search-section-title">
          <i class="fas fa-store"></i>
          Vendors (${vendors.length})
        </h3>
        <div class="search-results-grid">
          ${vendors.map(v => vendorResultCard(v)).join('')}
        </div>
      </div>
    `;
  }

  // Products Section
  if (products.length > 0) {
    html += `
      <div class="search-section" id="section-products">
        <h3 class="search-section-title">
          <i class="fas fa-box"></i>
          Products (${products.length})
        </h3>
        <div class="search-results-grid">
          ${products.map(p => productResultCard(p)).join('')}
        </div>
      </div>
    `;
  }

  // News Section
  if (news.length > 0) {
    html += `
      <div class="search-section" id="section-news">
        <h3 class="search-section-title">
          <i class="fas fa-newspaper"></i>
          News (${news.length})
        </h3>
        <div class="search-results-list">
          ${news.map(n => newsResultCard(n)).join('')}
        </div>
      </div>
    `;
  }

  // Courses Section
  if (courses.length > 0) {
    html += `
      <div class="search-section" id="section-courses">
        <h3 class="search-section-title">
          <i class="fas fa-graduation-cap"></i>
          Courses (${courses.length})
        </h3>
        <div class="search-results-grid">
          ${courses.map(c => courseResultCard(c)).join('')}
        </div>
      </div>
    `;
  }

  // Ads Section
  if (ads.length > 0) {
    html += `
      <div class="search-section" id="section-ads">
        <h3 class="search-section-title">
          <i class="fas fa-ad"></i>
          Ads (${ads.length})
        </h3>
        <div class="search-results-grid">
          ${ads.map(a => adResultCard(a)).join('')}
        </div>
      </div>
    `;
  }

  return html;
}


// ================================================
//   RESULT CARD BUILDERS
// ================================================
function vendorResultCard(v) {
  return `
    <div class="result-card" onclick="closeSearchModal()">
      <div class="result-card-img-wrap">
        <div class="result-vendor-avatar">
          ${v.bizName.charAt(0).toUpperCase()}
        </div>
      </div>
      <div class="result-card-body">
        <h4>${v.bizName}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${v.category} &nbsp;·&nbsp;
          <i class="fas fa-university"></i> ${v.university}
        </p>
        <p class="result-desc">
          ${v.description.substring(0, 70)}...
        </p>
        <a href="vendor-dashboard.html"
          class="result-link">View Store →</a>
      </div>
    </div>
  `;
}

function productResultCard(p) {
  return `
    <div class="result-card">
      <img src="${p.image}" alt="${p.name}"
        class="result-card-img"
        onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${p.name}</h4>
        <p class="result-meta">
          <i class="fas fa-store"></i> ${p.vendorName}
          &nbsp;·&nbsp;
          <i class="fas fa-university"></i> ${p.university}
        </p>
        <p class="result-price">
          ₦${parseInt(p.price).toLocaleString()}
        </p>
        <p class="result-desc">
          ${p.description.substring(0, 60)}...
        </p>
      </div>
    </div>
  `;
}

function newsResultCard(n) {
  return `
    <div class="result-list-item"
      onclick="window.location.href='campus-news.html'">
      <img src="${n.image}" alt="${n.title}"
        class="result-list-img"
        onerror="this.src='https://via.placeholder.com/70x50'"/>
      <div class="result-list-body">
        <h4>${n.title}</h4>
        <p class="result-meta">
          <i class="fas fa-university"></i>
          ${n.university} &nbsp;·&nbsp;
          <i class="fas fa-calendar"></i> ${n.date}
        </p>
        <p class="result-desc">
          ${n.content.substring(0, 80)}...
        </p>
      </div>
      <i class="fas fa-chevron-right result-arrow"></i>
    </div>
  `;
}

function courseResultCard(c) {
  return `
    <div class="result-card"
      onclick="window.location.href='online-courses.html'">
      <img src="${c.image}" alt="${c.title}"
        class="result-card-img"
        onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${c.title}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${c.category}
          &nbsp;·&nbsp;
          <i class="fas fa-signal"></i> ${c.level}
        </p>
        <p class="result-price">
          ${c.isFree
            ? '<span style="color:#2d8653;">FREE</span>'
            : '₦' + c.price.toLocaleString()}
        </p>
      </div>
    </div>
  `;
}

function adResultCard(a) {
  return `
    <div class="result-card">
      <img src="${a.image}" alt="${a.title}"
        class="result-card-img"
        onerror="this.src='https://via.placeholder.com/80x80'"/>
      <div class="result-card-body">
        <h4>${a.title}</h4>
        <p class="result-meta">
          <i class="fas fa-tag"></i> ${a.category}
          &nbsp;·&nbsp;
          <i class="fas fa-map-marker-alt"></i> ${a.location}
        </p>
        <p class="result-desc">
          ${a.description.substring(0, 60)}...
        </p>
        <a href="tel:${a.contact}" class="result-link">
          <i class="fas fa-phone"></i> Call Now
        </a>
      </div>
    </div>
  `;
}


// ================================================
//   FILTER RESULTS BY TAB
// ================================================
function filterSearchResults(
  section, vendors, products, news, courses, ads
) {
  const body = document.getElementById('searchResultsBody');

  if (section === 'all') {
    body.innerHTML =
      buildResultsHTML(vendors, products, news, courses, ads);
    return;
  }

  const map = {
    vendors:  { data: vendors,  fn: vendorResultCard,  type: 'grid', label: 'Vendors',  icon: 'fa-store'          },
    products: { data: products, fn: productResultCard, type: 'grid', label: 'Products', icon: 'fa-box'            },
    news:     { data: news,     fn: newsResultCard,    type: 'list', label: 'News',     icon: 'fa-newspaper'      },
    courses:  { data: courses,  fn: courseResultCard,  type: 'grid', label: 'Courses',  icon: 'fa-graduation-cap' },
    ads:      { data: ads,      fn: adResultCard,      type: 'grid', label: 'Ads',      icon: 'fa-ad'             }
  };

  const cfg = map[section];
  if (!cfg) return;

  if (cfg.data.length === 0) {
    body.innerHTML = `
      <div class="search-empty">
        <div style="font-size:40px;">📭</div>
        <p>No ${cfg.label.toLowerCase()} found.</p>
      </div>
    `;
    return;
  }

  const wrapClass = cfg.type === 'list'
    ? 'search-results-list'
    : 'search-results-grid';

  body.innerHTML = `
    <div class="search-section">
      <h3 class="search-section-title">
        <i class="fas ${cfg.icon}"></i>
        ${cfg.label} (${cfg.data.length})
      </h3>
      <div class="${wrapClass}">
        ${cfg.data.map(item => cfg.fn(item)).join('')}
      </div>
    </div>
  `;
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
function showSearchSuggestions(query, inputEl) {
  const existing = document.getElementById('searchSuggestBox');
  if (existing) existing.remove();

  if (!query || query.length < 2) return;

  const q       = query.toLowerCase();
  const vendors = JSON.parse(
    localStorage.getItem('imc_vendors') || '[]'
  );
  const courses = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  const news    = JSON.parse(
    localStorage.getItem('imc_news') || '[]'
  );

  const suggestions = [];

  vendors.filter(v => v.status === 'approved').forEach(v => {
    if (v.bizName.toLowerCase().includes(q)) {
      suggestions.push({
        icon: '🏪', text: v.bizName,
        sub: v.category + ' · ' + v.university
      });
    }
    if (
      v.university.toLowerCase().includes(q) &&
      !suggestions.find(s => s.text === v.university)
    ) {
      suggestions.push({
        icon: '🏫', text: v.university,
        sub: 'University'
      });
    }
  });

  courses.forEach(c => {
    if (c.title.toLowerCase().includes(q)) {
      suggestions.push({
        icon: '🎓', text: c.title,
        sub: 'Course · ' + c.category
      });
    }
  });

  news.filter(n => n.status === 'approved').forEach(n => {
    if (n.title.toLowerCase().includes(q)) {
      suggestions.push({
        icon: '📰', text: n.title,
        sub: 'News · ' + n.university
      });
    }
  });

  // Add category suggestions
  const categories = [
    'Food','Fashion','Gadgets','Beauty',
    'Services','Printing','Barbing Salon'
  ];
  categories.forEach(cat => {
    if (cat.toLowerCase().includes(q)) {
      suggestions.push({
        icon: '🏷️', text: cat,
        sub: 'Category'
      });
    }
  });

  if (suggestions.length === 0) return;

  const box = document.createElement('div');
  box.id    = 'searchSuggestBox';
  box.className = 'search-suggest-box';

  box.innerHTML = suggestions.slice(0, 6).map(function (s) {
    return `
      <div class="suggest-item"
        onclick="selectSuggestion('${s.text}')">
        <span class="suggest-icon">${s.icon}</span>
        <div class="suggest-text">
          <span class="suggest-main">${s.text}</span>
          <span class="suggest-sub">${s.sub}</span>
        </div>
      </div>
    `;
  }).join('');

  // Position below search bar
  const rect = inputEl.getBoundingClientRect();
  const searchBar = inputEl.closest('.search-bar') ||
                    inputEl.parentElement;
  searchBar.style.position = 'relative';
  searchBar.appendChild(box);
}

function selectSuggestion(text) {
  // Put text in search input
  const inputs = document.querySelectorAll(
    '.search-bar input, #heroSearchInput'
  );
  inputs.forEach(inp => { inp.value = text; });

  // Close suggestion box
  const box = document.getElementById('searchSuggestBox');
  if (box) box.remove();

  // Run search
  performSearch(text);
}