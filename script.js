// ================================================
//   INSIDE MY CAMPUS — script.js (COMPLETE)
// ================================================

// ===== HAMBURGER DROPDOWN MENU =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
  });
}

document.addEventListener('click', function() {
  if (dropdownMenu) dropdownMenu.classList.remove('active');
});


// ===== AUTH STATE CHECK =====
function checkAuthState() {
  const loggedIn    = localStorage.getItem('imc_logged_in');
  const authButtons = document.getElementById('authButtons');
  const userMenu    = document.getElementById('userMenu');

  if (loggedIn === 'true') {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu)    userMenu.style.display = 'flex';
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu)    userMenu.style.display = 'none';
  }
}

checkAuthState();


// ===== LOGOUT =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('imc_logged_in');
    localStorage.removeItem('imc_user');
    window.location.href = 'index.html';
  });
}


// ===== VENDOR CARD SCROLL =====
const vendorCards = document.getElementById('vendorCards');
const vendorPrev  = document.getElementById('vendorPrev');
const vendorNext  = document.getElementById('vendorNext');

if (vendorNext) {
  vendorNext.addEventListener('click', function() {
    vendorCards.scrollBy({ left: 260, behavior: 'smooth' });
  });
}
if (vendorPrev) {
  vendorPrev.addEventListener('click', function() {
    vendorCards.scrollBy({ left: -260, behavior: 'smooth' });
  });
}


// ===== MOBILE NAV TOGGLE =====
const mobileNavToggle = document.getElementById('mobileNavToggle');
const navLinks        = document.getElementById('navLinks');

if (mobileNavToggle) {
  mobileNavToggle.addEventListener('click', function() {
    navLinks.classList.toggle('mobile-open');
  });
}


// ===== HERO SEARCH BAR =====
const heroSearchInput = document.getElementById('heroSearchInput');
const heroSearchBtn   = document.getElementById('heroSearchBtn');

if (heroSearchInput) {

  // Live suggestions as user types
  heroSearchInput.addEventListener('input', function() {
    const query = this.value.trim();
    if (typeof showSearchSuggestions === 'function') {
      showSearchSuggestions(query, this);
    }
  });

  // Hide suggestions when clicking away
  document.addEventListener('click', function(e) {
    if (!heroSearchInput.contains(e.target)) {
      const box = document.getElementById('searchSuggestBox');
      if (box) box.remove();
    }
  });

  // Search on ENTER key
  heroSearchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const box = document.getElementById('searchSuggestBox');
      if (box) box.remove();
      if (typeof performSearch === 'function') {
        performSearch(this.value.trim());
      }
    }
  });
}

// Search on button click
if (heroSearchBtn) {
  heroSearchBtn.addEventListener('click', function() {
    const box = document.getElementById('searchSuggestBox');
    if (box) box.remove();
    if (heroSearchInput && typeof performSearch === 'function') {
      performSearch(heroSearchInput.value.trim());
    }
  });
}


// ===== FIND VENDORS BUTTON =====
const findVendorsBtn = document.getElementById('findVendorsBtn');
if (findVendorsBtn) {
  findVendorsBtn.addEventListener('click', function() {
    window.location.href = 'vendors-page.html';
  });
}


// ===== EXPLORE UNIVERSITIES BUTTON =====
const exploreUnisBtn = document.getElementById('exploreUnisBtn');
if (exploreUnisBtn) {
  exploreUnisBtn.addEventListener('click', function() {
    showUniversitiesModal();
  });
}


// ===== SMART BECOME A VENDOR BUTTON =====
document.querySelectorAll(
  'a[href="vendor.html"], #becomeVendorBtn'
).forEach(function(link) {
  link.addEventListener('click', function(e) {
    const loggedIn    = localStorage.getItem('imc_logged_in');
    const currentUser = JSON.parse(
      localStorage.getItem('imc_user') || 'null'
    );

    if (loggedIn && currentUser) {
      const vendors  = JSON.parse(
        localStorage.getItem('imc_vendors') || '[]'
      );
      const isVendor = vendors.find(
        v => v.email === currentUser.email
      );
      if (isVendor) {
        e.preventDefault();
        window.location.href = 'vendor-dashboard.html';
      }
    }
  });
});


