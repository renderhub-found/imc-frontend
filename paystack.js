// ================================================
//   INSIDE MY CAMPUS — paystack.js
//   Production: Real Paystack Bank Transfer
//   No simulation. No fake cards. Real payments only.
// ================================================

var IMCPaystack = (function () {
  'use strict';

  // ================================================
  //   MAIN ENTRY POINT
  //   Call this from any pay button
  // ================================================

  function openPayment(config) {
    /*
      config = {
        amount:      number    e.g. 5000
        type:        string    e.g. 'vendor_registration'
        description: string    e.g. 'Vendor Registration Fee'
        email:       string    user email
        metadata:    object    optional extra data
        onSuccess:   function  called after verification
        onCancel:    function  called if user cancels
      }
    */

    console.log('[Paystack] openPayment called');
    console.log('[Paystack] type:', config.type);
    console.log('[Paystack] amount:', config.amount);

    // Validate config before anything
    if (!config.type) {
      console.error('[Paystack] ERROR: type is missing from config!');
      alert('Payment configuration error: type is missing. Contact support.');
      return;
    }

    if (!config.amount || config.amount < 100) {
      console.error('[Paystack] ERROR: invalid amount:', config.amount);
      alert('Payment configuration error: invalid amount.');
      return;
    }

    if (!IMC_API.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }

    // Start real payment
    startRealPayment(config);
  }

  // ================================================
  //   STEP 1: CALL BACKEND TO INITIALIZE
  // ================================================

  async function startRealPayment(config) {
    showLoadingOverlay('Setting up your payment...');

    try {
      console.log('[Paystack] Calling /api/payments/initialize');

      var result = await IMC_API.initializePayment(
        config.amount,
        config.type,
        config.description || config.type,
        config.metadata    || {}
      );

      hideLoadingOverlay();

      console.log('[Paystack] Initialize result:', JSON.stringify(result));

      if (!result.success) {
        console.error('[Paystack] Init failed:', result.message);
        showErrorPopup(
          result.message || 'Could not set up payment. Please try again.'
        );
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        return;
      }

      // Save payment info for verification later
      localStorage.setItem('imc_pending_payment', JSON.stringify({
        reference:   result.reference,
        type:        config.type,
        amount:      config.amount,
        description: config.description || config.type,
        metadata:    config.metadata    || {}
      }));

      // Redirect to Paystack checkout
      console.log('[Paystack] Redirecting to Paystack checkout...');
      window.location.href = result.authorizationUrl;

    } catch (err) {
      hideLoadingOverlay();
      console.error('[Paystack] Unexpected error:', err.message);
      showErrorPopup('Payment setup failed. Please try again.');
      if (typeof config.onCancel === 'function') {
        config.onCancel();
      }
    }
  }

  // ================================================
  //   STEP 2: HANDLE RETURN FROM PAYSTACK
  //   Called on payment-success.html
  // ================================================

  async function handleRedirectReturn() {
    var urlParams = new URLSearchParams(window.location.search);
    var reference = urlParams.get('reference') ||
                    urlParams.get('trxref');

    console.log('[Paystack] Handling redirect return');
    console.log('[Paystack] Reference from URL:', reference);

    if (!reference) {
      console.log('[Paystack] No reference in URL');
      return null;
    }

    // Get saved payment config
    var pendingStr = localStorage.getItem('imc_pending_payment');
    if (!pendingStr) {
      console.log('[Paystack] No pending payment in localStorage');
      return null;
    }

    var pending;
    try {
      pending = JSON.parse(pendingStr);
    } catch (e) {
      console.error('[Paystack] Could not parse pending payment');
      return null;
    }

    localStorage.removeItem('imc_pending_payment');

    console.log('[Paystack] Verifying payment with backend...');
    console.log('[Paystack] Type:', pending.type);

    // Verify with backend
    var result = await IMC_API.verifyPayment(
      reference,
      pending.type,
      pending.metadata || {}
    );

    console.log('[Paystack] Verify result:', JSON.stringify(result));

    return result;
  }

  // ================================================
  //   LOADING OVERLAY
  // ================================================

  function showLoadingOverlay(message) {
    var existing = document.getElementById('imc_loading_overlay');
    if (existing) existing.remove();

    var el       = document.createElement('div');
    el.id        = 'imc_loading_overlay';
    el.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.6);' +
      'z-index:99999;display:flex;align-items:center;' +
      'justify-content:center;flex-direction:column;gap:16px;';

    el.innerHTML =
      '<div style="width:44px;height:44px;border:4px solid #ffffff44;' +
      'border-top-color:#fff;border-radius:50%;' +
      'animation:imc_spin 0.8s linear infinite;"></div>' +
      '<div style="color:#fff;font-size:15px;font-family:Inter,sans-serif;' +
      'font-weight:600;">' + (message || 'Loading...') + '</div>' +
      '<style>' +
      '@keyframes imc_spin{to{transform:rotate(360deg)}}' +
      '</style>';

    document.body.appendChild(el);
  }

  function hideLoadingOverlay() {
    var el = document.getElementById('imc_loading_overlay');
    if (el) el.remove();
  }

  // ================================================
  //   ERROR POPUP
  // ================================================

  function showErrorPopup(message) {
    var existing = document.getElementById('imc_error_overlay');
    if (existing) existing.remove();

    var overlay       = document.createElement('div');
    overlay.id        = 'imc_error_overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.6);' +
      'z-index:99999;display:flex;align-items:center;' +
      'justify-content:center;padding:20px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:32px 24px;' +
      'max-width:360px;width:100%;text-align:center;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="font-size:40px;margin-bottom:12px;">❌</div>' +
      '<h3 style="font-size:18px;font-weight:700;color:#1a1a2e;' +
      'margin-bottom:8px;">Payment Failed</h3>' +
      '<p style="font-size:14px;color:#666;margin-bottom:20px;">' +
      message + '</p>' +
      '<button id="imc_err_close" ' +
      'style="background:#e85d04;color:#fff;border:none;' +
      'padding:12px 28px;border-radius:8px;font-size:14px;' +
      'font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">' +
      'Close' +
      '</button>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('imc_err_close').addEventListener(
      'click', function () {
        overlay.remove();
      }
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
    showLoadingOverlay:   showLoadingOverlay,
    hideLoadingOverlay:   hideLoadingOverlay
  };

})();