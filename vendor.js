// ================================================
//   VENDOR REGISTRATION — vendor.js
//   Saves form to localStorage before payment redirect
// ================================================

window.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  var formBox        = document.getElementById('vendorFormBox');
  var alreadyBox     = document.getElementById('alreadyVendorBox');
  var notLoggedInBox = document.getElementById('notLoggedInBox');

  // ---- Check login ----
  if (!IMC_API.isLoggedIn()) {
    if (formBox)        formBox.style.display        = 'none';
    if (notLoggedInBox) notLoggedInBox.style.display = 'flex';
    return;
  }

  var currentUser = IMC_API.getCurrentUser();

  // ---- Check if already vendor ----
  console.log('[Vendor] Checking vendor status...');
  var profileResult = await IMC_API.getMyVendorProfile();
  console.log('[Vendor] Profile:', JSON.stringify(profileResult));

  if (profileResult.success && profileResult.isVendor) {
    if (formBox)    formBox.style.display    = 'none';
    if (alreadyBox) alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Check for incomplete registration (paid but not created) ----
  var savedForm = null;
  var savedRef  = localStorage.getItem('imc_vendor_payref');

  try {
    savedForm = JSON.parse(localStorage.getItem('imc_vendor_form') || 'null');
  } catch (e) { savedForm = null; }

  if (savedRef && savedForm) {
    console.log('[Vendor] Found saved payment ref + form. Auto-completing...');
    showBanner('Your payment was received. Completing registration...', 'info');
    await completeVendorRegistration(savedForm, savedRef);
    return;
  }

  // ---- Referral code from URL ----
  var urlParams  = new URLSearchParams(window.location.search);
  var refFromUrl = urlParams.get('ref') || '';
  var refInput   = document.getElementById('vendorRefCodeInput');
  var refNote    = document.getElementById('refCodeNote');

  if (refFromUrl && refInput) {
    refInput.value = refFromUrl;
    if (refNote) refNote.style.display = 'block';
    localStorage.setItem('imc_ref_code', refFromUrl);
  }

  // ---- Custom category toggle ----
  var catSelect    = document.getElementById('vendorCategory');
  var customCatGrp = document.getElementById('customCategoryGroup');

  if (catSelect) {
    catSelect.addEventListener('change', function () {
      if (customCatGrp) {
        customCatGrp.style.display =
          this.value === 'Others' ? 'block' : 'none';
      }
    });
  }

  // ---- Submit button ----
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

    function showErr(msg) {
      var eb = document.getElementById('vendorError');
      var em = document.getElementById('vendorErrorMsg');
      if (em) em.textContent   = msg;
      if (eb) eb.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    var eb = document.getElementById('vendorError');
    if (eb) eb.style.display = 'none';

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

    // Save form data BEFORE redirect
    var formData = {
      fullName:    fullName,
      university:  university,
      bizName:     bizName,
      whatsApp:    whatsApp,
      category:    finalCategory,
      description: description,
      refCode:     refCode
    };

    console.log('[Vendor] Saving form data:', JSON.stringify(formData));
    localStorage.setItem('imc_vendor_form', JSON.stringify(formData));

    console.log('[Vendor] Opening payment — type: vendor_registration');

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
        showErr('Payment cancelled. Please try again.');
      }
    });
  }

  // ================================================
  //   COMPLETE REGISTRATION AFTER PAYMENT
  // ================================================

  async function completeVendorRegistration(formData, paymentRef) {
    console.log('[Vendor] completeVendorRegistration');
    console.log('[Vendor] ref:', paymentRef);
    console.log('[Vendor] form:', JSON.stringify(formData));

    var submitBtn = document.getElementById('vendorSubmitBtn');
    var btnText   = document.getElementById('vendorBtnText');
    var spinner   = document.getElementById('vendorSpinner');

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
      var eb = document.getElementById('vendorError');
      var em = document.getElementById('vendorErrorMsg');
      if (em) em.textContent   = result.message || 'Registration failed.';
      if (eb) eb.style.display = 'flex';
      if (btnText)   btnText.style.display   = 'inline';
      if (spinner)   spinner.style.display   = 'none';
      if (submitBtn) submitBtn.disabled      = false;
    }
  }

  function showBanner(msg, type) {
    var banner    = document.createElement('div');
    banner.className = type === 'info' ? 'auth-info' : 'auth-success';
    banner.innerHTML = '<span>' + msg + '</span>';
    var fb = document.getElementById('vendorFormBox');
    if (fb) fb.insertBefore(banner, fb.firstChild);
  }

});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}