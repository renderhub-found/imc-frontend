// ================================================
//   CAMPUS NEWS PAGE — campus-news.js
//   Connected to real backend API
// ================================================

// Cache of the currently-loaded news list, so the modal and share
// buttons don't need a second network round-trip to find an article.
var CURRENT_NEWS_LIST = [];

// ================================================
//   MAIN PAGE LOAD
// ================================================
window.addEventListener('DOMContentLoaded', function () {

  // Load all news
  loadNews();

  // Load sidebar ads
  loadSidebarAds();

  // Build university filter list
  buildUniFilterList();

  // ---- Search input ----
  document.getElementById('newsSearchInput').addEventListener(
    'input', function () {
      loadNews(this.value.trim(), document.getElementById('newsUniFilter').value);
    }
  );

  // ---- University filter ----
  document.getElementById('newsUniFilter').addEventListener(
    'change', function () {
      loadNews(
        document.getElementById('newsSearchInput').value.trim(),
        this.value
      );
    }
  );

  // ---- Clear filter ----
  document.getElementById('clearNewsFilter').addEventListener(
    'click', function () {
      document.getElementById('newsSearchInput').value = '';
      document.getElementById('newsUniFilter').value  = '';
      loadNews();
    }
  );

  // ---- Close modal ----
  document.getElementById('closeNewsModal').addEventListener(
    'click', function () {
      document.getElementById('newsModal').style.display = 'none';
      document.body.style.overflow = '';
    }
  );

  // Close modal on overlay click
  document.getElementById('newsModal').addEventListener(
    'click', function (e) {
      if (e.target === this) {
        this.style.display     = 'none';
        document.body.style.overflow = '';
      }
    }
  );

  // If someone arrived via a shared link (?id=...), open that article
  var sharedId = new URLSearchParams(window.location.search).get('id');
  if (sharedId) {
    // Wait for the initial list to load so the modal has data to show
    setTimeout(function () { openNewsModal(sharedId); }, 400);
  }

});


