// ================================================
//   PAYSTACK PAYMENT SYSTEM — paystack.js
//   Works in both simulated and real mode
// ================================================

var IMCPaystack = (function () {
  'use strict';

  // ---- Open payment ----
  function openPayment(config) {
    /*
      config = {
        amount:      number   e.g. 10000
        type:        string   e.g. 'vendor_registration'
        description: string
        metadata:    object   (optional)
        onSuccess:   function (ref) called after payment
        onCancel:    function () called if cancelled
      }
    */

    // Check if IMC_API is available
    if (typeof IMC_API !== 'undefined' && IMC_API.isLoggedIn()) {
      openRealPayment(config);
    } else {
      openSimulatedPayment(config);
    }
  }

  // =============================================
  //   REAL PAYMENT — calls backend then Paystack
  // =============================================
  async function openRealPayment(config) {
    console.log('[Paystack] Opening real payment for:', config.type);

    // Show loading
    showLoadingOverlay(config.description || 'Processing...');

    try {
      // Call backend to initialize
      var result = await IMC_API.initializePayment(
        config.amount,
        config.type,
        config.description,
        config.metadata || {}
      );

      hideLoadingOverlay();

      if (!result.success) {
        console.error('[Paystack] Init failed:', result.message);
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
        alert('Payment setup failed: ' + result.message);
        return;
      }

      if (result.simulated) {
        // Development mode — use simulated popup
        console.log('[Paystack] Simulated mode — showing card form');
        openSimulatedPayment(config, result.reference);
        return;
      }

      // Real mode — redirect to Paystack
      console.log('[Paystack] Redirecting to:', result.authorizationUrl);

      // Save config for after redirect
      localStorage.setItem('imc_pending_payment', JSON.stringify({
        type:        config.type,
        amount:      config.amount,
        reference:   result.reference,
        description: config.description,
        metadata:    config.metadata || {}
      }));

      window.location.href = result.authorizationUrl;

    } catch (err) {
      hideLoadingOverlay();
      console.error('[Paystack] Error:', err.message);
      if (typeof config.onCancel === 'function') {
        config.onCancel();
      }
    }
  }

  // =============================================
  //   SIMULATED PAYMENT — card form popup
  //   Used when no real Paystack key configured
  // =============================================
  function openSimulatedPayment(config, presetReference) {
    var existing = document.getElementById('imc_paystack_overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id  = 'imc_paystack_overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);' +
      'z-index:99999;display:flex;align-items:center;' +
      'justify-content:center;padding:20px;';

    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:100%;' +
      'max-width:380px;overflow:hidden;' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +

      // Header
      '<div style="background:#011B33;padding:14px 20px;' +
      'display:flex;align-items:center;gap:10px;">' +
      '<div style="background:#0DC16E;width:28px;height:28px;' +
      'border-radius:6px;display:flex;align-items:center;' +
      'justify-content:center;font-weight:800;color:#fff;' +
      'font-size:14px;">P</div>' +
      '<span style="color:#fff;font-weight:700;font-size:15px;">' +
      'Paystack</span>' +
      '<button id="imc_ps_close" style="margin-left:auto;' +
      'background:none;border:none;color:#aaa;font-size:18px;' +
      'cursor:pointer;">✕</button>' +
      '</div>' +

      // Body
      '<div style="padding:24px 20px;">' +
      '<div style="text-align:center;font-size:30px;font-weight:800;' +
      'color:#011B33;margin-bottom:4px;">₦' +
      parseInt(config.amount).toLocaleString() + '</div>' +
      '<p style="text-align:center;font-size:13px;color:#888;' +
      'margin-bottom:20px;">' +
      (config.description || 'Inside My Campus Payment') +
      '</p>' +

      '<div style="display:flex;flex-direction:column;gap:12px;">' +

      // Card number
      '<div>' +
      '<label style="font-size:12px;font-weight:600;color:#555;' +
      'display:block;margin-bottom:5px;">Card Number</label>' +
      '<input id="imc_ps_card" type="text" maxlength="19" ' +
      'placeholder="0000 0000 0000 0000" ' +
      'style="width:100%;padding:10px 12px;border:1.5px solid #e0e0e0;' +
      'border-radius:8px;font-size:14px;font-family:Inter,sans-serif;' +
      'outline:none;box-sizing:border-box;"/>' +
      '</div>' +

      // Expiry and CVV
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '<div>' +
      '<label style="font-size:12px;font-weight:600;color:#555;' +
      'display:block;margin-bottom:5px;">Expiry</label>' +
      '<input id="imc_ps_expiry" type="text" maxlength="5" ' +
      'placeholder="MM/YY" ' +
      'style="width:100%;padding:10px 12px;border:1.5px solid #e0e0e0;' +
      'border-radius:8px;font-size:14px;font-family:Inter,sans-serif;' +
      'outline:none;box-sizing:border-box;"/>' +
      '</div>' +
      '<div>' +
      '<label style="font-size:12px;font-weight:600;color:#555;' +
      'display:block;margin-bottom:5px;">CVV</label>' +
      '<input id="imc_ps_cvv" type="text" maxlength="3" ' +
      'placeholder="123" ' +
      'style="width:100%;padding:10px 12px;border:1.5px solid #e0e0e0;' +
      'border-radius:8px;font-size:14px;font-family:Inter,sans-serif;' +
      'outline:none;box-sizing:border-box;"/>' +
      '</div>' +
      '</div>' +

      // Pay button
      '<button id="imc_ps_pay" ' +
      'style="background:#0DC16E;color:#fff;border:none;padding:13px;' +
      'border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;' +
      'font-family:Inter,sans-serif;width:100%;">' +
      'Pay ₦' + parseInt(config.amount).toLocaleString() +
      '</button>' +

      // Cancel button
      '<button id="imc_ps_cancel" ' +
      'style="background:none;border:none;color:#888;font-size:13px;' +
      'cursor:pointer;text-align:center;width:100%;' +
      'font-family:Inter,sans-serif;">' +
      'Cancel' +
      '</button>' +

      '</div>' +
      '<p style="text-align:center;font-size:11px;color:#aaa;' +
      'margin-top:12px;">🔒 Secured by Paystack (Test Mode)</p>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Card formatter
    var cardInput = document.getElementById('imc_ps_card');
    cardInput.addEventListener('input', function () {
      var v = this.value.replace(/\D/g, '').substring(0, 16);
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });

    // Expiry formatter
    var expiryInput = document.getElementById('imc_ps_expiry');
    expiryInput.addEventListener('input', function () {
      var v = this.value.replace(/\D/g, '').substring(0, 4);
      if (v.length >= 3) {
        this.value = v.substring(0, 2) + '/' + v.substring(2);
      } else {
        this.value = v;
      }
    });

    // Pay button
    document.getElementById('imc_ps_pay').addEventListener(
      'click', async function () {
        var card   = cardInput.value.replace(/\s/g, '');
        var expiry = expiryInput.value;
        var cvv    = document.getElementById('imc_ps_cvv').value;

        if (card.length < 16) {
          shake(cardInput); return;
        }
        if (!expiry || expiry.length < 5) {
          shake(expiryInput); return;
        }
        if (cvv.length < 3) {
          shake(document.getElementById('imc_ps_cvv')); return;
        }

        var payBtn       = document.getElementById('imc_ps_pay');
        payBtn.textContent = '⏳ Processing...';
        payBtn.disabled    = true;
        payBtn.style.background = '#aaa';

        // Simulate 1.5 second processing
        setTimeout(async function () {
          var ref = presetReference ||
            'SIM-' + config.type.toUpperCase() + '-' + Date.now();

          closeOverlay();

          // Verify with backend
          if (typeof IMC_API !== 'undefined' && IMC_API.isLoggedIn()) {
            var verifyResult = await IMC_API.verifyPayment(
              ref,
              config.type,
              config.metadata || {}
            );
            console.log('[Paystack] Verify result:', verifyResult);
          }

          if (typeof config.onSuccess === 'function') {
            config.onSuccess({ reference: ref, amount: config.amount });
          }

        }, 1500);
      }
    );

    // Cancel button
    document.getElementById('imc_ps_cancel').addEventListener(
      'click', function () {
        closeOverlay();
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
      }
    );

    // Close X
    document.getElementById('imc_ps_close').addEventListener(
      'click', function () {
        closeOverlay();
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
      }
    );

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeOverlay();
        if (typeof config.onCancel === 'function') {
          config.onCancel();
        }
      }
    });

    function closeOverlay() {
      var el = document.getElementById('imc_paystack_overlay');
      if (el) el.remove();
    }
  }

  // =============================================
  //   HANDLE REDIRECT BACK FROM PAYSTACK
  //   Call this on payment-success.html
  // =============================================
  async function handleRedirectReturn() {
    var urlParams = new URLSearchParams(window.location.search);
    var reference = urlParams.get('reference') ||
                    urlParams.get('trxref');

    if (!reference) return null;

    // Get saved payment config
    var pendingStr = localStorage.getItem('imc_pending_payment');
    if (!pendingStr) return null;

    var pending;
    try {
      pending = JSON.parse(pendingStr);
    } catch (e) {
      return null;
    }

    localStorage.removeItem('imc_pending_payment');

    // Verify with backend
    if (typeof IMC_API !== 'undefined') {
      var result = await IMC_API.verifyPayment(
        reference,
        pending.type,
        pending.metadata || {}
      );
      return result;
    }

    return null;
  }

  // =============================================
  //   HELPERS
  // =============================================

  function showLoadingOverlay(message) {
    var existing = document.getElementById('imc_loading_overlay');
    if (existing) return;

    var el = document.createElement('div');
    el.id  = 'imc_loading_overlay';
    el.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.5);' +
      'z-index:99998;display:flex;align-items:center;' +
      'justify-content:center;color:white;font-size:16px;' +
      'font-family:Inter,sans-serif;flex-direction:column;gap:12px;';
    el.innerHTML =
      '<div style="width:40px;height:40px;border:3px solid #ffffff44;' +
      'border-top-color:#fff;border-radius:50%;' +
      'animation:spin 0.8s linear infinite;"></div>' +
      '<div>' + (message || 'Setting up payment...') + '</div>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(el);
  }

  function hideLoadingOverlay() {
    var el = document.getElementById('imc_loading_overlay');
    if (el) el.remove();
  }

  function shake(el) {
    el.style.borderColor = '#e85d04';
    el.style.animation   = 'shake 0.3s ease';
    setTimeout(function () {
      el.style.borderColor = '#e0e0e0';
      el.style.animation   = '';
    }, 500);
  }

  // Public API
  return {
    openPayment:          openPayment,
    handleRedirectReturn: handleRedirectReturn
  };

})();