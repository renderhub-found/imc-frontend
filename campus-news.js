// ================================================
//   CAMPUS NEWS PAGE — campus-news.js
// ================================================

// Seed default news if none exist yet
function seedDefaultNews() {
  const existing = JSON.parse(
    localStorage.getItem('imc_news') || '[]'
  );
  if (existing.length > 0) return;

  const defaults = [
    {
      id:          'NEWS-001',
      title:       'UNILAG Exam Timetable Released for 2024/2025',
      university:  'UNILAG',
      image:
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1' +
        '?w=600&h=300&fit=crop',
      content:
        'The University of Lagos has officially released the examination ' +
        'timetable for the 2024/2025 academic session. Students are advised ' +
        'to check the university portal for their individual schedules. ' +
        'The exams are scheduled to begin on the 15th of next month. ' +
        'All students must come with valid ID cards and matriculation numbers.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      true,
      date:        'April 27, 2024',
      tags:        ['Exams', 'UNILAG']
    },
    {
      id:          'NEWS-002',
      title:       'How to Balance Studies & Side Hustles as a Student',
      university:  'UNILAG',
      image:
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173' +
        '?w=600&h=300&fit=crop',
      content:
        'Many students struggle to balance their academic responsibilities ' +
        'with running side businesses. Here are proven tips from successful ' +
        'student entrepreneurs. First, create a strict time table and stick ' +
        'to it. Second, leverage campus platforms like Inside My Campus to ' +
        'reach customers without leaving school. Third, involve trusted ' +
        'friends in your business to share the workload.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      false,
      date:        'April 26, 2024',
      tags:        ['Business', 'Student Life']
    },
    {
      id:          'NEWS-003',
      title:       'UNN Announces New Scholarship Programme for Students',
      university:  'UNN',
      image:
        'https://images.unsplash.com/photo-1627556704302-624286467c65' +
        '?w=600&h=300&fit=crop',
      content:
        'The University of Nigeria Nsukka has announced a new scholarship ' +
        'programme sponsored by a leading Nigerian bank. Students with a ' +
        'minimum CGPA of 3.5 are eligible to apply. The scholarship covers ' +
        'tuition fees and provides a monthly stipend of ₦20,000. ' +
        'Applications close at the end of this month.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      false,
      date:        'April 25, 2024',
      tags:        ['Scholarship', 'UNN']
    },
    {
      id:          'NEWS-004',
      title:       'DELSU Beach Party — Biggest Student Event of the Year',
      university:  'DELSU',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' +
        '?w=600&h=300&fit=crop',
      content:
        'Delta State University is set to host the biggest student beach ' +
        'party of 2024 at Abraka Beach. The event promises live music, ' +
        'games, food, and lots of fun. Tickets are available at the student ' +
        'union office for ₦500. Over 2,000 students are expected to attend ' +
        'this annual event.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      false,
      date:        'April 24, 2024',
      tags:        ['Event', 'DELSU']
    },
    {
      id:          'NEWS-005',
      title:       'UI Student Wins National Tech Innovation Award',
      university:  'UI',
      image:
        'https://images.unsplash.com/photo-1531746790731-6c087fecd65a' +
        '?w=600&h=300&fit=crop',
      content:
        'A 400-level Computer Science student at the University of Ibadan ' +
        'has won the prestigious National Youth Tech Innovation Award 2024. ' +
        'The student developed an app that connects rural farmers to urban ' +
        'markets, solving a major food distribution problem in Nigeria. ' +
        'The award comes with a ₦500,000 grant to develop the project further.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      false,
      date:        'April 23, 2024',
      tags:        ['Tech', 'Achievement', 'UI']
    },
    {
      id:          'NEWS-006',
      title:       'OAU Hostel Allocation Results Out — How to Check',
      university:  'OAU',
      image:
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5' +
        '?w=600&h=300&fit=crop',
      content:
        'Obafemi Awolowo University has released the hostel allocation ' +
        'results for the 2024/2025 academic session. Students can check ' +
        'their allocation status on the OAU student portal. Students who ' +
        'did not get hostel space are advised to explore verified off-campus ' +
        'lodges listed on Inside My Campus.',
      authorEmail: 'admin@imc.com',
      authorName:  'IMC Editorial',
      status:      'approved',
      pinned:      false,
      date:        'April 22, 2024',
      tags:        ['Hostel', 'OAU']
    }
  ];

  localStorage.setItem('imc_news', JSON.stringify(defaults));
}


// ================================================
//   MAIN PAGE LOAD
// ================================================
window.addEventListener('DOMContentLoaded', function () {

  // Seed sample news
  seedDefaultNews();

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

});


