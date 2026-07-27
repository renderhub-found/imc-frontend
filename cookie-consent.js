(function () {
  var STORAGE_KEY = 'imc_cookie_consent';

  if (localStorage.getItem(STORAGE_KEY)) return;

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#1a1a2e;color:#fff;padding:16px 18px;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:14px;' +
      'box-shadow:0 -4px 20px rgba(0,0,0,0.25);font-family:Inter,sans-serif;';

    banner.innerHTML =
      '<span style="flex:1;min-width:200px;font-size:13px;line-height:1.5;">' +
      '🍪 We use cookies to keep you logged in and improve your experience. ' +
      'By using Inside My Campus, you agree to our ' +
      '<a href="cookie-policy.html" style="color:#7fc8ff;text-decoration:underline;">Cookie Policy</a>.' +
      '</span>' +
      '<div style="display:flex;gap:8px;flex-shrink:0;">' +
      '<button id="cookieDeclineBtn" style="background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.4);' +
      'padding:8px 16px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">' +
      'Decline</button>' +
      '<button id="cookieAcceptBtn" style="background:#2d8653;color:#fff;border:none;' +
      'padding:8px 18px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">' +
      'Accept</button>' +
      '</div>';

    document.body.appendChild(banner);

    function dismiss(value) {
      localStorage.setItem(STORAGE_KEY, value);
      banner.remove();
    }

    document.getElementById('cookieAcceptBtn').addEventListener('click', function () {
      dismiss('accepted');
    });
    document.getElementById('cookieDeclineBtn').addEventListener('click', function () {
      dismiss('declined');
    });
  });
})();