// ================================================
//   POST AD — post-ad.js
//   Production version — real Paystack only
// ================================================

(function () {
  'use strict';

  var pricingTable = {
    7:  { price: 2000,  label: '₦2,000'  },
    14: { price: 3500,  label: '₦3,500'  },
    30: { price: 6000,  label: '₦6,000'  }
  };

  document.addEventListener('DOMContentLoaded', function () {

    var loggedIn    = localStorage.getItem('imc_logged_in');
    var currentUser = null;

    try {
      currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');
    } catch (e) {
      currentUser = null;
    }

    var formBox      = document.getElementById('adFormBox');
    var noLoginBox   = document.getElementById('notLoggedInBox');
    var myAdsSection = document.getElementById('myAdsSection');

    if (!loggedIn || !currentUser) {
      if (formBox)    formBox.style.display    = 'none';
      if (noLoginBox) noLoginBox.style.display = 'flex';
      return;
    }

    if (myAdsSection) {
      myAdsSection.style.display = 'block';
      renderMyAds(currentUser.email);
    }

    // ---- Image upload preview ----
    var adImgInput = document.getElementById('adImageFile');
    if (adImgInput) {
      adImgInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          alert('Image must be under 5MB.');
          this.value = '';
          return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
          var prev = document.getElementById('adPreviewImg');
          var ph   = document.getElementById('adImagePlaceholder');
          var wrap = document.getElementById('adImagePreviewWrap');
          if (prev) prev.src           = e.target.result;
          if (ph)   ph.style.display   = 'none';
          if (wrap) wrap.style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }

    // ---- Duration change ----
    var durationSel = document.getElementById('adDuration');
    var priceTextEl = document.getElementById('adPriceText');
    var daysTextEl  = document.getElementById('adDaysText');
    var btnTextEl   = document.getElementById('adBtnText');

    if (durationSel) {
      durationSel.addEventListener('change', function () {
        var days    = parseInt(this.value);
        var pricing = pricingTable[days];
        if (!pricing) return;

        if (priceTextEl) priceTextEl.textContent = pricing.label;
        if (daysTextEl)  daysTextEl.textContent  = days + ' days';
        if (btnTextEl)   btnTextEl.innerHTML =
          '<i class="fas fa-credit-card"></i> Submit & Pay ' + pricing.label;
      });
    }

    // ---- Submit button ----
    var submitBtn = document.getElementById('adSubmitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleAdSubmit(currentUser);
      });
    }

  });

  // ================================================
  //   HANDLE AD SUBMIT
  // ================================================

  function handleAdSubmit(currentUser) {
    var title       = getVal('adTitle');
    var category    = getVal('adCategory');
    var location    = getVal('adLocation');
    var contact     = getVal('adContact');
    var description = getVal('adDescription');
    var durationEl  = document.getElementById('adDuration');
    var duration    = durationEl ? parseInt(durationEl.value) || 7 : 7;
    var adImgInput  = document.getElementById('adImageFile');

    var errorBox = document.getElementById('adError');
    var errorMsg = document.getElementById('adErrorMsg');

    if (errorBox) errorBox.style.display = 'none';

    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Validate
    if (!title)       { showErr('Please enter an ad title.');               return; }
    if (!category)    { showErr('Please select a category.');               return; }
    if (!location)    { showErr('Please enter your location.');             return; }
    if (!contact)     { showErr('Please enter a contact number.');          return; }
    if (!description) { showErr('Please add a description for your ad.');   return; }

    var pricing = pricingTable[duration] || pricingTable[7];

    // Read image then proceed
    var imgFile = adImgInput && adImgInput.files[0];

    if (imgFile) {
      var reader = new FileReader();
      reader.onload = function (e) {
        openAdPayment(currentUser, {
          title, category, location, contact,
          description, duration, pricing,
          image: e.target.result
        });
      };
      reader.onerror = function () {
        openAdPayment(currentUser, {
          title, category, location, contact,
          description, duration, pricing,
          image: ''
        });
      };
      reader.readAsDataURL(imgFile);
    } else {
      openAdPayment(currentUser, {
        title, category, location, contact,
        description, duration, pricing,
        image: ''
      });
    }
  }

  // ================================================
  //   OPEN PAYSTACK PAYMENT FOR AD
  // ================================================

  function openAdPayment(currentUser, adData) {
    var submitBtn = document.getElementById('adSubmitBtn');
    var btnText   = document.getElementById('adBtnText');
    var spinner   = document.getElementById('adSpinner');

    console.log('[PostAd] Opening payment');
    console.log('[PostAd] Amount:', adData.pricing.price);
    console.log('[PostAd] Type: ad_posting');

    IMCPaystack.openPayment({
      amount:      adData.pricing.price,
      type:        'ad_posting',
      description: 'Ad Posting Fee — ' + adData.duration + ' days — Inside My Campus',
      email:       currentUser.email,
      metadata: {
        userId:    currentUser.id || currentUser._id || '',
        userEmail: currentUser.email,
        adTitle:   adData.title,
        duration:  adData.duration
      },
      onSuccess: function (payRef) {
        handleAdAfterPayment(currentUser, adData, payRef);
      },
      onCancel: function () {
        var errorBox = document.getElementById('adError');
        var errorMsg = document.getElementById('adErrorMsg');
        if (errorMsg) errorMsg.textContent   = 'Payment cancelled. Please try again.';
        if (errorBox) errorBox.style.display = 'flex';
      }
    });
  }

  // ================================================
  //   AFTER PAYMENT — SAVE AD TO BACKEND
  // ================================================

  async function handleAdAfterPayment(currentUser, adData, payRef) {
    var submitBtn = document.getElementById('adSubmitBtn');
    var btnText   = document.getElementById('adBtnText');
    var spinner   = document.getElementById('adSpinner');
    var errorBox  = document.getElementById('adError');
    var errorMsg  = document.getElementById('adErrorMsg');

    if (btnText)   btnText.style.display   = 'none';
    if (spinner)   spinner.style.display   = 'inline';
    if (submitBtn) submitBtn.disabled      = true;

    var reference = payRef && payRef.reference
      ? payRef.reference
      : (payRef || 'PAID');

    var result = await IMC_API.submitAd({
      title:       adData.title,
      category:    adData.category,
      location:    adData.location,
      contact:     adData.contact,
      description: adData.description,
      duration:    adData.duration,
      image:       adData.image,
      paymentRef:  reference
    });

    if (result.success) {
      clearAdForm();
      renderMyAds(currentUser.email);
      showSuccessBanner('Ad submitted! Pending admin approval — goes live within 24 hours.');
    } else {
      if (errorMsg) errorMsg.textContent   = result.message || 'Ad submission failed.';
      if (errorBox) errorBox.style.display = 'flex';
    }

    if (btnText)   btnText.style.display   = 'inline';
    if (spinner)   spinner.style.display   = 'none';
    if (submitBtn) submitBtn.disabled      = false;
  }

  // ================================================
  //   RENDER MY ADS
  // ================================================

  async function renderMyAds(email) {
    var container = document.getElementById('myAdsList');
    if (!container) return;

    container.innerHTML =
      '<p style="color:#888;font-size:14px;">Loading your ads...</p>';

    var result = await IMC_API.getMyAds();

    if (!result.success || !result.ads || result.ads.length === 0) {
      container.innerHTML =
        '<div class="empty-state-card">' +
        '<div style="font-size:40px;">📋</div>' +
        '<p>You have not posted any ads yet.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = result.ads.map(function (ad) {
      var statusLabel =
        ad.status === 'approved' ? '✅ Live' :
        ad.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';

      var imgSrc = ad.image ||
        'https://via.placeholder.com/120x90?text=Ad';

      return '<div class="my-ad-card">' +
        '<img src="' + imgSrc + '" alt="' + escapeHtml(ad.title) + '" ' +
        'class="my-ad-img" ' +
        'onerror="this.src=\'https://via.placeholder.com/120x90?text=Ad\'"/>' +
        '<div class="my-ad-body">' +
        '<h4>' + escapeHtml(ad.title) + '</h4>' +
        '<p class="my-ad-cat">' +
        '<i class="fas fa-tag"></i> ' + escapeHtml(ad.category) + '</p>' +
        '<p class="my-ad-loc">' +
        '<i class="fas fa-map-marker-alt"></i> ' + escapeHtml(ad.location) + '</p>' +
        '<p class="my-ad-date">' +
        '<i class="fas fa-calendar"></i> ' +
        'Duration: ' + (ad.duration || 7) + ' days' +
        '</p>' +
        '</div>' +
        '<div class="my-ad-status">' +
        '<span class="status-badge ' + ad.status + '">' +
        statusLabel + '</span>' +
        '<span style="font-size:11px;color:#aaa;display:block;margin-top:6px;">' +
        '₦' + (ad.price || 0).toLocaleString() + ' paid' +
        '</span>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  // ================================================
  //   HELPERS
  // ================================================

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clearAdForm() {
    var fields = ['adTitle','adCategory','adLocation','adContact','adDescription'];
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });

    var dur = document.getElementById('adDuration');
    if (dur) dur.value = '7';

    window.removeAdImage && window.removeAdImage();

    var btnText = document.getElementById('adBtnText');
    if (btnText) btnText.innerHTML =
      '<i class="fas fa-credit-card"></i> Submit & Pay ₦2,000';

    var priceText = document.getElementById('adPriceText');
    if (priceText) priceText.textContent = '₦2,000';
  }

  function showSuccessBanner(msg) {
    var existing = document.getElementById('adSuccessBanner');
    if (existing) existing.remove();

    var banner       = document.createElement('div');
    banner.id        = 'adSuccessBanner';
    banner.className = 'auth-success';
    banner.style.cssText = 'margin-bottom:16px;';
    banner.innerHTML =
      '<i class="fas fa-check-circle"></i>' +
      '<span>' + msg + '</span>';

    var formBox = document.getElementById('adFormBox');
    if (formBox) formBox.insertBefore(banner, formBox.firstChild);

    setTimeout(function () {
      if (banner.parentNode) banner.remove();
    }, 6000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.removeAdImage = function () {
    var fi = document.getElementById('adImageFile');
    var pi = document.getElementById('adPreviewImg');
    var ph = document.getElementById('adImagePlaceholder');
    var pw = document.getElementById('adImagePreviewWrap');
    if (fi) { try { fi.value = ''; } catch (e) {} }
    if (pi) pi.src           = '';
    if (ph) ph.style.display = 'flex';
    if (pw) pw.style.display = 'none';
  };

})();