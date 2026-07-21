// ================================================
//   POST AD — post-ad.js
// ================================================

(function () {
  'use strict';

  var pricingTable = {
    7:  { price: 2000,  label: '₦2,000'  },
    14: { price: 3500,  label: '₦3,500'  },
    30: { price: 6000,  label: '₦6,000'  }
  };

  document.addEventListener('DOMContentLoaded', function () {

    if (!IMC_API.isLoggedIn()) {
      var fb = document.getElementById('adFormBox');
      var nb = document.getElementById('notLoggedInBox');
      if (fb) fb.style.display = 'none';
      if (nb) nb.style.display = 'flex';
      return;
    }

    var currentUser = IMC_API.getCurrentUser();

    // Load my ads
    var myAdsSection = document.getElementById('myAdsSection');
    if (myAdsSection) {
      myAdsSection.style.display = 'block';
      loadMyAds();
    }

    // Image preview
    var imgInput = document.getElementById('adImageFile');
    if (imgInput) {
      imgInput.addEventListener('change', function () {
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

    // Duration change
    var durSel = document.getElementById('adDuration');
    if (durSel) {
      durSel.addEventListener('change', function () {
        var p   = pricingTable[parseInt(this.value)];
        if (!p) return;
        var pt = document.getElementById('adPriceText');
        var dt = document.getElementById('adDaysText');
        var bt = document.getElementById('adBtnText');
        if (pt) pt.textContent = p.label;
        if (dt) dt.textContent = this.value + ' days';
        if (bt) bt.innerHTML =
          '<i class="fas fa-credit-card"></i> Submit & Pay ' + p.label;
      });
    }

    // Submit button
    var submitBtn = document.getElementById('adSubmitBtn');
if (submitBtn) {
  submitBtn.addEventListener('click', function () {
    console.log('[PostAd] Submit button clicked');
    console.log('[PostAd] IMC_API available:', typeof IMC_API);
    console.log('[PostAd] IMCPaystack available:', typeof IMCPaystack);
    console.log('[PostAd] isLoggedIn:', IMC_API.isLoggedIn());
    handleAdSubmit(currentUser);
  });
  console.log('[PostAd] Submit button listener attached');
} else {
  console.error('[PostAd] ERROR: adSubmitBtn not found in DOM!');
}

  });

  // ================================================
  //   HANDLE SUBMIT
  // ================================================

  function handleAdSubmit(currentUser) {
    var title       = getVal('adTitle');
    var category    = getVal('adCategory');
    var location    = getVal('adLocation');
    var contact     = getVal('adContact');
    var whatsapp    = getVal('adWhatsapp');
    var websiteUrl  = getVal('adWebsiteUrl');
    var description = getVal('adDescription');
    var durEl       = document.getElementById('adDuration');
    var duration    = durEl ? parseInt(durEl.value) || 7 : 7;
    var imgInput    = document.getElementById('adImageFile');

    var errorBox = document.getElementById('adError');
    var errorMsg = document.getElementById('adErrorMsg');
    if (errorBox) errorBox.style.display = 'none';

    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!title)       { showErr('Please enter an ad title.');     return; }
    if (!category)    { showErr('Please select a category.');     return; }
    if (!location)    { showErr('Please enter your location.');   return; }
    if (!contact)     { showErr('Please enter a contact number.'); return; }
    if (!description) { showErr('Please add a description.');     return; }

    var pricing = pricingTable[duration] || pricingTable[7];

    var adFormData = {
      title:       title,
      category:    category,
      location:    location,
      contact:     contact,
      whatsapp:    whatsapp,
      websiteUrl:  websiteUrl,
      description: description,
      duration:    duration,
      pricing:     pricing,
      ownerName:   currentUser.firstName || ''
    };

    var imgFile = imgInput && imgInput.files[0];

    function proceed(imageData) {
      adFormData.image = imageData || '';
      openAdPayment(currentUser, adFormData);
    }

    function openAdPayment(currentUser, adData) {
      localStorage.setItem('imc_ad_form', JSON.stringify(adData));
      console.log('[PostAd] Ad form saved to localStorage');
      console.log('[PostAd] Calling IMCPaystack.openPayment');
      console.log('[PostAd] type: ad_posting');
      console.log('[PostAd] amount:', adData.pricing.price);

      IMCPaystack.openPayment({
        amount:      adData.pricing.price,
        type:        'ad_posting',
        description: 'Ad Posting — ' + adData.duration + ' days',
        email:       currentUser.email,
        metadata: {
          userId:    currentUser.id || currentUser._id || '',
          userEmail: currentUser.email,
          adForm: {
            title:       adData.title,
            category:    adData.category,
            location:    adData.location,
            contact:     adData.contact,
            whatsapp:    adData.whatsapp || '',
            websiteUrl:  adData.websiteUrl || '',
            description: adData.description,
            duration:    adData.duration,
            image:       adData.image || '',
            ownerName:   currentUser.firstName || ''
          }
        },
        onSuccess: function (payRef) {
          var ref = payRef && payRef.reference ? payRef.reference : String(payRef);
          handleAdAfterPayment(adData, ref);
        },
        onCancel: function () {
          localStorage.removeItem('imc_ad_form');
          var eb = document.getElementById('adError');
          var em = document.getElementById('adErrorMsg');
          if (em) em.textContent   = 'Payment cancelled.';
          if (eb) eb.style.display = 'flex';
        }
      });
    }

    if (imgFile) {
      var reader = new FileReader();
      reader.onload  = function (e) { proceed(e.target.result); };
      reader.onerror = function ()  { proceed(''); };
      reader.readAsDataURL(imgFile);
    } else {
      proceed('');
    }
  }

  // ================================================
  //   AFTER PAYMENT
  // ================================================

  async function handleAdAfterPayment(adFormData, paymentRef) {
    var submitBtn = document.getElementById('adSubmitBtn');
    var btnText   = document.getElementById('adBtnText');
    var spinner   = document.getElementById('adSpinner');

    if (btnText)   btnText.style.display   = 'none';
    if (spinner)   spinner.style.display   = 'inline';
    if (submitBtn) submitBtn.disabled      = true;

    var result = await IMC_API.submitAd({
      title:       adFormData.title,
      category:    adFormData.category,
      location:    adFormData.location,
      contact:     adFormData.contact,
      whatsapp:    adFormData.whatsapp || '',
      websiteUrl:  adFormData.websiteUrl || '',
      description: adFormData.description,
      duration:    adFormData.duration,
      image:       adFormData.image || '',
      paymentRef:  paymentRef
    });

    console.log('[PostAd] submitAd result:', JSON.stringify(result));

    if (result.success) {
      localStorage.removeItem('imc_ad_form');
      clearAdForm();
      await loadMyAds();
      showSuccessBanner('Ad submitted! Pending admin approval.');
    } else {
      var eb = document.getElementById('adError');
      var em = document.getElementById('adErrorMsg');
      if (em) em.textContent   = result.message || 'Ad submission failed.';
      if (eb) eb.style.display = 'flex';
    }

    if (btnText)   btnText.style.display   = 'inline';
    if (spinner)   spinner.style.display   = 'none';
    if (submitBtn) submitBtn.disabled      = false;
  }

  // ================================================
  //   LOAD MY ADS
  // ================================================

  async function loadMyAds() {
    var container = document.getElementById('myAdsList');
    if (!container) return;

    container.innerHTML = '<p style="color:#888;font-size:14px;">Loading...</p>';

    var result = await IMC_API.getMyAds();

    if (!result.success || !result.ads || result.ads.length === 0) {
      container.innerHTML =
        '<div style="text-align:center;padding:24px;color:#888;">' +
        '<div style="font-size:32px;">📋</div>' +
        '<p>No ads posted yet.</p></div>';
      return;
    }

    container.innerHTML = result.ads.map(function (ad) {
      var statusLabel =
        ad.status === 'approved' ? '✅ Live' :
        ad.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';

      return '<div class="my-ad-card">' +
        '<div class="my-ad-body">' +
        '<h4>' + esc(ad.title) + '</h4>' +
        '<p><i class="fas fa-tag"></i> ' + esc(ad.category) + '</p>' +
        '<p><i class="fas fa-map-marker-alt"></i> ' + esc(ad.location) + '</p>' +
        '<p><i class="fas fa-calendar"></i> ' + (ad.duration || 7) + ' days</p>' +
        '</div>' +
        '<div class="my-ad-status">' +
        '<span class="status-badge ' + ad.status + '">' + statusLabel + '</span>' +
        '<span style="font-size:11px;color:#aaa;display:block;margin-top:4px;">' +
        '₦' + (ad.price || 0).toLocaleString() + '</span>' +
        '</div></div>';
    }).join('');
  }

  // ================================================
  //   HELPERS
  // ================================================

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function clearAdForm() {
   ['adTitle','adCategory','adLocation','adContact','adWhatsapp','adWebsiteUrl','adDescription'] 
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
    var dur = document.getElementById('adDuration');
    if (dur) dur.value = '7';
    window.removeAdImage && window.removeAdImage();
  }

  function showSuccessBanner(msg) {
    var b    = document.createElement('div');
    b.style.cssText =
      'background:#e8f9ee;border:1px solid #2d8653;border-radius:8px;' +
      'padding:12px 16px;margin-bottom:16px;font-size:14px;color:#2d8653;';
    b.textContent = msg;
    var fb = document.getElementById('adFormBox');
    if (fb) fb.insertBefore(b, fb.firstChild);
    setTimeout(function () { if (b.parentNode) b.remove(); }, 6000);
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