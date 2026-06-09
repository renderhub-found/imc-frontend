// ================================================
//   VENDOR REGISTRATION — vendor.js
//   Production version — real Paystack only
// ================================================

window.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  var formBox        = document.getElementById('vendorFormBox');
  var alreadyBox     = document.getElementById('alreadyVendorBox');
  var notLoggedInBox = document.getElementById('notLoggedInBox');

  // ---- Check login ----
  var loggedIn    = localStorage.getItem('imc_logged_in');
  var currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');
  } catch (e) {
    currentUser = null;
  }

  if (!loggedIn || !currentUser) {
    if (formBox)        formBox.style.display        = 'none';
    if (notLoggedInBox) notLoggedInBox.style.display = 'flex';
    return;
  }

  // ---- Check if already a vendor ----
  var profileResult = await IMC_API.getMyVendorProfile();

  if (profileResult.success && profileResult.isVendor) {
    if (formBox)    formBox.style.display    = 'none';
    if (alreadyBox) alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Auto-fill referral code from URL ----
  var urlParams  = new URLSearchParams(window.location.search);
  var refFromUrl = urlParams.get('ref') || '';
  var refInput   = document.getElementById('vendorRefCodeInput');
  var refNote    = document.getElementById('refCodeNote');

  if (refFromUrl && refInput) {
    refInput.value = refFromUrl;
    if (refNote) refNote.style.display = 'block';
    localStorage.setItem('imc_ref_code', refFromUrl);
  }

  // ---- Show/hide custom category ----
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

  if (!submitBtn) {
    console.error('vendorSubmitBtn not found in DOM');
    return;
  }

  submitBtn.addEventListener('click', function () {
    handleVendorSubmit();
  });

  function handleVendorSubmit() {
    var fullName    = getVal('vendorFullName');
    var university  = getVal('vendorUniversity');
    var bizName     = getVal('vendorBizName');
    var whatsApp    = getVal('vendorWhatsApp');
    var category    = getVal('vendorCategory');
    var customCat   = getVal('vendorCustomCategory');
    var description = getVal('vendorDescription');
    var refCode     = refInput ? refInput.value.trim() : '';

    var errorBox = document.getElementById('vendorError');
    var errorMsg = document.getElementById('vendorErrorMsg');

    if (errorBox) errorBox.style.display = 'none';

    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Validate
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

    // Save form data for after payment
    var vendorFormData = {
      fullName:    fullName,
      university:  university,
      bizName:     bizName,
      whatsApp:    whatsApp,
      category:    finalCategory,
      description: description,
      refCode:     refCode || localStorage.getItem('imc_ref_code') || ''
    };

    localStorage.setItem('imc_vendor_form', JSON.stringify(vendorFormData));

    // Open Paystack payment
    IMCPaystack.openPayment({
      amount:      10000,
      type:        'vendor_registration',
      description: 'Vendor Registration Fee — Inside My Campus',
      email:       currentUser.email,
      metadata: {
        userId:    currentUser.id   || currentUser._id || '',
        userEmail: currentUser.email,
        bizName:   bizName
      },
      onSuccess: function (payRef) {
        handleVendorAfterPayment(vendorFormData, payRef);
      },
      onCancel: function () {
        showErr('Payment was cancelled. Please try again.');
        localStorage.removeItem('imc_vendor_form');
      }
    });
  }

  async function handleVendorAfterPayment(vendorFormData, payRef) {
    var btnText = document.getElementById('vendorBtnText');
    var spinner = document.getElementById('vendorSpinner');
    var errorBox = document.getElementById('vendorError');
    var errorMsg = document.getElementById('vendorErrorMsg');
    var submitBtn = document.getElementById('vendorSubmitBtn');

    if (btnText)   btnText.style.display   = 'none';
    if (spinner)   spinner.style.display   = 'inline';
    if (submitBtn) submitBtn.disabled      = true;

    var reference = payRef && payRef.reference
      ? payRef.reference
      : (payRef || 'PAID');

    var result = await IMC_API.registerVendor({
      fullName:    vendorFormData.fullName,
      university:  vendorFormData.university,
      bizName:     vendorFormData.bizName,
      whatsApp:    vendorFormData.whatsApp,
      category:    vendorFormData.category,
      description: vendorFormData.description,
      refCode:     vendorFormData.refCode,
      paymentRef:  reference
    });

    if (result.success) {
      currentUser.role = 'vendor';
      localStorage.setItem('imc_user', JSON.stringify(currentUser));
      localStorage.removeItem('imc_vendor_form');
      localStorage.removeItem('imc_ref_code');
      window.location.href = 'vendor-dashboard.html';
    } else {
      if (errorMsg) errorMsg.textContent   = result.message || 'Registration failed.';
      if (errorBox) errorBox.style.display = 'flex';
      if (btnText)  btnText.style.display  = 'inline';
      if (spinner)  spinner.style.display  = 'none';
      if (submitBtn) submitBtn.disabled    = false;
    }
  }

});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}