// ================================================
//   POST AD SYSTEM — post-ad.js
//   COMPLETE FIXED VERSION
// ================================================

(function () {
  'use strict';

  // Pricing table
  var pricingTable = {
    '7':  { price: 2000, label: '₦2,000' },
    '14': { price: 3500, label: '₦3,500' },
    '30': { price: 6000, label: '₦6,000' }
  };

  // ================================================
  //   PAGE INIT
  // ================================================
  document.addEventListener('DOMContentLoaded', function () {

    var loggedIn    = localStorage.getItem('imc_logged_in');
    var currentUser = JSON.parse(
      localStorage.getItem('imc_user') || 'null'
    );

    var formBox      = document.getElementById('adFormBox');
    var noLoginBox   = document.getElementById('notLoggedInBox');
    var myAdsSection = document.getElementById('myAdsSection');

    // Not logged in
    if (!loggedIn || !currentUser) {
      if (formBox)    formBox.style.display    = 'none';
      if (noLoginBox) noLoginBox.style.display = 'flex';
      return;
    }

    // Show my ads section
    if (myAdsSection) {
      myAdsSection.style.display = 'block';
      renderMyAds(currentUser.email);
    }

    // ---- Ad image file input listener ----
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
          if (prev) prev.src             = e.target.result;
          if (ph)   ph.style.display     = 'none';
          if (wrap) wrap.style.display   = 'block';
        };
        reader.readAsDataURL(file);
      });
    }

    // ---- Dynamic price display ----
    var durationSel = document.getElementById('adDuration');
    var priceTextEl = document.getElementById('adPriceText');
    var daysTextEl  = document.getElementById('adDaysText');
    var btnTextEl   = document.getElementById('adBtnText');

    if (durationSel) {
      durationSel.addEventListener('change', function () {
        var days    = this.value;
        var pricing = pricingTable[days];
        if (!pricing) return;
        if (priceTextEl) priceTextEl.textContent = pricing.label;
        if (daysTextEl)  daysTextEl.textContent  = days + ' days';
        if (btnTextEl) {
          btnTextEl.innerHTML =
            '<i class="fas fa-credit-card"></i> Submit & Pay ' +
            pricing.label;
        }
      });
    }

    // ---- Submit button ----
    var submitBtn = document.getElementById('adSubmitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        submitAd(currentUser);
      });
    }

  }); // end DOMContentLoaded


  // ================================================
  //   SUBMIT AD
  // ================================================
  function submitAd(currentUser) {

    var title       = getVal('adTitle');
    var category    = getVal('adCategory');
    var location    = getVal('adLocation');
    var contact     = getVal('adContact');
    var description = getVal('adDescription');
    var duration    = getVal('adDuration') || '7';
    var adImgFile   = document.getElementById('adImageFile');

    var errBox = document.getElementById('adError');
    var errMsg = document.getElementById('adErrorMsg');

    function showErr(msg) {
      if (errMsg) errMsg.textContent  = msg;
      if (errBox) errBox.style.display = 'flex';
    }

    if (errBox) errBox.style.display = 'none';

    // Validate fields
    if (!title) {
      showErr('Please enter an ad title.');
      return;
    }
    if (!category) {
      showErr('Please select a category.');
      return;
    }
    if (!location) {
      showErr('Please enter your location or university.');
      return;
    }
    if (!contact) {
      showErr('Please enter a contact number.');
      return;
    }
    if (!description) {
      showErr('Please add a description for your ad.');
      return;
    }

    // Get pricing
    var pricing = pricingTable[duration] || pricingTable['7'];

    // Show spinner on button
    var btnText   = document.getElementById('adBtnText');
    var spinner   = document.getElementById('adSpinner');
    var submitBtn = document.getElementById('adSubmitBtn');
    if (btnText)   btnText.style.display   = 'none';
    if (spinner)   spinner.style.display   = 'inline';
    if (submitBtn) submitBtn.disabled      = true;

    function resetBtn() {
      if (btnText)   btnText.style.display   = 'inline';
      if (spinner)   spinner.style.display   = 'none';
      if (submitBtn) submitBtn.disabled      = false;
    }

    // Read image then open payment
    var adImgObj = adImgFile && adImgFile.files[0];

    function openPaymentWithImage(imageData) {

      // Check IMCPaystack is available
      if (typeof IMCPaystack === 'undefined') {
        resetBtn();
        showErr(
          'Payment system not loaded. ' +
          'Please refresh the page and try again.'
        );
        return;
      }

      IMCPaystack.openPayment({
        amount:      pricing.price,
        description: 'Ad Posting (' + duration + ' days)',
        email:       currentUser.email,

        onSuccess: function (ref) {
          resetBtn();

          var newAd = {
            id:           'AD-' + Date.now(),
            ownerEmail:   currentUser.email,
            ownerName:    (currentUser.firstName || '') + ' ' +
                          (currentUser.lastName  || ''),
            title:        title,
            category:     category,
            location:     location,
            contact:      contact,
            image:        imageData ||
              'https://images.unsplash.com/photo-1563013544-824ae1b704d3' +
              '?w=600&h=300&fit=crop',
            description:  description,
            duration:     parseInt(duration),
            price:        pricing.price,
            status:       'pending',
            paymentStatus:'paid',
            paymentRef:   ref ? ref.reference : 'REF-' + Date.now(),
            date:         new Date().toLocaleDateString(),
            expiryDate:   getExpiryDate(parseInt(duration))
          };

          // Save ad to localStorage
          var ads = JSON.parse(
            localStorage.getItem('imc_ads') || '[]'
          );
          ads.push(newAd);
          localStorage.setItem('imc_ads', JSON.stringify(ads));

          // Clear the form
          clearAdForm();

          // Refresh my ads list
          renderMyAds(currentUser.email);

          // Show success message
          showSuccessBanner(
            '✅ Ad submitted successfully! ' +
            'Pending admin approval — goes live within 24 hours.'
          );
        },

        onCancel: function () {
          resetBtn();
          showErr('Payment was cancelled. Please try again.');
        }
      });
    }

    // Read image file if provided
    if (adImgObj) {
      var rdr = new FileReader();
      rdr.onload = function (e) {
        openPaymentWithImage(e.target.result);
      };
      rdr.onerror = function () {
        openPaymentWithImage(null);
      };
      rdr.readAsDataURL(adImgObj);
    } else {
      openPaymentWithImage(null);
    }

  } // end submitAd


  // ================================================
  //   RENDER MY ADS
  // ================================================
  function renderMyAds(email) {
    var ads       = JSON.parse(
      localStorage.getItem('imc_ads') || '[]'
    );
    var myAds     = ads.filter(function (a) {
      return a.ownerEmail === email;
    });
    var container = document.getElementById('myAdsList');
    if (!container) return;

    if (myAds.length === 0) {
      container.innerHTML =
        '<div class="empty-state-card">' +
        '<div style="font-size:40px;">📋</div>' +
        '<p>You haven\'t posted any ads yet.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = myAds.map(function (ad) {
      var statusLabel =
        ad.status === 'approved' ? '✅ Live' :
        ad.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';

      var imgSrc = ad.image ||
        'https://via.placeholder.com/120x90?text=Ad';

      return '<div class="my-ad-card">' +
        '<img src="' + imgSrc + '" alt="' + ad.title + '" ' +
        'class="my-ad-img" ' +
        'onerror="this.src=\'https://via.placeholder.com/120x90?text=Ad\'"/>' +
        '<div class="my-ad-body">' +
        '<h4>' + ad.title + '</h4>' +
        '<p class="my-ad-cat">' +
        '<i class="fas fa-tag"></i> ' + ad.category + '</p>' +
        '<p class="my-ad-loc">' +
        '<i class="fas fa-map-marker-alt"></i> ' + ad.location + '</p>' +
        '<p class="my-ad-date">' +
        '<i class="fas fa-calendar"></i> ' +
        'Posted: ' + ad.date +
        ' · Expires: ' + (ad.expiryDate || '—') + '</p>' +
        '</div>' +
        '<div class="my-ad-status">' +
        '<span class="status-badge ' + ad.status + '">' +
        statusLabel + '</span>' +
        '<span style="font-size:11px;color:#aaa;' +
        'display:block;margin-top:6px;">' +
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

  function getExpiryDate(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString();
  }

  function clearAdForm() {
    var fieldIds = [
      'adTitle', 'adCategory', 'adLocation',
      'adContact', 'adDescription'
    ];
    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });

    var dur = document.getElementById('adDuration');
    if (dur) dur.value = '7';

    // Reset image upload
    removeAdImage();

    // Reset price display
    var btnText = document.getElementById('adBtnText');
    if (btnText) {
      btnText.innerHTML =
        '<i class="fas fa-credit-card"></i> Submit & Pay ₦2,000';
    }
    var priceText = document.getElementById('adPriceText');
    if (priceText) priceText.textContent = '₦2,000';
    var daysText = document.getElementById('adDaysText');
    if (daysText) daysText.textContent = '7 days';
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
    if (formBox) {
      formBox.insertBefore(banner, formBox.firstChild);
    }

    setTimeout(function () {
      if (banner.parentNode) banner.remove();
    }, 6000);
  }

  // ---- Expose removeAdImage globally ----
  // (called from HTML onclick)
  window.removeAdImage = function () {
    var fi = document.getElementById('adImageFile');
    var pi = document.getElementById('adPreviewImg');
    var ph = document.getElementById('adImagePlaceholder');
    var pw = document.getElementById('adImagePreviewWrap');
    if (fi) { try { fi.value = ''; } catch (e) {} }
    if (pi) pi.src            = '';
    if (ph) ph.style.display  = 'flex';
    if (pw) pw.style.display  = 'none';
  };

})();