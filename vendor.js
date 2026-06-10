// ================================================
//   VENDOR REGISTRATION — vendor.js
//   Fixed: saves form data before Paystack redirect
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
    currentUser = JSON.parse(
      localStorage.getItem('imc_user') || 'null'
    );
  } catch (e) {
    currentUser = null;
  }

  if (!loggedIn || !currentUser) {
    if (formBox)        formBox.style.display        = 'none';
    if (notLoggedInBox) notLoggedInBox.style.display = 'flex';
    return;
  }

  // ---- Check if already a vendor ----
  console.log('[Vendor] Checking if already vendor...');
  var profileResult = await IMC_API.getMyVendorProfile();
  console.log('[Vendor] Profile result:', JSON.stringify(profileResult));

  if (profileResult.success && profileResult.isVendor) {
    var vendor = profileResult.vendor;

    // Already has vendor record
    if (formBox)    formBox.style.display    = 'none';
    if (alreadyBox) alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Check if user has a pending paid payment ----
  // If they paid but vendor record was not created, fix it now
  var savedForm = null;
  try {
    savedForm = JSON.parse(
      localStorage.getItem('imc_vendor_form') || 'null'
    );
  } catch (e) {
    savedForm = null;
  }

  var savedRef = localStorage.getItem('imc_vendor_payref');

  if (savedForm && savedRef) {
    console.log('[Vendor] Found saved form + payment ref. Auto-completing...');
    showInfoBanner(
      'We found a completed payment. Finishing your registration...'
    );
    await completeVendorRegistration(savedForm, savedRef);
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

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      handleVendorSubmit();
    });
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
    if (!description) {
      showErr('Please add a business description.'); return;
    }

    var finalCategory = category === 'Others' ? customCat : category;

    // Save form data BEFORE redirecting to Paystack
    // This is critical — the page will reload after payment
    var vendorFormData = {
      fullName:    fullName,
      university:  university,
      bizName:     bizName,
      whatsApp:    whatsApp,
      category:    finalCategory,
      description: description,
      refCode:     refCode || localStorage.getItem('imc_ref_code') || ''
    };

    console.log('[Vendor] Saving form data to localStorage...');
    localStorage.setItem(
      'imc_vendor_form',
      JSON.stringify(vendorFormData)
    );
    console.log('[Vendor] Form data saved.');
    console.log('[Vendor] Opening Paystack payment...');
    console.log('[Vendor] type: vendor_registration');
    console.log('[Vendor] amount: 5000');

    // Open payment
    IMCPaystack.openPayment({
      amount:      5000,
      type:        'vendor_registration',
      description: 'Vendor Registration — Inside My Campus',
      email:       currentUser.email,
      metadata: {
        userId:    currentUser.id || currentUser._id || '',
        userEmail: currentUser.email,
        bizName:   bizName
      },
      onSuccess: function (payRef) {
        // This runs if payment completes WITHOUT a page redirect
        // (e.g. inline Paystack widget)
        console.log('[Vendor] onSuccess triggered:', payRef);
        var ref = payRef && payRef.reference
          ? payRef.reference
          : String(payRef || 'PAID');
        completeVendorRegistration(vendorFormData, ref);
      },
      onCancel: function () {
        // Clear saved form if they cancel
        localStorage.removeItem('imc_vendor_form');
        var errorBox = document.getElementById('vendorError');
        var errorMsg = document.getElementById('vendorErrorMsg');
        if (errorMsg) errorMsg.textContent   = 'Payment cancelled.';
        if (errorBox) errorBox.style.display = 'flex';
      }
    });
  }

  // ================================================
  //   COMPLETE VENDOR REGISTRATION
  //   Called after successful payment
  // ================================================

  async function completeVendorRegistration(formData, paymentRef) {
    console.log('[Vendor] completeVendorRegistration called');
    console.log('[Vendor] paymentRef:', paymentRef);
    console.log('[Vendor] formData:', JSON.stringify(formData));

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
      console.log('[Vendor] Vendor created successfully!');

      // Clean up localStorage
      localStorage.removeItem('imc_vendor_form');
      localStorage.removeItem('imc_vendor_payref');
      localStorage.removeItem('imc_ref_code');

      // Update user role
      currentUser.role = 'vendor';
      localStorage.setItem('imc_user', JSON.stringify(currentUser));

      // Redirect
      window.location.href = 'vendor-dashboard.html';

    } else {
      console.error('[Vendor] registerVendor failed:', result.message);

      // If vendor already exists, just redirect
      if (result.message && (
        result.message.includes('already registered') ||
        result.message.includes('already a vendor')
      )) {
        console.log('[Vendor] Already a vendor — redirecting...');
        localStorage.removeItem('imc_vendor_form');
        localStorage.removeItem('imc_vendor_payref');
        window.location.href = 'vendor-dashboard.html';
        return;
      }

      if (errorMsg) errorMsg.textContent   = result.message || 'Registration failed.';
      if (errorBox) errorBox.style.display = 'flex';
      if (btnText)  btnText.style.display  = 'inline';
      if (spinner)  spinner.style.display  = 'none';
      if (submitBtn) submitBtn.disabled    = false;
    }
  }

  function showInfoBanner(msg) {
    var banner       = document.createElement('div');
    banner.className = 'auth-success';
    banner.style.cssText = 'margin-bottom:16px;';
    banner.innerHTML =
      '<i class="fas fa-info-circle"></i><span>' + msg + '</span>';
    var fb = document.getElementById('vendorFormBox');
    if (fb) fb.insertBefore(banner, fb.firstChild);
  }

});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}