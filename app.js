// ================================================
//   INSIDE MY CAMPUS — app.js
//   MASTER SCRIPT — Include on EVERY page
//   Fixes: navigation, routing, auth state,
//          mobile menu, dropdown, logout
// ================================================

(function () {
  'use strict';

  // ---- Run after DOM is fully loaded ----
  function init() {
    initAuthState();
    initMobileMenu();
    initDropdown();
    initLogout();
    initSmartVendorBtn();
    initCategoryClicks();
    initHeroSearch();
    initHeroButtons();
  }

  // ================================================
  //   AUTH STATE — show/hide login vs user menu
  // ================================================
  function initAuthState() {
    var loggedIn    = localStorage.getItem('imc_logged_in');
    var authButtons = document.getElementById('authButtons');
    var userMenu    = document.getElementById('userMenu');

    if (loggedIn === 'true') {
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu)    userMenu.style.display    = 'flex';
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu)    userMenu.style.display    = 'none';
    }
  }

  // ================================================
  //   MOBILE MENU
  // ================================================
  function initMobileMenu() {
    var toggle   = document.getElementById('mobileNavToggle');
    var navLinks = document.getElementById('navLinks');
    if (!toggle || !navLinks) return;

    // Remove any old listeners by cloning
    var newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    newToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      navLinks.classList.toggle('mobile-open');
      var icon = newToggle.querySelector('i');
      if (icon) {
        icon.className = navLinks.classList.contains('mobile-open')
          ? 'fas fa-times'
          : 'fas fa-bars';
      }
    });

    // Close when any nav link clicked
    var links = navLinks.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('mobile-open');
        var icon = newToggle.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) &&
          !newToggle.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
        var icon = newToggle.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
    });
  }

  // ================================================
  //   DROPDOWN MENU (hamburger for logged-in users)
  // ================================================
  function initDropdown() {
    var btn  = document.getElementById('hamburgerBtn');
    var menu = document.getElementById('dropdownMenu');
    if (!btn || !menu) return;

    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) &&
          !newBtn.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }

  // ================================================
  //   LOGOUT
  // ================================================
function initLogout() {
  var btn = document.getElementById('logoutBtn');
  if (!btn) return;

  var newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', function (e) {
    e.preventDefault();

    // Use API logout which clears token too
    if (typeof IMC_API !== 'undefined') {
      IMC_API.logout();
    } else {
      localStorage.removeItem('imc_logged_in');
      localStorage.removeItem('imc_user');
      localStorage.removeItem('imc_token');
      window.location.href = 'index.html';
    }
  });
}

  // ================================================
  //   SMART BECOME A VENDOR BUTTON
  // ================================================
  function initSmartVendorBtn() {
    var loggedIn    = localStorage.getItem('imc_logged_in');
    var currentUser = JSON.parse(
      localStorage.getItem('imc_user') || 'null'
    );
    var vendors     = JSON.parse(
      localStorage.getItem('imc_vendors') || '[]'
    );

    var targets = document.querySelectorAll(
      'a[href="vendor.html"], #becomeVendorBtn'
    );

    targets.forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (loggedIn === 'true' && currentUser) {
          var isVendor = vendors.find(function (v) {
            return v.email === currentUser.email;
          });
          if (isVendor) {
            e.preventDefault();
            window.location.href = 'vendor-dashboard.html';
          }
        }
      });
    });
  }

  // ================================================
  //   CATEGORY CLICKS (homepage)
  // ================================================
  function initCategoryClicks() {
    var items = document.querySelectorAll('.category-item');
    items.forEach(function (item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function () {
        var text   = (this.querySelector('p') || {}).textContent || '';
        var catMap = {
          'Food Vendors':     'vendors-page.html?cat=Food',
          'Phone & Gadgets':  'vendors-page.html?cat=Gadgets',
          'Fashion & Jewelry':'vendors-page.html?cat=Fashion',
          'Lodges':           'vendors-page.html?cat=Services'
        };
        window.location.href = catMap[text.trim()] || 'vendors-page.html';
      });
    });
  }

async function loadHomeNews() {
  var container = document.getElementById('homeNewsContainer');
  if (!container) return;

  var result = await IMC_API.getNews();
  if (!result.success || !result.news.length) return;

  var items = result.news.slice(0, 5);

  container.innerHTML = items.map(function (n) {
    var img = n.image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop';
    var preview = (n.content || '').substring(0, 80) + '...';
    return '<div class="vendor-card" style="min-width:240px;">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + n.title + '"/></div>' +
      '<div class="vendor-info">' +
      '<h3>' + n.title + '</h3>' +
      '<p>' + preview + '</p>' +
      '<a href="campus-news.html?id=' + n._id + '" class="btn-view-profile">Read More</a>' +
      '</div></div>';
  }).join('');
}

