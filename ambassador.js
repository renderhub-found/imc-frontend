// ================================================
//   AMBASSADOR REGISTRATION — ambassador.js
//   Single clean submit handler — no duplicates
// ================================================

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  if (!IMC_API.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Check if already an ambassador
  var profileResult = await IMC_API.getMyAmbassadorProfile();
  if (profileResult.success && profileResult.isAmbassador) {
    window.location.href = 'ambassador-dashboard.html';
    return;
  }

  var submitBtn = document.getElementById('ambSubmitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    var fullName   = getVal('ambFullName');
    var university  = getVal('ambUniversity');
    var username    = getVal('ambUsername');
    var whatsApp    = getVal('ambWhatsApp');
    var social      = getVal('ambSocial');
    var reason      = getVal('ambReason');

    var errorBox = document.getElementById('ambError');
    var errorMsg = document.getElementById('ambErrorMsg');
    if (errorBox) errorBox.style.display = 'none';

    function showErr(msg) {
      if (errorMsg) errorMsg.textContent   = msg;
      if (errorBox) errorBox.style.display = 'flex';
    }

    if (!fullName)   { showErr('Please enter your full name.');     return; }
    if (!university) { showErr('Please enter your university.');    return; }
    if (!username)   { showErr('Please choose a username.');        return; }
    if (!whatsApp)    { showErr('Please enter your WhatsApp number.'); return; }
    if (!social)      { showErr('Please enter your social handle.'); return; }
    if (!reason)      { showErr('Please tell us why you want to join.'); return; }

    var btnText = document.getElementById('ambBtnText');
    var spinner = document.getElementById('ambSpinner');
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline';
    submitBtn.disabled = true;

    console.log('[Ambassador] Submitting registration...');

    var result = await IMC_API.registerAmbassador({
      fullName:   fullName,
      university: university,
      username:   username,
      whatsApp:   whatsApp,
      social:     social,
      reason:     reason
    });

    console.log('[Ambassador] Registration result:', JSON.stringify(result));

    if (result.success) {
      var user = IMC_API.getCurrentUser();
      if (user) {
        user.role = 'ambassador';
        localStorage.setItem('imc_user', JSON.stringify(user));
      }
      console.log('[Ambassador] Redirecting to ambassador-dashboard.html');
      window.location.href = 'ambassador-dashboard.html';
      return;
    }

    // Already registered — still send to dashboard, not an error
    if (result.message && result.message.toLowerCase().indexOf('already') !== -1) {
      window.location.href = 'ambassador-dashboard.html';
      return;
    }

    showErr(result.message || 'Registration failed. Please try again.');
    if (btnText) btnText.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
    submitBtn.disabled = false;
  });
});

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}