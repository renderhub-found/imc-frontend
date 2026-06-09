// ================================================
//   INSIDE MY CAMPUS — paystack.js
//   PRODUCTION ONLY
//   No card forms. No simulation. No test mode.
//   Real Paystack redirect only.
// ================================================

var IMCPaystack = (function () {
  'use strict';

  // ================================================
  //   OPEN PAYMENT — main entry point
  // ================================================

  function openPayment(config) {
    console.log('[Paystack] openPayment called');
    console.log('[Paystack] type:', config.type);
    console.log('[Paystack] amount:', config.amount);
    console.log('[Paystack] email:', config.email);

    // Validate before anything
    if (!config.type) {
      console.error('[Paystack] MISSING: type');
      showError('Payment configuration error: type is missing.');
      return;
    }

    if (!config.amount || config.amount < 100) {
      console.error('[Paystack] MISSING or INVALID: amount');
      showError('Payment configuration error: invalid amount.');
      return;
    }

    if (!IMC_API.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    // Go
    startPayment(config);
  }

  // ================================================
  //   START PAYMENT — calls backend then redirects
  // ================================================

  async function startPayment(config) {
    showLoading('Preparing your payment...');

    try {
      var result = await IMC_API.initializePayment(
        config.amount,
        config.type,
        config.description || config.type,
        config.metadata    || {}
      );

      hideLoading();

      console.log('[Paystack] Backend response:', JSON.stringify(result));

      if (!result.success) {
        console.error('[Paystack] Init failed:', result.message);
        showError(result.message || 'Payment setup failed. Please try again.');
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        return;
      }

      if (!result.authorizationUrl) {
        console.error('[Paystack] No authorizationUrl in response');
        showError('Payment URL not received. Please try again.');
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        return;
      }

      // Save pending payment for verification after redirect
      var pendingPayment = {
        reference:   result.reference,
        type:        config.type,
        amount:      config.amount,
        description: config.description || config.type,
        metadata:    config.metadata    || {}
      };

      localStorage.setItem(
        'imc_pending_payment',
        JSON.stringify(pendingPayment)
      );

      console.log('[Paystack] Redirecting to Paystack...');
      console.log('[Paystack] URL:', result.authorizationUrl);

      // Redirect to Paystack checkout
      window.location.href = result.authorizationUrl;

    } catch (err) {
      hideLoading();
      console.error('[Paystack] Unexpected error:', err.message);
      showError('An unexpected error occurred. Please try again.');
      if (typeof config.onCancel === 'function') {
        config.onCancel();
      }
    }
  }

  // ================================================
  //   HANDLE RETURN FROM PAYSTACK
  //   Call this on payment-success.html
  // ================================================

  async function handleRedirectReturn() {
    var urlParams = new URLSearchParams(window.location.search);
    var reference = urlParams.get('reference') ||
                    urlParams.get('trxref')    ||
                    '';

    console.log('[Paystack] handleRedirectReturn');
    console.log('[Paystack] Reference from URL:', reference);

    if (!reference) {
      console.log('[Paystack] No reference found in URL');
      return null;
    }

    var pendingStr = localStorage.getItem('imc_pending_payment');

    if (!pendingStr) {
      console.log('[Paystack] No pending payment in storage');
      return { success: false, message: 'Payment session expired.' };
    }

    var pending;
    try {
      pending = JSON.parse(pendingStr);
    } catch (e) {
      console.error('[Paystack] Could not parse pending payment');
      return { success: false, message: 'Payment data corrupted.' };
    }

    console.log('[Paystack] Verifying. Type:', pending.type);

    var result = await IMC_API.verifyPayment(
      reference,
      pending.type,
      pending.metadata || {}
    );

    console.log('[Paystack] Verify result:', JSON.stringify(result));

    if (result.success) {
      localStorage.removeItem('imc_pending_payment');
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
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);' +
      'z-index:999999;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:16px;';

    el.innerHTML =
      '<div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.2);' +
      'border-top-color:#fff;border-radius:50%;' +
      'animation:imc_ps_spin 0.8s linear infinite;"></div>' +
      '<div style="color:#fff;font-size:15px;font-weight:600;' +
      'font-family:Inter,sans-serif;">' +
      (message || 'Please wait...') +
      '</div>' +
      '<style>' +
      '@keyframes imc_ps_spin{0%{transform:rotate(0deg)}' +
      '100%{transform:rotate(360deg)}}' +
      '</style>';

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
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);' +
      'z-index:999999;display:flex;align-items:center;' +
      'justify-content:center;padding:20px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px 24px;' +
      'max-width:380px;width:100%;text-align:center;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.25);' +
      'font-family:Inter,sans-serif;">' +
      '<div style="font-size:44px;margin-bottom:12px;">⚠️</div>' +
      '<h3 style="font-size:18px;font-weight:700;color:#1a1a2e;' +
      'margin-bottom:10px;">Payment Error</h3>' +
      '<p style="font-size:14px;color:#555;line-height:1.5;' +
      'margin-bottom:24px;">' + message + '</p>' +
      '<button id="imc_pay_err_btn" ' +
      'style="background:#e85d04;color:#fff;border:none;' +
      'padding:12px 32px;border-radius:8px;font-size:15px;' +
      'font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">' +
      'Close' +
      '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('imc_pay_err_btn').addEventListener(
      'click', function () { overlay.remove(); }
    );

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