// ================================================
//   LOAD & RENDER NEWS
// ================================================
async function loadNews(search, university, tag) {
  search     = search || '';
  university = university || '';
  tag        = tag || '';

  var loading   = document.getElementById('newsLoading');
  var feed      = document.getElementById('newsFeed');
  var emptyBox  = document.getElementById('newsEmpty');
  var pinnedSec = document.getElementById('pinnedNewsSection');
  var pinnedList = document.getElementById('pinnedNewsList');

  if (loading) loading.style.display = 'block';
  if (emptyBox) emptyBox.style.display = 'none';

  var filters = {};
  if (search)     filters.search     = search;
  if (university) filters.university = university;

  var result = await IMC_API.getNews(filters);
  if (loading) loading.style.display = 'none';

  var allNews = (result && result.news) || [];
  CURRENT_NEWS_LIST = allNews;

  var approved = allNews; // backend already filters to status: 'approved'

  if (tag) {
    approved = approved.filter(function (n) {
      return n.tags && n.tags.some(function (t) {
        return t.toLowerCase().indexOf(tag.toLowerCase()) > -1;
      });
    });
  }

  var pinned  = approved.filter(function (n) { return n.pinned; });
  var regular = approved.filter(function (n) { return !n.pinned; });

  // Show pinned section (only when no active search/filter)
  if (pinned.length > 0 && !search && !university && !tag) {
    if (pinnedSec)  pinnedSec.style.display  = 'block';
    if (pinnedList) {
      pinnedList.innerHTML = pinned.map(function (n) {
        return renderNewsCard(n, true);
      }).join('');
    }
  } else {
    if (pinnedSec) pinnedSec.style.display = 'none';
  }

  if (regular.length === 0 && pinned.length === 0) {
    if (emptyBox) emptyBox.style.display = 'flex';
    if (feed) feed.innerHTML = '';
    return;
  }

  // Render ALL news in vertical scroll — no slider
  if (feed) {
    feed.innerHTML = regular.map(function (n) {
      return renderNewsCard(n, false);
    }).join('');
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatNewsDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ================================================
//   RENDER A SINGLE NEWS CARD
// ================================================
function renderNewsCard(news, isPinned) {
  return `
    <div class="news-card ${isPinned ? 'news-card-pinned' : ''}"
      onclick="openNewsModal('${news._id}')">
      <div class="news-card-img-wrap">
        <img src="${news.image || 'https://via.placeholder.com/600x300?text=News'}" alt="${escHtml(news.title)}"
          class="news-card-img" loading="lazy"
          onerror="this.src='https://via.placeholder.com/600x300?text=News'"/>
        ${isPinned
          ? '<span class="pinned-badge">📌 Pinned</span>'
          : ''}
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="news-uni-badge">
            <i class="fas fa-university"></i> ${escHtml(news.university)}
          </span>
          <span class="news-date">
            <i class="fas fa-calendar-alt"></i> ${formatNewsDate(news.createdAt)}
          </span>
        </div>
        <h3 class="news-card-title">${escHtml(news.title)}</h3>
        <p class="news-card-preview">
          ${escHtml(stripHtml(news.content).substring(0, 120))}...
        </p>
        <div class="news-card-footer">
          <span class="news-author">
            <i class="fas fa-user-circle"></i> ${escHtml(news.authorName)}
          </span>
          <span class="news-read-more">
            Read More <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </div>
  `;
}

// News content comes from CKEditor as HTML — strip tags for the plain-text
// preview snippet on the card (the full modal still renders the real HTML).
function stripHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}


// ================================================
//   OPEN NEWS MODAL (Full Article View)
// ================================================
function openNewsModal(newsId) {
  var news = CURRENT_NEWS_LIST.find(function (n) { return n._id === newsId; });
  if (!news) return;

  var modal   = document.getElementById('newsModal');
  var content = document.getElementById('newsModalContent');

  content.innerHTML = `
    <img src="${news.image || 'https://via.placeholder.com/600x300?text=News'}" alt="${escHtml(news.title)}"
      class="modal-news-img"
      onerror="this.src='https://via.placeholder.com/600x300?text=News'"/>
    <div class="modal-news-body">
      <div class="news-card-meta" style="margin-bottom:12px;">
        <span class="news-uni-badge">
          <i class="fas fa-university"></i> ${escHtml(news.university)}
        </span>
        <span class="news-date">
          <i class="fas fa-calendar-alt"></i> ${formatNewsDate(news.createdAt)}
        </span>
      </div>
      <h2 class="modal-news-title">${escHtml(news.title)}</h2>
      <p class="modal-news-author">
        <i class="fas fa-user-circle"></i>
        By ${escHtml(news.authorName)}
      </p>
      <div id="newsShareContainer"></div>
      <div class="modal-news-content">${news.content}</div>
      ${news.tags && news.tags.length > 0
        ? `<div class="modal-tags">
            ${news.tags.map(
              t => `<span class="news-tag">${escHtml(t)}</span>`
            ).join('')}
           </div>`
        : ''
      }
    </div>
  `;

  modal.style.display  = 'flex';
  document.body.style.overflow = 'hidden';

  // Build a link that reopens this exact article when shared
  if (typeof renderShareButtons === 'function') {
    var shareUrl = window.location.origin + window.location.pathname + '?id=' + news._id;
    document.getElementById('newsShareContainer').innerHTML =
      renderShareButtons(shareUrl, news.title);
  }

  // Reflect this article in the URL so the share link is meaningful
  window.history.replaceState(null, '', '?id=' + news._id);
}


// ================================================
//   FILTER BY TAG
// ================================================
function filterByTag(tag) {
  document.getElementById('newsSearchInput').value = '';
  document.getElementById('newsUniFilter').value   = '';
  loadNews('', '', tag);
}


// ================================================
//   BUILD UNIVERSITY FILTER LIST (Sidebar)
// ================================================
async function buildUniFilterList() {
  var universities = [
    'UNILAG','UNN','UI','DELSU','LASU',
    'OAU','UNIBEN','ABU','FUTO','UNIPORT'
  ];

  var container = document.getElementById('uniFilterList');
  if (!container) return;

  var result  = await IMC_API.getNews();
  var allNews = (result && result.news) || [];

  container.innerHTML = universities.map(function (uni) {
    var count = allNews.filter(function (n) {
      return (n.university || '').toUpperCase() === uni;
    }).length;

    return `
      <div class="uni-filter-item"
        onclick="filterByUni('${uni}')">
        <span class="uni-filter-name">${uni}</span>
        <span class="uni-filter-count">${count}</span>
      </div>
    `;
  }).join('');
}

function filterByUni(uni) {
  document.getElementById('newsUniFilter').value   = uni;
  document.getElementById('newsSearchInput').value = '';
  loadNews('', uni);
}


// ================================================
//   LOAD SIDEBAR ADS (Approved ads only)
// ================================================
async function loadSidebarAds() {
  var container = document.getElementById('sidebarAdsList');
  if (!container) return;

  var result   = await IMC_API.getAds();
  var approved = ((result && result.ads) || []).filter(function (a) {
    return a.status === 'approved';
  });

  if (approved.length === 0) {
    container.innerHTML =
      '<p style="font-size:12px;color:#aaa;">No sponsored ads yet.</p>';
    return;
  }

  // Show max 3 ads
  var toShow = approved.slice(0, 3);
  container.innerHTML = toShow.map(function (ad) {
    return `
      <div class="sidebar-ad-item">
        <img src="${ad.image || 'https://via.placeholder.com/200x100?text=Ad'}" alt="${escHtml(ad.title)}"
          class="sidebar-ad-img" loading="lazy"
          onerror="this.src='https://via.placeholder.com/200x100?text=Ad'"/>
        <div class="sidebar-ad-body">
          <p class="sidebar-ad-title">${escHtml(ad.title)}</p>
          <p class="sidebar-ad-loc">
            <i class="fas fa-map-marker-alt"></i> ${escHtml(ad.location)}
          </p>
          <a href="tel:${escHtml(ad.contact)}" class="sidebar-ad-contact">
            <i class="fas fa-phone"></i> Contact
          </a>
        </div>
      </div>
    `;
  }).join('');
}