async function loadHomeMarketplace() {
  var container = document.getElementById('homeMarketplaceContainer');
  if (!container) return;

  var result = await IMC_API.getAllProducts();
  if (!result.success || !result.products.length) return;

  var items = result.products.slice(0, 8);

  container.innerHTML = items.map(function (p) {
    var img = p.image || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(p.name);
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + p.name + '"/></div>' +
      '<div class="vendor-info">' +
      '<h3>' + p.name + '</h3>' +
      '<p>' + p.vendorName + ' · ' + p.university + '</p>' +
      '<p style="font-weight:700;color:#2d8653;">₦' + parseFloat(p.price).toLocaleString() + '</p>' +
      '<button class="btn-view-profile" onclick="orderProduct(\'' + p._id + '\', \'' + p.name.replace(/'/g, "\\'") + '\', \'' + p.vendorName.replace(/'/g, "\\'") + '\')">' +
      '<i class="fab fa-whatsapp"></i> Order' +
      '</button>' +
      '</div></div>';
  }).join('');
}

function orderProduct(productId, productName, vendorName) {
  var currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');
  var customerName = currentUser ? (currentUser.firstName + ' ' + currentUser.lastName) : 'A guest';

  // Log the lead so vendor gets notified
  IMC_API.logProductLead(productId, customerName);

  // Open WhatsApp — vendor's WhatsApp would need to come from product data;
  // since getAllProducts doesn't currently return vendor WhatsApp, open a generic IMC contact flow instead
  var message = encodeURIComponent(
    'Hi! I saw "' + productName + '" on Inside My Campus and I\'m interested.'
  );
  window.open('https://wa.me/?text=' + message, '_blank');
}

async function loadHomeEvents() {
  var container = document.getElementById('homeEventsContainer');
  if (!container) return;

  var result = await IMC_API.getEvents();
  if (!result.success || !result.events.length) return;

  var items = result.events.slice(0, 6);

  container.innerHTML = items.map(function (e) {
    var img = e.coverImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=250&fit=crop';
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + e.title + '"/></div>' +
      '<div class="vendor-info">' +
      '<h3>' + e.title + '</h3>' +
      '<p>' + (e.eventDate ? new Date(e.eventDate).toLocaleDateString() : '') + ' · ' + e.university + '</p>' +
      '<p>' + (e.description || '').substring(0, 60) + '...</p>' +
      '<a href="event-details.html?id=' + e._id + '" class="btn-view-profile">View Details</a>' +
      '</div></div>';
  }).join('');
}

async function loadHomeAds() {
  var container = document.getElementById('homeAdsContainer');
  if (!container) return;

  // Reuse existing ads endpoint — confirm IMC_API.getAds() exists from earlier ads system
  if (typeof IMC_API.getAds !== 'function') return;

  var result = await IMC_API.getAds();
  if (!result.success || !result.ads || !result.ads.length) return;

  var items = result.ads.filter(function (a) { return a.status === 'approved'; }).slice(0, 4);
  if (!items.length) return;

  container.innerHTML = items.map(function (a) {
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + (a.image || '') + '" alt="' + a.title + '"/></div>' +
      '<div class="vendor-info"><h3>' + a.title + '</h3><p>' + a.location + '</p></div>' +
      '</div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  loadHomeNews();
  loadHomeMarketplace();
  loadHomeEvents();
  loadHomeAds();
});

  // ================================================
  //   HERO SEARCH
  // ================================================
  function initHeroSearch() {
    var input  = document.getElementById('heroSearchInput');
    var btn    = document.getElementById('heroSearchBtn');
    if (!input) return;

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = this.value.trim();
        if (q && typeof performSearch === 'function') {
          performSearch(q);
        }
      }
      if (e.key === 'Enter') {
        var box = document.getElementById('searchSuggestBox');
        if (box) box.remove();
      }
    });

    input.addEventListener('input', function () {
      if (typeof showSearchSuggestions === 'function') {
        showSearchSuggestions(this.value.trim(), this);
      }
    });

    document.addEventListener('click', function (e) {
      if (input && !input.contains(e.target)) {
        var box = document.getElementById('searchSuggestBox');
        if (box) box.remove();
      }
    });

    if (btn) {
      btn.addEventListener('click', function () {
        var q = input.value.trim();
        if (q && typeof performSearch === 'function') {
          performSearch(q);
        }
      });
    }
  }

  // ================================================
  //   HERO BUTTONS
  // ================================================
  function initHeroButtons() {
    var findVendors = document.getElementById('findVendorsBtn');
    var exploreUnis = document.getElementById('exploreUnisBtn');

    if (findVendors) {
      findVendors.addEventListener('click', function () {
        window.location.href = 'vendors-page.html';
      });
    }

    if (exploreUnis) {
      exploreUnis.addEventListener('click', function () {
        if (typeof showUniversitiesModal === 'function') {
          showUniversitiesModal();
        }
      });
    }
  }

  // ---- Entry point ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // DOM already ready
  }

})();