// ================================================
//   LOAD & RENDER NEWS
// ================================================
function loadNews(search = '', university = '', tag = '') {

  const allNews   = JSON.parse(localStorage.getItem('imc_news') || '[]');
  const loading   = document.getElementById('newsLoading');
  const feed      = document.getElementById('newsFeed');
  const emptyBox  = document.getElementById('newsEmpty');
  const pinnedSec = document.getElementById('pinnedNewsSection');
  const pinnedList = document.getElementById('pinnedNewsList');

  // Show loading briefl
  setTimeout(function () {
  loading.style.display = 'none';

  var approved = allNews.filter(function (n) {
    return n.status === 'approved';
  });

  if (search) {
    var q = search.toLowerCase();
    approved = approved.filter(function (n) {
      return (
        n.title.toLowerCase().indexOf(q) > -1 ||
        n.content.toLowerCase().indexOf(q) > -1 ||
        n.university.toLowerCase().indexOf(q) > -1
      );
    });
  }

  if (university) {
    approved = approved.filter(function (n) {
      return (n.university || '').toUpperCase() ===
        university.toUpperCase();
    });
  }

  if (tag) {
    approved = approved.filter(function (n) {
      return n.tags && n.tags.some(function (t) {
        return t.toLowerCase().indexOf(tag.toLowerCase()) > -1;
      });
    });
  }

  var pinned  = approved.filter(function (n) { return n.pinned; });
  var regular = approved.filter(function (n) { return !n.pinned; });

  // Show pinned section
  var pinnedSec  = document.getElementById('pinnedNewsSection');
  var pinnedList = document.getElementById('pinnedNewsList');
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
    return;
  }

  // Render ALL news in vertical scroll — no slider
  if (feed) {
    feed.innerHTML = regular.map(function (n) {
      return renderNewsCard(n, false);
    }).join('');
  }

}, 300);

}

// ================================================
//   RENDER A SINGLE NEWS CARD
// ================================================
function renderNewsCard(news, isPinned) {
  return `
    <div class="news-card ${isPinned ? 'news-card-pinned' : ''}"
      onclick="openNewsModal('${news.id}')">
      <div class="news-card-img-wrap">
        <img src="${news.image}" alt="${news.title}"
          class="news-card-img"
          onerror="this.src='https://via.placeholder.com/600x300?text=News'"/>
        ${isPinned
          ? '<span class="pinned-badge">📌 Pinned</span>'
          : ''}
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="news-uni-badge">
            <i class="fas fa-university"></i> ${news.university}
          </span>
          <span class="news-date">
            <i class="fas fa-calendar-alt"></i> ${news.date}
          </span>
        </div>
        <h3 class="news-card-title">${news.title}</h3>
        <p class="news-card-preview">
          ${news.content.substring(0, 120)}...
        </p>
        <div class="news-card-footer">
          <span class="news-author">
            <i class="fas fa-user-circle"></i> ${news.authorName}
          </span>
          <span class="news-read-more">
            Read More <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    </div>
  `;
}


// ================================================
//   OPEN NEWS MODAL (Full Article View)
// ================================================
function openNewsModal(newsId) {
  const allNews = JSON.parse(localStorage.getItem('imc_news') || '[]');
  const news    = allNews.find(n => n.id === newsId);
  if (!news) return;

  const modal   = document.getElementById('newsModal');
  const content = document.getElementById('newsModalContent');

  content.innerHTML = `
    <img src="${news.image}" alt="${news.title}"
      class="modal-news-img"
      onerror="this.src='https://via.placeholder.com/600x300?text=News'"/>
    <div class="modal-news-body">
      <div class="news-card-meta" style="margin-bottom:12px;">
        <span class="news-uni-badge">
          <i class="fas fa-university"></i> ${news.university}
        </span>
        <span class="news-date">
          <i class="fas fa-calendar-alt"></i> ${news.date}
        </span>
      </div>
      <h2 class="modal-news-title">${news.title}</h2>
      <p class="modal-news-author">
        <i class="fas fa-user-circle"></i>
        By ${news.authorName}
      </p>
      <div class="modal-news-content">${news.content}</div>
      ${news.tags && news.tags.length > 0
        ? `<div class="modal-tags">
            ${news.tags.map(
              t => `<span class="news-tag">${t}</span>`
            ).join('')}
           </div>`
        : ''
      }
    </div>
  `;

  modal.style.display  = 'flex';
  document.body.style.overflow = 'hidden';
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
function buildUniFilterList() {
  const universities = [
    'UNILAG','UNN','UI','DELSU','LASU',
    'OAU','UNIBEN','ABU','FUTO','UNIPORT'
  ];

  const container = document.getElementById('uniFilterList');
  container.innerHTML = universities.map(function (uni) {
    const allNews   = JSON.parse(
      localStorage.getItem('imc_news') || '[]'
    );
    const count     = allNews.filter(
      n => n.university === uni && n.status === 'approved'
    ).length;

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
function loadSidebarAds() {
  const allAds    = JSON.parse(localStorage.getItem('imc_ads') || '[]');
  const approved  = allAds.filter(a => a.status === 'approved');
  const container = document.getElementById('sidebarAdsList');

  if (approved.length === 0) {
    container.innerHTML =
      '<p style="font-size:12px;color:#aaa;">No sponsored ads yet.</p>';
    return;
  }

  // Show max 3 ads
  const toShow = approved.slice(0, 3);
  container.innerHTML = toShow.map(function (ad) {
    return `
      <div class="sidebar-ad-item">
        <img src="${ad.image}" alt="${ad.title}"
          class="sidebar-ad-img"
          onerror="this.src='https://via.placeholder.com/200x100?text=Ad'"/>
        <div class="sidebar-ad-body">
          <p class="sidebar-ad-title">${ad.title}</p>
          <p class="sidebar-ad-loc">
            <i class="fas fa-map-marker-alt"></i> ${ad.location}
          </p>
          <a href="tel:${ad.contact}" class="sidebar-ad-contact">
            <i class="fas fa-phone"></i> Contact
          </a>
        </div>
      </div>
    `;
  }).join('');
}