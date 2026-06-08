// ================================================
//   ONLINE COURSES — online-courses.js
// ================================================

// ---- Seed default courses ----
function seedDefaultCourses() {
  const existing = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  if (existing.length > 0) return;

  const defaults = [
    {
      id:          'CRS-001',
      title:       'How to Start a Campus Business from Scratch',
      category:    'Business',
      instructor:  'IMC Academy',
      description: 'Learn how to identify business opportunities on campus, ' +
        'set up your brand, attract your first customers and scale your ' +
        'campus business to generate consistent income as a student.',
      price:       1000,
      isFree:      false,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '3 hours',
      lessons:     12,
      level:       'Beginner',
      rating:      4.8,
      students:    234,
      tags:        ['Business','Entrepreneurship','Campus']
    },
    {
      id:          'CRS-002',
      title:       'Complete Web Design for Beginners',
      category:    'Technology',
      instructor:  'IMC Academy',
      description: 'Master HTML, CSS and basic JavaScript to build ' +
        'beautiful websites. Perfect for students who want to earn ' +
        'money building websites for businesses on and off campus.',
      price:       2000,
      isFree:      false,
      image:
        'https://images.unsplash.com/photo-1547658719-da2b51169166' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '6 hours',
      lessons:     24,
      level:       'Beginner',
      rating:      4.9,
      students:    512,
      tags:        ['Web Design','HTML','CSS','Technology']
    },
    {
      id:          'CRS-003',
      title:       'Social Media Marketing for Students',
      category:    'Marketing',
      instructor:  'IMC Academy',
      description: 'Learn to grow Instagram, TikTok and WhatsApp pages ' +
        'for businesses. Discover how to charge clients and build a ' +
        'freelance marketing career from your hostel room.',
      price:       1500,
      isFree:      false,
      image:
        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '4 hours',
      lessons:     16,
      level:       'Beginner',
      rating:      4.7,
      students:    389,
      tags:        ['Marketing','Social Media','Instagram']
    },
    {
      id:          'CRS-004',
      title:       'Personal Finance & Money Management for Students',
      category:    'Finance',
      instructor:  'IMC Academy',
      description: 'Take control of your money. Learn budgeting, saving, ' +
        'investing on a student income, and how to build wealth even ' +
        'before you graduate.',
      price:       0,
      isFree:      true,
      image:
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '2 hours',
      lessons:     8,
      level:       'Beginner',
      rating:      4.6,
      students:    892,
      tags:        ['Finance','Money','Budgeting']
    },
    {
      id:          'CRS-005',
      title:       'Graphic Design with Canva — Zero to Pro',
      category:    'Design',
      instructor:  'IMC Academy',
      description: 'Use Canva to design flyers, logos, social media posts ' +
        'and brand identities for clients. Start earning as a ' +
        'freelance designer while still in school.',
      price:       1500,
      isFree:      false,
      image:
        'https://images.unsplash.com/photo-1626785774573-4b799315345d' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '5 hours',
      lessons:     20,
      level:       'Beginner',
      rating:      4.8,
      students:    445,
      tags:        ['Design','Canva','Freelance']
    },
    {
      id:          'CRS-006',
      title:       'Public Speaking & Confidence for Students',
      category:    'Personal Development',
      instructor:  'IMC Academy',
      description: 'Overcome stage fright, speak with confidence in class ' +
        'and at events, and develop leadership communication skills ' +
        'that will set you apart for life.',
      price:       1000,
      isFree:      false,
      image:
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2' +
        '?w=600&h=300&fit=crop',
      fileUrl:
        'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
      duration:    '3 hours',
      lessons:     10,
      level:       'All Levels',
      rating:      4.9,
      students:    621,
      tags:        ['Communication','Leadership','Confidence']
    }
  ];

  localStorage.setItem('imc_courses', JSON.stringify(defaults));
}


