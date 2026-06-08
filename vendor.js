// ================================================
//   VENDOR REGISTRATION — vendor.js (Frontend)
//   Now connects to real backend API
// ================================================

window.addEventListener('DOMContentLoaded', async function () {

  var formBox        = document.getElementById('vendorFormBox');
  var alreadyBox     = document.getElementById('alreadyVendorBox');
  var notLoggedInBox = document.getElementById('notLoggedInBox');

  // ---- Check login status ----
  var loggedIn    = localStorage.getItem('imc_logged_in');
  var currentUser = JSON.parse(
    localStorage.getItem('imc_user') || 'null'
  );

  if (!loggedIn || !currentUser) {
    if (formBox)        formBox.style.display        = 'none';
    if (notLoggedInBox) notLoggedInBox.style.display = 'flex';
    return;
  }

  // ---- Check if already a vendor (ask backend) ----
  var profileResult = await IMC_API.getMyVendorProfile();

  if (profileResult.success && profileResult.isVendor) {
    if (formBox)    formBox.style.display    = 'none';
    if (alreadyBox) alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Auto-fill referral code from URL ----
  var urlParams    = new URLSearchParams(window.location.search);
  var refFromUrl   = urlParams.get('ref');
  var refInput     = document.getElementById('vendorRefCodeInput');
  var refNote      = document.getElementById('refCodeNote');

  if (refFromUrl && refInput) {
    refInput.value = refFromUrl;
    if (refNote) refNote.style.display = 'block';
    localStorage.setItem('imc_ref_code', refFromUrl);
  }

  // ---- Show/hide custom category ----
  var catSelect     = document.getElementById('vendorCategory');
  var customCatGrp  = document.getElementById('customCategoryGroup');

  if (catSelect) {
    catSelect.addEventListener('change', function () {
      if (this.value === 'Others') {
        if (customCatGrp) customCatGrp.style.display = 'block';
      } else {
        if (customCatGrp) customCatGrp.style.display = 'none';
      }
    });
  }

  // ---- Submit vendor form ----
  var submitBtn = document.getElementById('vendorSubmitBtn');

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {

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
        if (errorMsg) errorMsg.textContent  = msg;
        if (errorBox) errorBox.style.display = 'flex';
      }

      // Validate
      if (!fullName)    { showErr('Please enter your full name.'); return; }
      if (!university)  { showErr('Please enter your university.'); return; }
      if (!bizName)     { showErr('Please enter your business name.'); return; }
      if (!whatsApp)    { showErr('Please enter your WhatsApp number.'); return; }
      if (!category)    { showErr('Please select a category.'); return; }
      if (category === 'Others' && !customCat) {
        showErr('Please specify your category.'); return;
      }
      if (!description) { showErr('Please add a business description.'); return; }

      var finalCategory = category === 'Others' ? customCat : category;

      // Open Paystack payment
      IMCPaystack.openPayment({
        amount:      10000,
        description: 'Vendor Registration — Inside My Campus',
        email:       currentUser.email,

        onSuccess: async function (paymentRef) {
          // Show spinner
          var btnText = document.getElementById('vendorBtnText');
          var spinner = document.getElementById('vendorSpinner');
          if (btnText) btnText.style.display = 'none';
          if (spinner) spinner.style.display = 'inline';
          submitBtn.disabled = true;

          // Send to backend
          var result = await IMC_API.registerVendor({
            fullName:    fullName,
            university:  university,
            bizName:     bizName,
            whatsApp:    whatsApp,
            category:    finalCategory,
            description: description,
            refCode:     refCode ||
              localStorage.getItem('imc_ref_code') || '',
            paymentRef:  paymentRef.reference || 'PAID'
          });

          if (result.success) {
            // Update user in localStorage
            currentUser.role = 'vendor';
            localStorage.setItem('imc_user', JSON.stringify(currentUser));

            // Redirect to dashboard
            window.location.href = 'vendor-dashboard.html';

          } else {
            showErr(result.message || 'Registration failed. Try again.');
            if (btnText) btnText.style.display = 'inline';
            if (spinner) spinner.style.display = 'none';
            submitBtn.disabled = false;
          }
        },

        onCancel: function () {
          showErr('Payment cancelled. Please try again.');
        }
      });
    });
  }

});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}