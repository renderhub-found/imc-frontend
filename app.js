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