// ===== UNIVERSITIES MODAL =====
function showUniversitiesModal() {

  const existing = document.getElementById('uniModal');
  if (existing) existing.remove();

  // University data
  const universities = [
    { name:'UNILAG',   full:'University of Lagos',              state:'Lagos'     },
    { name:'UNN',      full:'University of Nigeria Nsukka',     state:'Enugu'     },
    { name:'UI',       full:'University of Ibadan',             state:'Oyo'       },
    { name:'OAU',      full:'Obafemi Awolowo University',       state:'Osun'      },
    { name:'LASU',     full:'Lagos State University',           state:'Lagos'     },
    { name:'DELSU',    full:'Delta State University',           state:'Delta'     },
    { name:'UNIBEN',   full:'University of Benin',              state:'Edo'       },
    { name:'ABU',      full:'Ahmadu Bello University',          state:'Kaduna'    },
    { name:'FUTO',     full:'Federal University of Technology', state:'Imo'       },
    { name:'UNIPORT',  full:'University of Port Harcourt',      state:'Rivers'    },
    { name:'FUOYE',    full:'Federal University Oye-Ekiti',     state:'Ekiti'     },
    { name:'UNILORIN', full:'University of Ilorin',             state:'Kwara'     }
  ];

  // Count vendors per university
  const vendors = JSON.parse(
    localStorage.getItem('imc_vendors') || '[]'
  );

  const modal = document.createElement('div');
  modal.id    = 'uniModal';
  modal.className = 'news-modal-overlay';
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="news-modal-box" style="max-width:700px;">
      <button id="closeUniModal" class="news-modal-close">
        <i class="fas fa-times"></i>
      </button>
      <div style="padding:28px;">
        <h2 style="font-size:22px;font-weight:800;
          color:#1a1a2e;margin-bottom:6px;">
          🏫 Explore Universities
        </h2>
        <p style="font-size:14px;color:#888;margin-bottom:22px;">
          Find vendors and businesses at your university.
        </p>
        <div class="uni-modal-grid">
          ${universities.map(function(u) {
            const count = vendors.filter(
              v => v.university.toUpperCase() === u.name &&
                   v.status === 'approved'
            ).length;
            return `
              <div class="uni-modal-card"
                onclick="filterByUniversity('${u.name}')">
                <div class="uni-modal-icon">🏛️</div>
                <div class="uni-modal-info">
                  <h4>${u.name}</h4>
                  <p>${u.full}</p>
                  <p class="uni-modal-state">
                    <i class="fas fa-map-marker-alt"></i>
                    ${u.state} State
                  </p>
                </div>
                <div class="uni-modal-count">
                  <span>${count}</span>
                  <small>vendors</small>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  document.getElementById('closeUniModal').addEventListener(
    'click', function() {
      modal.remove();
      document.body.style.overflow = '';
    }
  );

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  });
}

function filterByUniversity(uniName) {
  // Close modal
  const modal = document.getElementById('uniModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
  // Go to vendors page with filter
  window.location.href =
    'vendors-page.html?uni=' + uniName;
}


// ===== CATEGORY ITEMS ON HOMEPAGE =====
document.querySelectorAll('.category-item').forEach(function(item) {
  item.addEventListener('click', function() {
    const text = this.querySelector('p').textContent.trim();
    const catMap = {
      'Food Vendors':    'vendors-page.html?cat=Food',
      'Phone & Gadgets': 'vendors-page.html?cat=Gadgets',
      'Fashion & Jewelry':'vendors-page.html?cat=Fashion',
      'Lodges':          'vendors-page.html?cat=Services'
    };
    const url = catMap[text] || 'vendors-page.html';
    window.location.href = url;
  });
});