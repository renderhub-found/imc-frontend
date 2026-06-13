// ================================================
//   INSIDE MY CAMPUS — paystack.js
//   PRODUCTION ONLY — Real Paystack redirect
//   No simulation. No test cards. No fallbacks.
// ================================================

var IMCPaystack = (function () {
  'use strict';

  // ================================================
  //   OPEN PAYMENT
  // ================================================

  function openPayment(config) {
    console.log('[Paystack] openPayment called');
    console.log('[Paystack] type:', config.type);
    console.log('[Paystack] amount:', config.amount);

    // Validate
    if (!config.type) {
      console.error('[Paystack] ERROR: type is missing!');
      showError('Payment error: type is missing. Contact support.');
      return;
    }

    if (!config.amount || config.amount < 100) {
      console.error('[Paystack] ERROR: invalid amount:', config.amount);
      showError('Payment error: invalid amount.');
      return;
    }

    if (typeof IMC_API === 'undefined') {
      console.error('[Paystack] ERROR: IMC_API not loaded!');
      showError('System error: API not loaded. Please refresh the page.');
      return;
    }

    if (!IMC_API.isLoggedIn()) {
      console.log('[Paystack] User not logged in. Redirecting...');
      window.location.href = 'login.html';
      return;
    }

    initiatePayment(config);
  }

  // ================================================
  //   INITIATE — calls backend then redirects
  // ================================================

  async function initiatePayment(config) {
    showLoading('Setting up your payment...');

    try {
      console.log('[Paystack] Calling /api/payments/initialize...');

      var result = await IMC_API.initializePayment(
        config.amount,
        config.type,
        config.description || config.type,
        config.metadata    || {}
      );

      hideLoading();

      console.log('[Paystack] Initialize result:', JSON.stringify(result));

      if (!result.success) {
        console.error('[Paystack] Init failed:', result.message);
        showError(result.message || 'Payment setup failed. Please try again.');
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        return;
      }

      if (!result.authorizationUrl) {
        console.error('[Paystack] No authorizationUrl returned!');
        showError('Payment URL missing. Please try again.');
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        return;
      }

      // Save pending payment for verification after redirect
      var pending = {
        reference:   result.reference,
        type:        config.type,
        amount:      config.amount,
        description: config.description || config.type,
        metadata:    config.metadata    || {}
      };

      localStorage.setItem('imc_pending_payment', JSON.stringify(pending));
      console.log('[Paystack] Pending payment saved:', JSON.stringify(pending));
      console.log('[Paystack] Redirecting to Paystack...');

      // Redirect to real Paystack checkout
      window.location.href = result.authorizationUrl;

    } catch (err) {
      hideLoading();
      console.error('[Paystack] Unexpected error:', err.message);
      showError('Unexpected error. Please try again.');
      if (typeof config.onCancel === 'function') {
        config.onCancel();
      }
    }
  }

  // ================================================
  //   HANDLE REDIRECT RETURN
  //   Called from payment-success.html
  // ================================================

  async function handleRedirectReturn() {
    var params    = new URLSearchParams(window.location.search);
    var reference = params.get('reference') ||
                    params.get('trxref')    || '';

    console.log('[Paystack] handleRedirectReturn. Reference:', reference);

    if (!reference) {
      console.log('[Paystack] No reference in URL');
      return null;
    }

    var pendingStr = localStorage.getItem('imc_pending_payment');
    var vendorFormStr = localStorage.getItem('imc_vendor_form');

    var pending    = null;
    var vendorForm = null;

    try { pending    = JSON.parse(pendingStr    || 'null'); } catch (e) {}
    try { vendorForm = JSON.parse(vendorFormStr || 'null'); } catch (e) {}

    if (!pending) {
      console.error('[Paystack] No pending payment found in localStorage');
      return {
        success: false,
        message: 'Payment session expired. Contact support with ref: ' + reference
      };
    }

    console.log('[Paystack] Verifying. Type:', pending.type);
    console.log('[Paystack] vendorForm:', vendorForm ? 'present' : 'missing');

    var result = await IMC_API.verifyPayment(
      reference,
      pending.type,
      pending.metadata || {},
      vendorForm
    );

    console.log('[Paystack] Verify result:', JSON.stringify(result));

    if (result.success) {
      localStorage.removeItem('imc_pending_payment');
      console.log('[Paystack] ✅ Payment verified successfully');
    }

    return result;
  }

  // ================================================
  //   LOADING OVERLAY
  // ================================================

  function showLoading(message) {
    var old = document.getElementById('imc_pay_loading');
    if (old) old.remove();

    var el       = document.createElement('div');
    el.id        = 'imc_pay_loading';
    el.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:999999;' +
      'display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;gap:16px;';
    el.innerHTML =
      '<div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.3);' +
      'border-top-color:#fff;border-radius:50%;' +
      'animation:imc_spin .8s linear infinite;"></div>' +
      '<div style="color:#fff;font-size:15px;font-weight:600;' +
      'font-family:Inter,sans-serif;">' + (message || 'Please wait...') + '</div>' +
      '<style>@keyframes imc_spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
  }

  function hideLoading() {
    var el = document.getElementById('imc_pay_loading');
    if (el) el.remove();
  }

  // ================================================
  //   ERROR POPUP
  // ================================================

  function showError(message) {
    var old = document.getElementById('imc_pay_error');
    if (old) old.remove();

    var overlay       = document.createElement('div');
    overlay.id        = 'imc_pay_error';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:999999;' +
      'display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px 24px;' +
      'max-width:380px;width:100%;text-align:center;font-family:Inter,sans-serif;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="font-size:44px;margin-bottom:12px;">⚠️</div>' +
      '<h3 style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:10px;">' +
      'Payment Error</h3>' +
      '<p style="font-size:14px;color:#555;line-height:1.5;margin-bottom:24px;">' +
      message + '</p>' +
      '<button id="imc_pay_err_close" ' +
      'style="background:#e85d04;color:#fff;border:none;padding:12px 32px;' +
      'border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;' +
      'font-family:Inter,sans-serif;">Close</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('imc_pay_err_close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ================================================
  //   PUBLIC API
  // ================================================

  return {
    openPayment:          openPayment,
    handleRedirectReturn: handleRedirectReturn,
    showLoading:          showLoading,
    hideLoading:          hideLoading
  };

})();