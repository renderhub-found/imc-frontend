// ================================================
//   ONLINE COURSES — online-courses.js
//   Production only — real Paystack via backend
// ================================================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {

    console.log('[Courses] Page loaded');
    console.log('[Courses] IMC_API available:', typeof IMC_API);
    console.log('[Courses] IMCPaystack available:', typeof IMCPaystack);

    var coursesGrid    = document.getElementById('coursesGrid');
    var myCoursesGrid  = document.getElementById('myCoursesGrid');
    var filterBtns     = document.querySelectorAll('.filter-btn');
    var searchInput    = document.getElementById('courseSearch');

    var allCourses     = [];
    var currentFilter  = 'all';

    // ---- Load all courses ----
    await loadCourses();

    // ---- Load my purchased courses if logged in ----
    if (IMC_API.isLoggedIn()) {
      await loadMyCourses();
    }

    // ---- Filter buttons ----
    if (filterBtns.length > 0) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          this.classList.add('active');
          currentFilter = this.getAttribute('data-filter') || 'all';
          renderCourses(allCourses, currentFilter);
        });
      });
    }

    // ---- Search ----
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        var filtered = allCourses.filter(function (c) {
          return (
            c.title.toLowerCase().includes(q) ||
            (c.category || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
          );
        });
        renderCourses(filtered, 'all');
      });
    }

  });

  // ================================================
  //   LOAD ALL COURSES
  // ================================================

  async function loadCourses() {
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;

    grid.innerHTML = loadingHTML('Loading courses...');

    var result = await IMC_API.getCourses();

    console.log('[Courses] getCourses result:', JSON.stringify(result));

    if (!result.success || !result.courses || result.courses.length === 0) {
      grid.innerHTML = emptyHTML('No courses available yet. Check back soon!');
      return;
    }

    allCourses = result.courses;
    renderCourses(allCourses, 'all');
  }

  // ================================================
  //   RENDER COURSES
  // ================================================

  function renderCourses(courses, filter) {
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;

    var filtered = courses;

    if (filter && filter !== 'all') {
      filtered = courses.filter(function (c) {
        return (c.category || '').toLowerCase() === filter.toLowerCase();
      });
    }

    if (filtered.length === 0) {
      grid.innerHTML = emptyHTML('No courses found in this category.');
      return;
    }

    grid.innerHTML = filtered.map(function (course) {
      return buildCourseCard(course);
    }).join('');

    // Attach buy buttons
    grid.querySelectorAll('.buy-course-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var courseId    = this.getAttribute('data-course-id');
        var courseTitle = this.getAttribute('data-course-title');
        var coursePrice = parseInt(this.getAttribute('data-course-price')) || 0;
        var isFree      = this.getAttribute('data-course-free') === 'true';

        console.log('[Courses] Buy button clicked');
        console.log('[Courses] courseId:', courseId);
        console.log('[Courses] price:', coursePrice);
        console.log('[Courses] isFree:', isFree);

        buyCourse(courseId, courseTitle, coursePrice, isFree);
      });
    });
  }

  // ================================================
  //   BUILD COURSE CARD
  // ================================================

  function buildCourseCard(course) {
    var priceLabel = course.isFree || course.price === 0
      ? '<span class="course-free-badge">FREE</span>'
      : '<span class="course-price">₦' +
        parseInt(course.price).toLocaleString() + '</span>';

    var btnLabel = course.isFree || course.price === 0
      ? 'Get Free Course'
      : 'Buy Course — ₦' + parseInt(course.price).toLocaleString();

    var img = course.image
      ? '<img src="' + esc(course.image) + '" alt="' + esc(course.title) +
        '" class="course-card-img" onerror="this.style.display=\'none\'"/>'
      : '<div class="course-card-img-placeholder">' +
        '<i class="fas fa-graduation-cap"></i></div>';

    return '<div class="course-card">' +
      img +
      '<div class="course-card-body">' +
      '<div class="course-card-category">' + esc(course.category || '') + '</div>' +
      '<h3 class="course-card-title">' + esc(course.title) + '</h3>' +
      '<p class="course-card-desc">' + esc(course.description || '') + '</p>' +
      '<div class="course-card-meta">' +
      '<span><i class="fas fa-clock"></i> ' + esc(course.duration || '2 hours') + '</span>' +
      '<span><i class="fas fa-book"></i> ' + (course.lessons || 0) + ' lessons</span>' +
      '<span><i class="fas fa-signal"></i> ' + esc(course.level || 'Beginner') + '</span>' +
      '</div>' +
      '<div class="course-card-footer">' +
      priceLabel +
      '<button class="buy-course-btn btn-primary"' +
      ' data-course-id="'    + esc(course._id)    + '"' +
      ' data-course-title="' + esc(course.title)  + '"' +
      ' data-course-price="' + (course.price || 0) + '"' +
      ' data-course-free="'  + (course.isFree || course.price === 0) + '">' +
      btnLabel +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  // ================================================
  //   BUY COURSE — REAL PAYSTACK ONLY
  //   No simulation. No fake cards. No demo flow.
  // ================================================

  async function buyCourse(courseId, courseTitle, coursePrice, isFree) {
    console.log('[Courses] buyCourse called');
    console.log('[Courses] courseId:', courseId);
    console.log('[Courses] courseTitle:', courseTitle);
    console.log('[Courses] coursePrice:', coursePrice);
    console.log('[Courses] isFree:', isFree);

    // Must be logged in
    if (!IMC_API.isLoggedIn()) {
      console.log('[Courses] Not logged in. Redirecting to login...');
      localStorage.setItem('imc_redirect_after_login', 'online-courses.html');
      window.location.href = 'login.html';
      return;
    }

    // Free course — grant access directly
    if (isFree || coursePrice === 0) {
      console.log('[Courses] Free course — granting access directly');
      await handleFreeCourse(courseId, courseTitle);
      return;
    }

    // Paid course — use real Paystack
    console.log('[Courses] Paid course — initiating real Paystack payment');

    if (typeof IMCPaystack === 'undefined') {
      console.error('[Courses] IMCPaystack is not loaded!');
      showCourseError('Payment system not loaded. Please refresh the page.');
      return;
    }

    // Save course info for after payment redirect
    localStorage.setItem('imc_pending_course', JSON.stringify({
      courseId:    courseId,
      courseTitle: courseTitle,
      coursePrice: coursePrice
    }));

    IMCPaystack.openPayment({
      amount:      coursePrice,
      type:        'course_purchase',
      description: 'Course: ' + courseTitle,
      metadata: {
        courseId:    courseId,
        courseTitle: courseTitle,
        userEmail:   (IMC_API.getCurrentUser() || {}).email || ''
      },
      onSuccess: function (payRef) {
        // This runs if payment completes without page redirect
        var ref = payRef && payRef.reference ? payRef.reference : String(payRef);
        console.log('[Courses] onSuccess ref:', ref);
        handleCourseAfterPayment(courseId, ref);
      },
      onCancel: function () {
        console.log('[Courses] Payment cancelled');
        localStorage.removeItem('imc_pending_course');
        showCourseError('Payment was cancelled. Please try again.');
      }
    });
  }

  // ================================================
  //   FREE COURSE HANDLER
  // ================================================

  async function handleFreeCourse(courseId, courseTitle) {
    console.log('[Courses] Granting free course access...');

    var result = await IMC_API.purchaseCourse(courseId, 'FREE');

    console.log('[Courses] Free course result:', JSON.stringify(result));

    if (result.success) {
      showCourseSuccess(
        courseTitle + ' is now in your library!',
        result.fileUrl || ''
      );
      await loadMyCourses();
    } else {
      showCourseError(result.message || 'Could not access course. Please try again.');
    }
  }

  // ================================================
  //   AFTER PAID COURSE PAYMENT
  // ================================================

  async function handleCourseAfterPayment(courseId, paymentRef) {
    console.log('[Courses] handleCourseAfterPayment');
    console.log('[Courses] courseId:', courseId);
    console.log('[Courses] ref:', paymentRef);

    var result = await IMC_API.purchaseCourse(courseId, paymentRef);

    console.log('[Courses] purchaseCourse result:', JSON.stringify(result));

    if (result.success) {
      localStorage.removeItem('imc_pending_course');
      showCourseSuccess(
        'Course purchased successfully!',
        result.fileUrl || ''
      );
      await loadMyCourses();
    } else {
      showCourseError(result.message || 'Purchase failed. Please contact support.');
    }
  }

  // ================================================
  //   LOAD MY COURSES
  // ================================================

  async function loadMyCourses() {
    var grid = document.getElementById('myCoursesGrid');
    if (!grid) return;

    var result = await IMC_API.getMyCourses();

    console.log('[Courses] getMyCourses result:', JSON.stringify(result));

    if (!result.success || !result.courses || result.courses.length === 0) {
      grid.innerHTML =
        '<p style="color:#888;font-size:14px;text-align:center;padding:20px;">' +
        'No purchased courses yet.</p>';
      return;
    }

    grid.innerHTML = result.courses.map(function (c) {
      return '<div class="my-course-card">' +
        '<h4>' + esc(c.title) + '</h4>' +
        '<p style="font-size:13px;color:#888;">' + esc(c.category || '') + '</p>' +
        (c.fileUrl
          ? '<a href="' + esc(c.fileUrl) + '" target="_blank" ' +
            'class="btn-primary" style="font-size:13px;padding:8px 16px;' +
            'display:inline-block;margin-top:8px;">' +
            '<i class="fas fa-download"></i> Access Course</a>'
          : '<span style="font-size:12px;color:#aaa;">Link coming soon</span>'
        ) +
        '</div>';
    }).join('');
  }

  // ================================================
  //   SUCCESS POPUP
  // ================================================

  function showCourseSuccess(message, fileUrl) {
    var old = document.getElementById('imc_course_popup');
    if (old) old.remove();

    var overlay       = document.createElement('div');
    overlay.id        = 'imc_course_popup';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;padding:20px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px 24px;' +
      'max-width:400px;width:100%;text-align:center;font-family:Inter,sans-serif;">' +
      '<div style="font-size:52px;margin-bottom:12px;">🎓</div>' +
      '<h3 style="font-size:20px;font-weight:800;color:#1a1a2e;margin-bottom:8px;">' +
      'Course Unlocked!</h3>' +
      '<p style="font-size:14px;color:#555;margin-bottom:20px;">' +
      message + '</p>' +
      (fileUrl
        ? '<a href="' + esc(fileUrl) + '" target="_blank" ' +
          'style="display:inline-block;background:#2d8653;color:#fff;' +
          'padding:12px 24px;border-radius:8px;font-weight:700;' +
          'text-decoration:none;margin-bottom:12px;">Access Course Now</a><br/>'
        : ''
      ) +
      '<button id="imc_course_popup_close" ' +
      'style="background:none;border:none;color:#888;font-size:13px;' +
      'cursor:pointer;margin-top:8px;">Close</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('imc_course_popup_close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ================================================
  //   ERROR POPUP
  // ================================================

  function showCourseError(message) {
    var old = document.getElementById('imc_course_error');
    if (old) old.remove();

    var overlay       = document.createElement('div');
    overlay.id        = 'imc_course_error';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;' +
      'display:flex;align-items:center;justify-content:center;padding:20px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px 24px;' +
      'max-width:380px;width:100%;text-align:center;font-family:Inter,sans-serif;">' +
      '<div style="font-size:44px;margin-bottom:12px;">⚠️</div>' +
      '<h3 style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:10px;">' +
      'Payment Error</h3>' +
      '<p style="font-size:14px;color:#555;margin-bottom:20px;">' + message + '</p>' +
      '<button id="imc_course_err_close" ' +
      'style="background:#e85d04;color:#fff;border:none;padding:12px 28px;' +
      'border-radius:8px;font-weight:700;cursor:pointer;">Close</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('imc_course_err_close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ================================================
  //   HELPERS
  // ================================================

  function loadingHTML(msg) {
    return '<div style="text-align:center;padding:40px;color:#888;">' +
      '<div style="font-size:32px;margin-bottom:12px;">⏳</div>' +
      '<p>' + msg + '</p></div>';
  }

  function emptyHTML(msg) {
    return '<div style="text-align:center;padding:40px;color:#888;">' +
      '<div style="font-size:32px;margin-bottom:12px;">📚</div>' +
      '<p>' + msg + '</p></div>';
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();