// ================================================
//   PAGE LOAD
// ================================================
window.addEventListener('DOMContentLoaded', function () {

  seedDefaultCourses();

  const loggedIn    = localStorage.getItem('imc_logged_in');
  const currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );

  // Show my courses if logged in
  if (loggedIn && currentUser) {
    const mySection = document.getElementById('myCoursesSection');
    const purchases = JSON.parse(
      localStorage.getItem('imc_purchases') || '[]'
    );
    const mine = purchases.filter(
      p => p.userEmail === currentUser.email
    );
    if (mine.length > 0) {
      mySection.style.display = 'block';
      renderMyCourses(mine);
    }
  }

  // Load all courses
  loadCourses();

  // Update total count
  const all = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  document.getElementById('totalCoursesCount').textContent =
    all.length;

  // ---- Search ----
  document.getElementById('courseSearchInput').addEventListener(
    'input', function () {
      loadCourses(
        this.value.trim(),
        document.getElementById('courseCategoryFilter').value,
        document.getElementById('coursePriceFilter').value
      );
    }
  );

  // ---- Category filter ----
  document.getElementById('courseCategoryFilter').addEventListener(
    'change', function () {
      loadCourses(
        document.getElementById('courseSearchInput').value.trim(),
        this.value,
        document.getElementById('coursePriceFilter').value
      );
    }
  );

  // ---- Price filter ----
  document.getElementById('coursePriceFilter').addEventListener(
    'change', function () {
      loadCourses(
        document.getElementById('courseSearchInput').value.trim(),
        document.getElementById('courseCategoryFilter').value,
        this.value
      );
    }
  );

  // ---- Close modal ----
  document.getElementById('closeCourseModal').addEventListener(
    'click', function () {
      document.getElementById('courseModal').style.display = 'none';
      document.body.style.overflow = '';
    }
  );

  document.getElementById('courseModal').addEventListener(
    'click', function (e) {
      if (e.target === this) {
        this.style.display        = 'none';
        document.body.style.overflow = '';
      }
    }
  );

});


// ================================================
//   LOAD & RENDER COURSES
// ================================================
function loadCourses(
  search = '', category = '', priceFilter = ''
) {
  const all      = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  const loading  = document.getElementById('coursesLoading');
  const grid     = document.getElementById('coursesGrid');
  const empty    = document.getElementById('coursesEmpty');
  const countEl  = document.getElementById('courseResultCount');

  loading.style.display = 'flex';
  grid.innerHTML        = '';
  empty.style.display   = 'none';

  setTimeout(function () {
    loading.style.display = 'none';

    let filtered = [...all];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      filtered = filtered.filter(
        c => c.category === category
      );
    }

    if (priceFilter === 'free') {
      filtered = filtered.filter(c => c.isFree);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(c => !c.isFree);
    }

    countEl.textContent =
      filtered.length + ' course' +
      (filtered.length !== 1 ? 's' : '') + ' found';

    if (filtered.length === 0) {
      empty.style.display = 'flex';
      return;
    }

    grid.innerHTML = filtered.map(
      c => renderCourseCard(c)
    ).join('');

  }, 300);
}


// ================================================
//   RENDER COURSE CARD
// ================================================
function renderCourseCard(course) {
  const purchases = JSON.parse(
    localStorage.getItem('imc_purchases') || '[]'
  );
  const currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );
  const alreadyBought = currentUser
    ? purchases.find(
        p => p.courseId === course.id &&
             p.userEmail === currentUser.email
      )
    : false;

  const stars = renderStars(course.rating);

  return `
    <div class="course-card">
      <div class="course-card-img-wrap">
        <img src="${course.image}" alt="${course.title}"
          class="course-card-img"
          onerror="this.src='https://via.placeholder.com/400x200?text=Course'"/>
        <span class="course-level-badge">${course.level}</span>
        ${course.isFree
          ? '<span class="course-free-badge">FREE</span>'
          : ''}
      </div>
      <div class="course-card-body">
        <span class="course-category-tag">${course.category}</span>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-instructor">
          <i class="fas fa-chalkboard-teacher"></i>
          ${course.instructor}
        </p>
        <p class="course-desc">
          ${course.description.substring(0, 90)}...
        </p>
        <div class="course-meta">
          <span>
            <i class="fas fa-clock"></i> ${course.duration}
          </span>
          <span>
            <i class="fas fa-book"></i> ${course.lessons} lessons
          </span>
          <span>
            <i class="fas fa-users"></i>
            ${course.students.toLocaleString()}
          </span>
        </div>
        <div class="course-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${course.rating}</span>
        </div>
        <div class="course-card-footer">
          <div class="course-price">
            ${course.isFree
              ? '<span class="price-free">FREE</span>'
              : `<span class="price-paid">
                   ₦${course.price.toLocaleString()}
                 </span>`
            }
          </div>
          ${alreadyBought
            ? `<a href="${course.fileUrl}" target="_blank"
                 class="btn-get-course btn-download">
                 <i class="fas fa-download"></i> Download
               </a>`
            : `<button class="btn-get-course"
                 onclick="openCourseModal('${course.id}')">
                 ${course.isFree ? 'Get Free' : 'Get Course'}
               </button>`
          }
        </div>
      </div>
    </div>
  `;
}


