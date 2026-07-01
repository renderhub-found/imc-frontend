// ================================================
//   IMC Homepage App — app.js
// ================================================

var _carouselPos = 0;

document.addEventListener('DOMContentLoaded', function () {
  loadTrendingVendors();
  loadHomeNews();
  loadHomeMarketplace();
  loadHomeEvents();
  loadHomeAds();
});

// ================================================
//   TRENDING VENDORS
// ================================================
async function loadTrendingVendors() {
  var container = document.getElementById('vendorCards');
  if (!container) return;

  var result = await IMC_API.getVendors();
  if (!result.success || !result.vendors || !result.vendors.length) return;

  var vendors = result.vendors
    .filter(function (v) { return v.status === 'approved'; })
    .slice(0, 8);

  if (!vendors.length) return;

  // Replace sample cards with real ones
  container.innerHTML = vendors.map(function (v) {
    var pic = v.profilePicture ||
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop';
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + pic + '" alt="' + esc(v.bizName) + '" loading="lazy"/></div>' +
      '<div class="vendor-info">' +
      '<h3>' + esc(v.bizName) + '</h3>' +
      '<p class="vendor-uni"><i class="fas fa-map-marker-alt"></i> ' + esc(v.university) + '</p>' +
      (v.campusLocation ? '<p class="vendor-desc">' + esc(v.campusLocation) + '</p>' : '') +
      '<a href="vendor-profile.html?id=' + v._id + '" class="btn-view-profile">View Profile</a>' +
      '</div></div>';
  }).join('');
}

// ================================================
//   CAMPUS NEWS
// ================================================
async function loadHomeNews() {
  var container = document.getElementById('homeNewsContainer');
  if (!container) return;

  var result = await IMC_API.getNews({ status: 'approved' });
  if (!result.success || !result.news || !result.news.length) {
    container.style.display = 'none';
    return;
  }

  var items = result.news.slice(0, 5);

  container.innerHTML = items.map(function (n) {
    var img = n.image ||
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=240&fit=crop';
    var preview = (n.content || '').replace(/<[^>]*>/g, '').substring(0, 90) + '...';
    var date    = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB',
      { day:'2-digit', month:'short', year:'numeric' }) : '';
    return '<div class="vendor-card" style="min-width:240px;">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + esc(n.title) + '" loading="lazy"/></div>' +
      '<div class="vendor-info">' +
      '<p style="font-size:11px;color:#aaa;margin-bottom:4px;">' + date + '</p>' +
      '<h3 style="font-size:14px;">' + esc(n.title) + '</h3>' +
      '<p style="font-size:12px;color:#666;">' + esc(preview) + '</p>' +
      '<a href="campus-news.html?id=' + n._id + '" class="btn-view-profile">Read More</a>' +
      '</div></div>';
  }).join('');
}

