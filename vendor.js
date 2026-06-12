// ================================================
//   VENDOR REGISTRATION — vendor.js
// ================================================

window.addEventListener('DOMContentLoaded', async function () {
  'use strict';

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

  if (profileResult.success && profileResult.isVendor) {
    if (formBox)    formBox.style.display    = 'none';
    if (alreadyBox) alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Auto-recover from incomplete registration ----
  var savedRef  = localStorage.getItem('imc_vendor_payref');
  var savedForm = null;
  try {
    savedForm = JSON.parse(localStorage.getItem('imc_vendor_form') || 'null');
  } catch (e) {}

  if (savedRef && savedForm) {
    console.log('[Vendor] Found saved ref + form. Auto-completing...');
    showBanner('Completing your registration from previous payment...', 'info');
    await completeVendorRegistration(savedForm, savedRef);
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

  // ================================================
  //   HANDLE SUBMIT
  // ================================================

  function handleVendorSubmit() {
    var fullName    = getVal('vendorFullName');
    var university  = getVal('vendorUniversity');
    var bizName     = getVal('vendorBizName');
    var whatsApp    = getVal('vendorWhatsApp');
    var category    = getVal('vendorCategory');
    var customCat   = getVal('vendorCustomCategory');
    var description = getVal('vendorDescription');
    var refCode     = (refInput ? refInput.value.trim() : '') ||
                      localStorage.getItem('imc_ref_code') || '';

    var errorBox = document.getElementById('vendorError');
    var errorMsg = document.getElementById('vendorErrorMsg');
    if (errorBox) errorBox.style.display = 'none';

    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!fullName)    { showErr('Please enter your full name.');       return; }
    if (!university)  { showErr('Please enter your university.');      return; }
    if (!bizName)     { showErr('Please enter your business name.');   return; }
    if (!whatsApp)    { showErr('Please enter your WhatsApp number.'); return; }
    if (!category)    { showErr('Please select a category.');          return; }
    if (category === 'Others' && !customCat) {
      showErr('Please specify your category.'); return;
    }
    if (!description) { showErr('Please add a business description.'); return; }

    var finalCategory = category === 'Others' ? customCat : category;

    var formData = {
      fullName:    fullName,
      university:  university,
      bizName:     bizName,
      whatsApp:    whatsApp,
      category:    finalCategory,
      description: description,
      refCode:     refCode
    };

    // Save form BEFORE payment redirect
    localStorage.setItem('imc_vendor_form', JSON.stringify(formData));
    console.log('[Vendor] Form saved:', JSON.stringify(formData));
    console.log('[Vendor] Opening payment...');

    IMCPaystack.openPayment({
      amount:      5000,
      type:        'vendor_registration',
      description: 'Vendor Registration — Inside My Campus',
      email:       currentUser.email,
      metadata: {
        userId:     currentUser.id || currentUser._id || '',
        userEmail:  currentUser.email,
        bizName:    bizName,
        vendorForm: formData
      },
      onSuccess: function (payRef) {
        var ref = payRef && payRef.reference ? payRef.reference : String(payRef);
        console.log('[Vendor] onSuccess ref:', ref);
        localStorage.setItem('imc_vendor_payref', ref);
        completeVendorRegistration(formData, ref);
      },
      onCancel: function () {
        localStorage.removeItem('imc_vendor_form');
        showErr('Payment cancelled.');
      }
    });
  }

  // ================================================
  //   COMPLETE REGISTRATION
  // ================================================

  async function completeVendorRegistration(formData, paymentRef) {
    console.log('[Vendor] completeVendorRegistration ref:', paymentRef);

    var submitBtn = document.getElementById('vendorSubmitBtn');
    var btnText   = document.getElementById('vendorBtnText');
    var spinner   = document.getElementById('vendorSpinner');
    var errorBox  = document.getElementById('vendorError');
    var errorMsg  = document.getElementById('vendorErrorMsg');

    if (btnText)   btnText.style.display   = 'none';
    if (spinner)   spinner.style.display   = 'inline';
    if (submitBtn) submitBtn.disabled      = true;

    var result = await IMC_API.registerVendor({
      fullName:    formData.fullName,
      university:  formData.university,
      bizName:     formData.bizName,
      whatsApp:    formData.whatsApp,
      category:    formData.category,
      description: formData.description,
      refCode:     formData.refCode || '',
      paymentRef:  paymentRef
    });

    console.log('[Vendor] registerVendor result:', JSON.stringify(result));

    if (result.success) {
      localStorage.removeItem('imc_vendor_form');
      localStorage.removeItem('imc_vendor_payref');
      localStorage.removeItem('imc_ref_code');

      var user = IMC_API.getCurrentUser();
      if (user) {
        user.role = 'vendor';
        localStorage.setItem('imc_user', JSON.stringify(user));
      }

      window.location.href = 'vendor-dashboard.html';

    } else if (result.message && result.message.includes('already')) {
      localStorage.removeItem('imc_vendor_form');
      localStorage.removeItem('imc_vendor_payref');
      window.location.href = 'vendor-dashboard.html';

    } else {
      if (errorMsg) errorMsg.textContent   = result.message || 'Registration failed.';
      if (errorBox) errorBox.style.display = 'flex';
      if (btnText)  btnText.style.display  = 'inline';
      if (spinner)  spinner.style.display  = 'none';
      if (submitBtn) submitBtn.disabled    = false;
    }
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