// ================================================
//   RENDER MY COURSES (purchased)
// ================================================
function renderMyCourses(purchases) {
  const allCourses = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  const container  = document.getElementById('myCoursesList');

  const myCourses = purchases.map(function (p) {
    return allCourses.find(c => c.id === p.courseId);
  }).filter(Boolean);

  container.innerHTML = myCourses.map(function (course) {
    return `
      <div class="course-card course-card-owned">
        <div class="course-card-img-wrap">
          <img src="${course.image}" alt="${course.title}"
            class="course-card-img"
            onerror="this.src='https://via.placeholder.com/400x200'"/>
          <span class="course-owned-badge">
            ✅ Purchased
          </span>
        </div>
        <div class="course-card-body">
          <h3 class="course-title">${course.title}</h3>
          <p class="course-instructor">
            <i class="fas fa-chalkboard-teacher"></i>
            ${course.instructor}
          </p>
          <div class="course-card-footer" style="margin-top:14px;">
            <span style="font-size:13px;color:#2d8653;font-weight:700;">
              <i class="fas fa-check-circle"></i> Access Granted
            </span>
            <a href="${course.fileUrl}" target="_blank"
              class="btn-get-course btn-download">
              <i class="fas fa-download"></i> Download
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


// ================================================
//   OPEN COURSE MODAL
// ================================================
function openCourseModal(courseId) {
  const courses     = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  const course      = courses.find(c => c.id === courseId);
  if (!course) return;

  const loggedIn    = localStorage.getItem('imc_logged_in');
  const currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );
  const stars       = renderStars(course.rating);

  document.getElementById('courseModalContent').innerHTML = `
    <img src="${course.image}" alt="${course.title}"
      class="modal-news-img"
      onerror="this.src='https://via.placeholder.com/600x250'"/>
    <div class="modal-news-body">
      <span class="course-category-tag"
        style="margin-bottom:10px;display:inline-block;">
        ${course.category}
      </span>
      <h2 class="modal-news-title">${course.title}</h2>
      <p class="course-instructor" style="margin-bottom:14px;">
        <i class="fas fa-chalkboard-teacher"></i>
        ${course.instructor}
      </p>

      <div class="course-modal-stats">
        <div class="cms-item">
          <i class="fas fa-clock"></i>
          <span>${course.duration}</span>
        </div>
        <div class="cms-item">
          <i class="fas fa-book"></i>
          <span>${course.lessons} Lessons</span>
        </div>
        <div class="cms-item">
          <i class="fas fa-signal"></i>
          <span>${course.level}</span>
        </div>
        <div class="cms-item">
          <i class="fas fa-users"></i>
          <span>${course.students.toLocaleString()} Students</span>
        </div>
      </div>

      <div class="course-rating" style="margin:14px 0;">
        <span class="stars">${stars}</span>
        <span class="rating-num">${course.rating} / 5.0</span>
      </div>

      <p class="modal-news-content"
        style="font-size:14px;margin-bottom:18px;">
        ${course.description}
      </p>

      <div class="course-modal-footer">
        <div class="course-price" style="font-size:22px;">
          ${course.isFree
            ? '<span class="price-free" style="font-size:22px;">FREE</span>'
            : `<span class="price-paid" style="font-size:22px;">
                 ₦${course.price.toLocaleString()}
               </span>`
          }
        </div>
        ${loggedIn && currentUser
          ? `<button class="btn-get-course"
               style="padding:12px 28px;font-size:15px;"
               id="modalBuyBtn"
               onclick="buyCourse('${course.id}')">
               ${course.isFree
                 ? '<i class="fas fa-download"></i> Get Free Course'
                 : '<i class="fas fa-credit-card"></i> Buy Now'}
             </button>`
          : `<a href="login.html"
               class="btn-get-course"
               style="padding:12px 28px;font-size:15px;">
               Login to Purchase
             </a>`
        }
      </div>
    </div>
  `;

  document.getElementById('courseModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}


// ================================================
//   BUY / GET COURSE
// ================================================
function buyCourse(courseId) {
  const courses     = JSON.parse(
    localStorage.getItem('imc_courses') || '[]'
  );
  const course      = courses.find(c => c.id === courseId);
  const currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );

  if (!course || !currentUser) return;

  // Check already purchased
  const purchases   = JSON.parse(
    localStorage.getItem('imc_purchases') || '[]'
  );
  const owned = purchases.find(
    p => p.courseId === courseId &&
         p.userEmail === currentUser.email
  );
  if (owned) {
    window.open(course.fileUrl, '_blank');
    return;
  }

  // Free course — no payment
  if (course.isFree) {
    savePurchase(course, currentUser);
    return;
  }

  // Paid course — Paystack popup
  simulateCoursePayment(
    course.price, course.title, function (success) {
      if (success) {
        savePurchase(course, currentUser);
      } else {
        alert('Payment cancelled. Please try again.');
      }
    }
  );
}


// ---- Save purchase & redirect ----
function savePurchase(course, currentUser) {
  const purchases = JSON.parse(
    localStorage.getItem('imc_purchases') || '[]'
  );

  purchases.push({
    id:          'PUR-' + Date.now(),
    courseId:    course.id,
    courseTitle: course.title,
    userEmail:   currentUser.email,
    price:       course.price,
    date:        new Date().toLocaleDateString()
  });

  localStorage.setItem(
    'imc_purchases', JSON.stringify(purchases)
  );

  // Close modal
  document.getElementById('courseModal').style.display = 'none';
  document.body.style.overflow = '';

  alert(
    '🎉 Course access granted!\n\n' +
    'Click OK to download your course material.'
  );

  window.open(course.fileUrl, '_blank');

  // Reload page to reflect purchase
  setTimeout(() => window.location.reload(), 500);
}


// ================================================
//   SIMULATED PAYSTACK FOR COURSES
// ================================================
function simulateCoursePayment(amount, title, callback) {

  const btn = document.getElementById('modalBuyBtn');
  if (btn) {
    btn.textContent = 'Loading...';
    btn.disabled    = true;
  }

  const overlay = document.createElement('div');
  overlay.id    = 'paystackOverlay';
  overlay.innerHTML = `
    <div class="paystack-popup">
      <div class="paystack-header">
        <img src="https://website.paystack.com/icons/favicon.png"
          alt="Paystack" width="24"
          onerror="this.style.display='none'"/>
        <span>Paystack</span>
        <button id="closePaystack" class="paystack-close">✕</button>
      </div>
      <div class="paystack-body">
        <div class="paystack-amount">
          ₦${amount.toLocaleString()}
        </div>
        <p class="paystack-desc">
          Inside My Campus — ${title}
        </p>
        <div class="paystack-form">
          <div class="paystack-input-group">
            <label>Card Number</label>
            <input type="text"
              placeholder="0000 0000 0000 0000"
              maxlength="19" id="psCardNum"/>
          </div>
          <div class="paystack-row">
            <div class="paystack-input-group">
              <label>Expiry</label>
              <input type="text"
                placeholder="MM/YY"
                maxlength="5" id="psExpiry"/>
            </div>
            <div class="paystack-input-group">
              <label>CVV</label>
              <input type="text"
                placeholder="123"
                maxlength="3" id="psCVV"/>
            </div>
          </div>
          <button class="paystack-pay-btn" id="paystackPayNow">
            Pay ₦${amount.toLocaleString()}
          </button>
          <button class="paystack-cancel-btn"
            id="paystackCancel">Cancel</button>
        </div>
        <p class="paystack-secure">🔒 Secured by Paystack</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('psCardNum').addEventListener(
    'input', function () {
      let v = this.value.replace(/\D/g,'').substring(0,16);
      this.value = v.replace(/(.{4})/g,'$1 ').trim();
    }
  );

  document.getElementById('paystackPayNow').addEventListener(
    'click', function () {
      const card   = document.getElementById('psCardNum')
                       .value.replace(/\s/g,'');
      const expiry = document.getElementById('psExpiry').value;
      const cvv    = document.getElementById('psCVV').value;

      if (card.length < 16 || !expiry || cvv.length < 3) {
        alert('Please fill in all card details correctly.');
        return;
      }

      this.textContent = 'Processing...';
      this.disabled    = true;

      setTimeout(function () {
        document.body.removeChild(overlay);
        callback(true);
      }, 2000);
    }
  );

  document.getElementById('paystackCancel').addEventListener(
    'click', function () {
      document.body.removeChild(overlay);
      if (btn) {
        btn.innerHTML =
          '<i class="fas fa-credit-card"></i> Buy Now';
        btn.disabled  = false;
      }
      callback(false);
    }
  );

  document.getElementById('closePaystack').addEventListener(
    'click', function () {
      document.body.removeChild(overlay);
      if (btn) {
        btn.innerHTML =
          '<i class="fas fa-credit-card"></i> Buy Now';
        btn.disabled  = false;
      }
      callback(false);
    }
  );
}


// ---- Helper: render star rating ----
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i - rating < 1) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  return stars;
}