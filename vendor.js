// ================================================
//   VENDOR REGISTRATION — vendor.js
// ================================================

window.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  var UPLOADED_LOGO_URL  = '';
  var UPLOADED_COVER_URL = '';

  // ---- Persist referral code from URL ----
  var urlParams  = new URLSearchParams(window.location.search);
  var refFromUrl = urlParams.get('ref') || '';
  if (refFromUrl) {
    localStorage.setItem('imc_ref_code', refFromUrl);
    console.log('[Vendor] Referral code saved:', refFromUrl);
  }

  var formBox        = document.getElementById('vendorFormBox');
  var alreadyBox     = document.getElementById('alreadyVendorBox');
  var notLoggedInBox = document.getElementById('notLoggedInBox');

  if (!IMC_API.isLoggedIn()) {
    if (formBox)        formBox.style.display        = 'none';
    if (notLoggedInBox) notLoggedInBox.style.display = 'flex';
    return;
  }

  var currentUser = IMC_API.getCurrentUser();

  // ---- Check if already a vendor ----
  console.log('[Vendor] Checking vendor status...');
  var profileResult = await IMC_API.getMyVendorProfile();
  console.log('[Vendor] Profile result:', JSON.stringify(profileResult));

  if (profileResult.success && profileResult.isVendor && profileResult.vendor) {
    if (formBox) formBox.style.display = 'none';
    if (alreadyBox) {
      var status = profileResult.vendor.status;
      var icon  = document.getElementById('alreadyVendorIcon');
      var title = document.getElementById('alreadyVendorTitle');
      var msg   = document.getElementById('alreadyVendorMsg');
      var link  = document.getElementById('alreadyVendorLink');

      if (status === 'approved') {
        if (icon)  icon.textContent  = '🏪';
        if (title) title.textContent = "You're already a vendor!";
        if (msg)   msg.textContent   = 'Your vendor profile is active. Go to your dashboard to manage products and orders.';
        if (link)  { link.style.display = 'inline-block'; link.href = 'vendor-dashboard.html'; link.textContent = 'Go to Vendor Dashboard'; }
      } else if (status === 'rejected') {
        if (icon)  icon.textContent  = '❌';
        if (title) title.textContent = 'Application Not Approved';
        if (msg)   msg.textContent   = 'Your vendor application was not approved. Contact support if you believe this was a mistake.';
        if (link)  { link.style.display = 'inline-block'; link.href = 'contact.html'; link.textContent = 'Contact Support'; }
      } else {
        // pending — payment is already confirmed at this point in the new
        // flow (a vendor record only exists once payment succeeded), so
        // frame this as "awaiting approval," not "incomplete."
        if (icon)  icon.textContent  = '✅';
        if (title) title.textContent = 'Your Vendor Account Is Ready';
        if (msg)   msg.textContent   = "Payment received — your subscription is active. We're reviewing your store now and will notify you once it's live, usually within 48 hours.";
        if (link)  link.style.display = 'none';
      }

      alreadyBox.style.display = 'flex';
    }
    return;
  }

  // ---- Auto-fill referral code ----
  var storedRef = localStorage.getItem('imc_ref_code') || '';
  var refInput  = document.getElementById('vendorRefCodeInput');
  var refNote   = document.getElementById('refCodeNote');

  if (storedRef && refInput) {
    refInput.value = storedRef;
    if (refNote) refNote.style.display = 'block';
    console.log('[Vendor] Referral code auto-filled:', storedRef);
  }

  // ---- Custom category toggle ----
  var catSelect    = document.getElementById('vendorCategory');
  var customCatGrp = document.getElementById('customCategoryGroup');

  if (catSelect) {
    catSelect.addEventListener('change', function () {
      if (customCatGrp) {
        customCatGrp.style.display = this.value === 'Others' ? 'block' : 'none';
      }
    });
  }

  // ---- Submit ----
  var submitBtn = document.getElementById('vendorSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleVendorSubmit);
  }

  // ---- Step navigation ----
  var step1 = document.getElementById('vendorStep1');
  var step2 = document.getElementById('vendorStep2');
  var continueBtn = document.getElementById('vendorContinueBtn');
  var backBtn     = document.getElementById('vendorBackBtn');

  function setStep(n) {
    if (step1) step1.style.display = n === 1 ? 'block' : 'none';
    if (step2) step2.style.display = n === 2 ? 'block' : 'none';
    document.querySelectorAll('.vendor-step-dot').forEach(function (dot) {
      dot.classList.toggle('active', parseInt(dot.getAttribute('data-step-dot')) <= n);
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', function () {
      if (!validateProfileStep()) return;
      setStep(2);
    });
  }
  if (backBtn) {
    backBtn.addEventListener('click', function () { setStep(1); });
  }

  // ---- Plan selection ----
  function updatePlanUI() {
    document.querySelectorAll('.vendor-plan-card').forEach(function (card) {
      var input = card.querySelector('input');
      card.classList.toggle('is-checked', input && input.checked);
    });
    var checked = document.querySelector('input[name="vendorPlan"]:checked');
    var btnText = document.getElementById('vendorBtnText');
    if (checked && btnText) {
      var amount = checked.closest('.vendor-plan-card').getAttribute('data-amount');
      btnText.innerHTML = '<i class="fas fa-credit-card"></i> Pay ₦' +
        parseInt(amount).toLocaleString() + ' & Activate Store';
    }
  }
  document.querySelectorAll('input[name="vendorPlan"]').forEach(function (input) {
    input.addEventListener('change', updatePlanUI);
  });
  updatePlanUI();

  // ---- Logo / cover image upload ----
  wireImageUpload('vendorLogoFile', 'vendorLogoBox', 'vendorLogoPlaceholder',
    'vendorLogoPreview', 'vendorLogoProgress', function (url) { UPLOADED_LOGO_URL = url; });
  wireImageUpload('vendorCoverFile', 'vendorCoverBox', 'vendorCoverPlaceholder',
    'vendorCoverPreview', 'vendorCoverProgress', function (url) { UPLOADED_COVER_URL = url; });

  function wireImageUpload(fileInputId, boxId, placeholderId, previewId, progressId, onDone) {
    var fileInput   = document.getElementById(fileInputId);
    var placeholder = document.getElementById(placeholderId);
    var preview     = document.getElementById(previewId);
    var progress    = document.getElementById(progressId);
    if (!fileInput) return;

    fileInput.addEventListener('change', async function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      if (placeholder) placeholder.style.display = 'none';
      if (progress)    progress.style.display    = 'flex';

      var formData = new FormData();
      formData.append('image', file);

      try {
        var result = await IMC_API.uploadVendorImage(formData);
        if (progress) progress.style.display = 'none';

        if (result.success && result.imageUrl) {
          if (preview) {
            preview.src = result.imageUrl;
            preview.style.display = 'block';
          }
          onDone(result.imageUrl);
        } else {
          if (placeholder) placeholder.style.display = 'flex';
          alert(result.message || 'Image upload failed. Please try again.');
        }
      } catch (err) {
        if (progress)    progress.style.display    = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        alert('Image upload failed. Please try again.');
      }
    });
  }

  function validateProfileStep() {
    var fullName    = getVal('vendorFullName');
    var university  = getVal('vendorUniversity');
    var bizName     = getVal('vendorBizName');
    var whatsApp    = getVal('vendorWhatsApp');
    var category    = getVal('vendorCategory');
    var customCat   = getVal('vendorCustomCategory');
    var description = getVal('vendorDescription');

    var errorBox = document.getElementById('vendorError');
    var errorMsg = document.getElementById('vendorErrorMsg');
    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (errorBox) errorBox.style.display = 'none';

    if (!fullName)    { showErr('Please enter your full name.');       return false; }
    if (!university)  { showErr('Please enter your university.');      return false; }
    if (!bizName)     { showErr('Please enter your business name.');   return false; }
    if (!whatsApp)    { showErr('Please enter your WhatsApp number.'); return false; }
    if (!category)    { showErr('Please select a category.');          return false; }
    if (category === 'Others' && !customCat) {
      showErr('Please specify your category.'); return false;
    }
    if (!description) { showErr('Please add a business description.'); return false; }
    return true;
  }

  // ================================================
  //   HANDLE SUBMIT
  // ================================================

  function handleVendorSubmit() {
    if (!validateProfileStep()) { setStep(1); return; }

    var checkedPlan = document.querySelector('input[name="vendorPlan"]:checked');
    if (!checkedPlan) {
      alert('Please select a plan.');
      return;
    }
    var planCard = checkedPlan.closest('.vendor-plan-card');
    var planKey  = planCard.getAttribute('data-plan');
    var amount   = parseInt(planCard.getAttribute('data-amount'));

    var refCode = (refInput ? refInput.value.trim() : '') ||
                  localStorage.getItem('imc_ref_code') || '';

    var formData = {
      fullName:       getVal('vendorFullName'),
      phone:          getVal('vendorPhone'),
      university:     getVal('vendorUniversity'),
      bizName:        getVal('vendorBizName'),
      whatsApp:       getVal('vendorWhatsApp'),
      campusLocation: getVal('vendorCampusLocation'),
      category:       getVal('vendorCategory') === 'Others' ? getVal('vendorCustomCategory') : getVal('vendorCategory'),
      description:    getVal('vendorDescription'),
      profilePicture: UPLOADED_LOGO_URL  || '',
      coverImage:     UPLOADED_COVER_URL || '',
      refCode:        refCode,
      plan:           planKey
    };

    // Save form BEFORE payment redirect — payment-success.html reads this
    // back after the user returns from Paystack's hosted checkout.
    localStorage.setItem('imc_vendor_form', JSON.stringify(formData));
    console.log('[Vendor] Form saved:', JSON.stringify(formData));
    console.log('[Vendor] Opening payment for plan:', planKey, '₦' + amount);

    var submitBtn = document.getElementById('vendorSubmitBtn');
    var btnText   = document.getElementById('vendorBtnText');
    var spinner   = document.getElementById('vendorSpinner');
    if (btnText)   btnText.style.display = 'none';
    if (spinner)   spinner.style.display = 'inline';
    if (submitBtn) submitBtn.disabled    = true;

    IMCPaystack.openPayment({
      amount:      amount,
      type:        'vendor_registration',
      description: 'Vendor Registration (' + (planKey === '12months' ? '12 Months' : '6 Months') + ') — Inside My Campus',
      email:       currentUser.email,
      metadata: {
        userId:     currentUser.id || currentUser._id || '',
        userEmail:  currentUser.email,
        bizName:    formData.bizName,
        plan:       planKey,
        vendorForm: formData
      },
      onCancel: function () {
        if (btnText)   btnText.style.display = 'inline';
        if (spinner)   spinner.style.display = 'none';
        if (submitBtn) submitBtn.disabled    = false;
      }
    });
    // openPayment redirects the browser to Paystack's hosted checkout on
    // success — nothing more happens on this page after this call.
    // Verification + vendor creation happens on payment-success.html.
  }

  function showBanner(msg) {
    var b    = document.createElement('div');
    b.style.cssText =
      'background:#e8f4ff;border:1px solid #1a3c8f;border-radius:8px;' +
      'padding:12px 16px;margin-bottom:16px;font-size:14px;color:#1a3c8f;';
    b.textContent = msg;
    var fb = document.getElementById('vendorFormBox');
    if (fb) fb.insertBefore(b, fb.firstChild);
  }

});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}