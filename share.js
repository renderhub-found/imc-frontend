// ================================================
//   INSIDE MY CAMPUS — SHARE BUTTONS (share.js)
//   Drop-in reusable sharing widget for News articles
//   and Marketplace products.
// ================================================

// Renders a row of share buttons. Call this and inject the returned
// HTML into any container, e.g.:
//   document.getElementById('shareButtonsContainer').innerHTML =
//     renderShareButtons(window.location.href, article.title);
function renderShareButtons(url, title, image) {
  var encodedUrl      = encodeURIComponent(url);
  var encodedTitle    = encodeURIComponent(title || 'Check this out on Inside My Campus');
  var encodedImage    = encodeURIComponent(image || '');
  var encodedShareUrl = encodedUrl;

  return `
    <div class="share-buttons-row">
      <span class="share-label"><i class="fas fa-share-alt"></i> Share:</span>

      <button class="share-btn share-native" title="Share"
        onclick="shareTo('native','${encodedUrl}','${encodedTitle}','${encodedImage}')"
        style="display:none;" id="nativeShareBtn">
        <i class="fas fa-share-nodes"></i>
      </button>

      <button class="share-btn share-whatsapp" title="Share on WhatsApp"
        onclick="shareTo('whatsapp','${encodedShareUrl}','${encodedTitle}','${encodedImage}')">
        <i class="fab fa-whatsapp"></i>
      </button>

      <button class="share-btn share-facebook" title="Share on Facebook"
        onclick="shareTo('facebook','${encodedShareUrl}','${encodedTitle}')">
        <i class="fab fa-facebook-f"></i>
      </button>

      <button class="share-btn share-x" title="Share on X"
        onclick="shareTo('x','${encodedShareUrl}','${encodedTitle}')">
        <i class="fab fa-x-twitter"></i>
      </button>

      <button class="share-btn share-telegram" title="Share on Telegram"
        onclick="shareTo('telegram','${encodedShareUrl}','${encodedTitle}')">
        <i class="fab fa-telegram-plane"></i>
      </button>

      <button class="share-btn share-linkedin" title="Share on LinkedIn"
        onclick="shareTo('linkedin','${encodedShareUrl}','${encodedTitle}')">
        <i class="fab fa-linkedin-in"></i>
      </button>

      <button class="share-btn share-copy" id="shareCopyBtn" title="Copy link"
        onclick="shareTo('copy','${encodedUrl}','${encodedTitle}','${encodedImage}')">
        <i class="fas fa-link"></i>
      </button>
    </div>
  `;
}

// Show the native device share sheet (supports image + title + link on
// Android/iOS) whenever the browser supports it, instead of the plain button.
document.addEventListener('DOMContentLoaded', function () {
  if (navigator.share) {
    document.querySelectorAll('#nativeShareBtn').forEach(function (btn) {
      btn.style.display = 'inline-flex';
    });
  }
});

function shareTo(platform, encodedUrl, encodedTitle, encodedImage) {
  var plainUrl   = decodeURIComponent(encodedUrl);
  var plainTitle = decodeURIComponent(encodedTitle);
  var plainImage = encodedImage ? decodeURIComponent(encodedImage) : '';

  if (platform === 'native' && navigator.share) {
    if (plainImage && navigator.canShare) {
      fetch(plainImage).then(function (r) { return r.blob(); }).then(function (blob) {
        var file = new File([blob], 'share.jpg', { type: blob.type || 'image/jpeg' });
        var shareData = { title: plainTitle, url: plainUrl, files: [file] };
        if (navigator.canShare(shareData)) {
          navigator.share(shareData).catch(function () {});
        } else {
          navigator.share({ title: plainTitle, url: plainUrl }).catch(function () {});
        }
      }).catch(function () {
        navigator.share({ title: plainTitle, url: plainUrl }).catch(function () {});
      });
    } else {
      navigator.share({ title: plainTitle, url: plainUrl }).catch(function () {});
    }
    return;
  }

  var shareUrls = {
    whatsapp: 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
    x:        'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl,
    telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedTitle,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl
  };

  if (platform === 'copy') {
    var doCopy = function () {
      var btn = document.getElementById('shareCopyBtn');
      if (!btn) return;
      var original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(function () { btn.innerHTML = original; }, 1800);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(plainUrl).then(doCopy);
    } else {
      var el = document.createElement('textarea');
      el.value = plainUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      doCopy();
    }
    return;
  }

  var target = shareUrls[platform];
  if (target) window.open(target, '_blank', 'width=600,height=500');
}