// ================================================
//   MARKETPLACE PREVIEW
// ================================================
async function loadHomeMarketplace() {
  var section   = document.getElementById('marketplaceSection');
  var container = document.getElementById('homeMarketplaceContainer');
  if (!container) return;

  var result = await IMC_API.getAllProducts();
  if (!result.success || !result.products || !result.products.length) {
    if (section) section.style.display = 'none';
    return;
  }

  var items = result.products.slice(0, 8);

  container.innerHTML = items.map(function (p) {
    var img = p.image ||
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop';
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + esc(p.name) + '" loading="lazy"/></div>' +
      '<div class="vendor-info">' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="vendor-uni">' + esc(p.vendorName || '') + '</p>' +
      '<p style="font-weight:800;color:#2d8653;font-size:15px;">₦' + parseFloat(p.price || 0).toLocaleString() + '</p>' +
      '<button class="btn-view-profile" onclick="orderProduct(\'' + p._id + '\',\'' +
      esc(p.name).replace(/'/g,"\\'") + '\',\'' + (p.vendorWhatsApp || '') + '\')">' +
      '<i class="fab fa-whatsapp"></i> Order</button>' +
      '</div></div>';
  }).join('');

  // Add "See More" button below container
  var seeMore = document.getElementById('marketplaceSeeMore');
  if (!seeMore && section) {
    var btn = document.createElement('div');
    btn.style.cssText = 'text-align:center;margin-top:16px;';
    btn.innerHTML = '<a href="marketplace.html" class="btn-view-profile" style="display:inline-block;padding:10px 28px;">See More Products</a>';
    section.appendChild(btn);
  }
}

// ================================================
//   EVENTS
// ================================================
async function loadHomeEvents() {
  var section   = document.getElementById('eventsSection');
  var container = document.getElementById('homeEventsContainer');
  if (!container) return;

  var result = await IMC_API.getEvents({ when: 'upcoming' });
  if (!result.success || !result.events || !result.events.length) {
    if (section) section.style.display = 'none';
    return;
  }

  var items = result.events.slice(0, 4);

  container.innerHTML = items.map(function (e) {
    var img  = e.coverImage ||
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=240&fit=crop';
    var date = e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-GB',
      { day:'2-digit', month:'short', year:'numeric' }) : '';
    return '<div class="vendor-card">' +
      '<div class="vendor-img"><img src="' + img + '" alt="' + esc(e.title) + '" loading="lazy"/></div>' +
      '<div class="vendor-info">' +
      '<p style="font-size:11px;color:#aaa;margin-bottom:4px;">' + date + ' · ' + esc(e.university || '') + '</p>' +
      '<h3>' + esc(e.title) + '</h3>' +
      '<p style="font-size:12px;color:#666;">' + esc((e.description || '').substring(0, 70)) + '...</p>' +
      '<a href="event-details.html?id=' + e._id + '" class="btn-view-profile">Get Tickets</a>' +
      '</div></div>';
  }).join('');
}

// ================================================
//   SPONSORED ADS — CAROUSEL
// ================================================
async function loadHomeAds() {
  var section   = document.getElementById('adsSection');
  var container = document.getElementById('homeAdsContainer');
  if (!container) return;

  var result = await IMC_API.getAds({ status: 'approved' });
  var ads    = (result.ads || []).filter(function (a) { return a.status === 'approved'; });

  if (!ads.length) {
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = ads.map(function (a) {
    var img = a.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=240&fit=crop';
    return '<div class="sponsored-card">' +
      '<div class="sponsored-img-wrap">' +
      '<img src="' + img + '" alt="' + esc(a.title) + '" loading="lazy"/>' +
      '<span class="sponsored-badge">Sponsored</span>' +
      '</div>' +
      '<div class="sponsored-body">' +
      '<h3>' + esc(a.title) + '</h3>' +
      '<p>' + esc((a.description || '').substring(0, 80)) + '</p>' +
      '</div></div>';
  }).join('');

  // Auto-slide every 4 seconds
  setInterval(function () { moveCarousel(1); }, 4000);
}

var _carouselStep = 0;
function moveCarousel(dir) {
  var container = document.getElementById('homeAdsContainer');
  if (!container) return;
  var cards = container.querySelectorAll('.sponsored-card');
  if (!cards.length) return;
  var cardW = cards[0].offsetWidth + 16;
  var max   = Math.max(0, cards.length - 1);
  _carouselStep = Math.max(0, Math.min(max, _carouselStep + dir));
  container.style.transform = 'translateX(-' + (_carouselStep * cardW) + 'px)';
}

// ================================================
//   WHATSAPP ORDER
// ================================================
function orderProduct(productId, productName, vendorWhatsApp) {
  var currentUser  = JSON.parse(localStorage.getItem('imc_user') || 'null');
  var customerName = currentUser
    ? (currentUser.firstName + ' ' + (currentUser.lastName || '')).trim()
    : 'A customer';

  if (typeof IMC_API !== 'undefined' && IMC_API.logProductLead) {
    IMC_API.logProductLead(productId, customerName);
  }

  var message = encodeURIComponent(
    'Hi! I saw "' + productName + '" on Inside My Campus and I\'m interested. Is it still available?'
  );

  var phone = (vendorWhatsApp || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '234' + phone.substring(1);

  if (!phone) { alert('Vendor WhatsApp not available.'); return; }
  window.open('https://wa.me/' + phone + '?text=' + message, '_blank');
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}