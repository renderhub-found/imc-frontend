// ================================================
//   VENDOR DASHBOARD — vendor-dashboard.js
//   Connected to real backend API
// ================================================

(function () {
  'use strict';

  var currentUser = null;
  var vendorData  = null;

  document.addEventListener('DOMContentLoaded', async function () {

    // ---- Auth check ----
    var loggedIn = localStorage.getItem('imc_logged_in');
    currentUser  = JSON.parse(
      localStorage.getItem('imc_user') || 'null'
    );

    if (!loggedIn || !currentUser) {
      window.location.href = 'login.html';
      return;
    }
// ---- Get vendor profile from backend ----
    var result = await IMC_API.getMyVendorProfile();

    if (!result.success || !result.isVendor || !result.vendor ||
        result.vendor.status !== 'approved') {
      window.location.href = 'vendor.html';
      return;
    
    }

    vendorData = result.vendor;

    // ---- Show pending banner ----
    var pendingBanner = document.getElementById('pendingBanner');
    if (pendingBanner && vendorData.status === 'pending') {
      pendingBanner.style.display = 'flex';
    }

    // ---- Fill welcome name ----
    var welcomeEl = document.getElementById('vendorWelcomeName');
    if (welcomeEl) {
      welcomeEl.textContent =
        vendorData.bizName || currentUser.firstName || 'Vendor';
    }

    // ---- Fill stats ----
    var products   = vendorData.products || [];
    var statPEl    = document.getElementById('statProducts');
    if (statPEl) statPEl.textContent = products.length;

    var totalClicks = products.reduce(function (s, p) { return s + (p.clicks || 0); }, 0);
    var totalOrders = products.reduce(function (s, p) { return s + (p.orders || 0); }, 0);

    var statOrdersEl = document.getElementById('statOrders');
    if (statOrdersEl) statOrdersEl.textContent = totalOrders;

    var statViewsEl   = document.getElementById('statProfileViews');
    var statClicksEl  = document.getElementById('statProductClicks');
    var statOrderCEl  = document.getElementById('statOrderCount');
    var statRatingEl  = document.getElementById('statRating');
    if (statViewsEl)  statViewsEl.textContent  = vendorData.profileViews || 0;
    if (statClicksEl) statClicksEl.textContent = totalClicks;
    if (statOrderCEl) statOrderCEl.textContent = totalOrders;
    if (statRatingEl) {
      statRatingEl.textContent = vendorData.avgRating
        ? vendorData.avgRating.toFixed(1) + ' ★ (' + (vendorData.ratingCount || 0) + ')'
        : '—';
    }

    // ---- Store status (Overview tab) ----
    var statusRow = document.getElementById('storeStatusRow');
    if (statusRow) {
      statusRow.innerHTML = vendorData.status === 'approved'
        ? '<span class="status-badge approved">🟢 Store Live</span>' +
          '<p style="font-size:13px;color:#888;margin-top:8px;">Your store is live and visible to students.</p>'
        : (vendorData.status === 'rejected'
          ? '<span class="status-badge rejected">❌ Rejected</span>'
          : '<span class="status-badge pending">⏳ Pending Approval</span>' +
            '<p style="font-size:13px;color:#888;margin-top:8px;">Your store will go live once an admin approves your registration.</p>');
    }

    // ---- Fill tabs ----
    fillProfileTab(vendorData);
    fillPaymentsTab(vendorData);
    renderMyProducts(vendorData);
    renderVendorLeads();

    // ---- Tab navigation ----
    initTabs();

    // ---- Mobile sidebar ----
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function () {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('sidebar-open');
      });
    }

    // ---- Logout ----
    var logoutLink = document.querySelector('.sidebar-logout');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        IMC_API.logout();
      });
    }

  // ---- File uploads ----
    initFileUploads();

    // ---- Post product ----
    initPostProduct();

    // ---- Vendor logo / profile picture ----
    initVendorProfilePicture(vendorData);

    // ---- Vendor profile edit (description, location, phone, social, cover) ----
    initVendorProfileEdit(vendorData);

  });


  // ================================================
  //   TAB NAVIGATION
  // ================================================
  function initTabs() {
    var links = document.querySelectorAll('.sidebar-link[data-tab]');
    var tabs  = document.querySelectorAll('.dash-tab');

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var tabId = this.getAttribute('data-tab');

        links.forEach(function (l) { l.classList.remove('active'); });
        tabs.forEach(function  (t) { t.classList.remove('active'); });

        this.classList.add('active');
        var tabEl = document.getElementById('tab-' + tabId);
        if (tabEl) tabEl.classList.add('active');

        if (tabId === 'products') renderMyProducts(vendorData);

        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('sidebar-open');
      });
    });
  }


 // ================================================
  //   FILE UPLOADS
  // ================================================
  var selectedProductImages = []; // { file, previewUrl }

  function renderImagePreviewGrid() {
    var grid = document.getElementById('imagePreviewGrid');
    var ph   = document.getElementById('imagePlaceholder');
    if (!grid) return;

    if (selectedProductImages.length === 0) {
      grid.style.display = 'none';
      if (ph) ph.style.display = 'block';
      return;
    }

    if (ph) ph.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = selectedProductImages.map(function (item, idx) {
      return '<div style="position:relative;">' +
        '<img src="' + item.previewUrl + '" style="width:100%;height:70px;object-fit:cover;border-radius:6px;"/>' +
        '<button type="button" onclick="removeProductImageAt(' + idx + ')" ' +
        'style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.65);color:#fff;border:none;' +
        'border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;line-height:1;">' +
        '<i class="fas fa-times"></i></button></div>';
    }).join('');
  }

  window.removeProductImageAt = function (idx) {
    selectedProductImages.splice(idx, 1);
    renderImagePreviewGrid();
  };

  function initFileUploads() {
    var imageInput = document.getElementById('productImageFiles');
    var videoInput = document.getElementById('productVideoFile');

    if (imageInput) {
      imageInput.addEventListener('change', function () {
        var newFiles = Array.prototype.slice.call(this.files || []);
        for (var i = 0; i < newFiles.length; i++) {
          if (selectedProductImages.length >= 4) {
            alert('Maximum 4 images per product.');
            break;
          }
          var file = newFiles[i];
          if (file.size > 5 * 1024 * 1024) {
            alert(file.name + ' is over 5MB and was skipped.');
            continue;
          }
          selectedProductImages.push({ file: file, previewUrl: URL.createObjectURL(file) });
        }
        this.value = '';
        renderImagePreviewGrid();
      });
    }

    if (videoInput) {
      videoInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
          alert('Video must be under 50MB.');
          this.value = ''; return;
        }
        var url  = URL.createObjectURL(file);
        var prev = document.getElementById('productVideoPreview');
        var ph   = document.getElementById('videoPlaceholder');
        var wrap = document.getElementById('videoPreviewWrap');
        if (prev) prev.src           = url;
        if (ph)   ph.style.display   = 'none';
        if (wrap) wrap.style.display = 'block';
      });
    }
  } 

async function renderVendorLeads() {
  var container = document.getElementById('vendorLeadsContainer');
  if (!container) return;

  var result = await IMC_API.getMyNotifications();
  if (!result.success) return;

  var leads = result.notifications.filter(function (n) { return n.type === 'order_lead'; });

  if (leads.length === 0) {
    container.innerHTML = '<div class="empty-state-card"><p>No customer inquiries yet.</p></div>';
    return;
  }

  container.innerHTML = leads.map(function (n) {
    return '<div class="withdraw-history-card">' +
      '<div class="withdraw-history-info">' +
      '<h4>' + n.customerName + '</h4>' +
      '<p>' + n.message + '</p>' +
      '</div></div>';
  }).join('');
}

  // ================================================
  //   POST PRODUCT
  // ================================================
  function initPostProduct() {
    var btn = document.getElementById('postProductBtn');
    if (!btn) return;

    btn.addEventListener('click', async function () {

     var name        = getVal('productName');
      var price       = getVal('productPrice');
      var desc        = getVal('productDesc');
      var category    = getVal('productCategory') || '';
      var customCat   = getVal('productCustomCategory') || '';
      var videoFile   = document.getElementById('productVideoFile');

      var errBox = document.getElementById('productError');
      var errMsg = document.getElementById('productErrorMsg');
      var okBox  = document.getElementById('productSuccess');

      function showErr(msg) {
        if (errMsg) errMsg.textContent   = msg;
        if (errBox) errBox.style.display = 'flex';
        if (okBox)  okBox.style.display  = 'none';
      }

      if (errBox) errBox.style.display = 'none';
      if (okBox)  okBox.style.display  = 'none';

      if (!name)  { showErr('Please enter a product name.');  return; }
      if (!price) { showErr('Please enter a price.');         return; }
      if (!desc)  { showErr('Please add a description.');     return; }
      if (selectedProductImages.length === 0) {
        showErr('Please upload at least one product image.');
        return;
      }

      var finalCategory =
        category === 'Others' ? customCat : (category || vendorData.category);

      var vidFileObj = videoFile && videoFile.files[0];

      btn.disabled = true;
      btn.textContent = 'Saving...';

      var formData = new FormData();
      formData.append('name', name);
      formData.append('price', parseFloat(price));
      formData.append('description', desc);
      formData.append('category', finalCategory);
      selectedProductImages.forEach(function (item) {
        formData.append('images', item.file);
      });
      if (vidFileObj) formData.append('video', vidFileObj);

      var result = await IMC_API.addProductWithFiles(formData);

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-upload"></i> Post Product';

      if (result.success) {
        if (vendorData.products) {
          vendorData.products.push(result.product);
        }

        setVal('productName',  '');
        setVal('productPrice', '');
        setVal('productDesc',  '');
        if (videoFile) videoFile.value = '';
        selectedProductImages = [];
        renderImagePreviewGrid();
        window.removeUpload && window.removeUpload('image'); 
        window.removeUpload && window.removeUpload('video');

        // Update stat
        var statEl = document.getElementById('statProducts');
        if (statEl && vendorData.products) {
          statEl.textContent = vendorData.products.length;
        }

        if (okBox) {
          okBox.style.display = 'flex';
          setTimeout(function () { okBox.style.display = 'none'; }, 3000);
        }

        renderMyProducts(vendorData);

      } else {
        showErr(result.message || 'Could not add product.');
      }
    });
  }


  // ================================================
  //   RENDER MY PRODUCTS
  // ================================================
  function renderMyProducts(vendor) {
    var grid = document.getElementById('myProductsList');
    if (!grid) return;

    var products = vendor ? (vendor.products || []) : [];

    if (products.length === 0) {
      grid.innerHTML =
        '<p class="empty-state">' +
        'No products yet. Go to "Post Product" to add one.' +
        '</p>';
      return;
    }

    grid.innerHTML = products.map(function (p) {
      var mediaHtml = '';
      if (p.video) {
        mediaHtml =
          '<video src="' + p.video + '" controls ' +
          'class="product-card-img" style="height:150px;">' +
          '</video>';
      } else {
        mediaHtml =
          '<img src="' + (p.image || 'https://via.placeholder.com/300x200') +
          '" alt="' + p.name + '" class="product-card-img" ' +
          'onerror="this.src=\'https://via.placeholder.com/300x200\'"/>';
      }

      return '<div class="product-card">' +
        mediaHtml +
        '<div class="product-card-body">' +
        '<h4>' + p.name + '</h4>' +
        '<p class="product-price">₦' +
        parseFloat(p.price).toLocaleString() + '</p>' +
        '<p class="product-desc">' + p.description + '</p>' +
        '<button class="btn-delete-product" ' +
        'onclick="deleteProduct(\'' + p._id + '\')">' +
        '<i class="fas fa-trash"></i> Delete' +
        '</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }


  // ================================================
  //   FILL PROFILE TAB
  // ================================================
  function fillProfileTab(vendor) {
    var card = document.getElementById('vendorProfileSummary');
    if (!card) return;

    var statusLabel =
      vendor.status === 'approved' ? '🟢 Store Live' :
      vendor.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';

    card.innerHTML =
      '<div class="profile-info-grid">' +
      infoItem('Business Name', vendor.bizName)    +
      infoItem('Full Name',     vendor.fullName)   +
      infoItem('Email',         vendor.email)      +
      infoItem('WhatsApp',      vendor.whatsApp)   +
      infoItem('University',    vendor.university) +
      infoItem('Category',      vendor.category)   +
      '<div class="profile-info-item" style="grid-column:1/-1;">' +
      '<span class="profile-label">Description</span>' +
      '<span class="profile-value">' + vendor.description + '</span>' +
      '</div>' +
      '<div class="profile-info-item">' +
      '<span class="profile-label">Status</span>' +
      '<span class="status-badge ' + vendor.status + '">' +
      statusLabel + '</span>' +
      '</div>' +
      '</div>';
  }


function initVendorProfilePicture(vendor) {
  var fileInput = document.getElementById('vendorProfilePicFile');
  if (!fileInput) return;

  // Show existing picture if set
  if (vendor.profilePicture) {
    document.getElementById('vendorProfilePicPreview').src = vendor.profilePicture;
    document.getElementById('vendorProfilePicPlaceholder').style.display = 'none';
    document.getElementById('vendorProfilePicPreviewWrap').style.display = 'block';
  }

  fileInput.addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); this.value=''; return; }

    var formData = new FormData();
    formData.append('image', file);

    IMC_API.uploadVendorProfilePicture(formData).then(function (result) {
      if (result.success) {
        document.getElementById('vendorProfilePicPreview').src = result.profilePicture;
        document.getElementById('vendorProfilePicPlaceholder').style.display = 'none';
        document.getElementById('vendorProfilePicPreviewWrap').style.display = 'block';
        vendor.profilePicture = result.profilePicture;
      } else {
        alert(result.message || 'Could not upload picture.');
      }
    });
  });
}



function initVendorProfileEdit(vendor) {
  setVal('vendorDescriptionInput', vendor.description || '');
  setVal('vendorCampusLocation',   vendor.campusLocation || '');
  setVal('vendorPhoneInput',       vendor.phone || '');
  setVal('vendorWhatsAppInput',    vendor.whatsApp || '');
  if (vendor.socialMedia) {
    setVal('vendorInstagramInput', vendor.socialMedia.instagram || '');
    setVal('vendorFacebookInput',  vendor.socialMedia.facebook  || '');
    setVal('vendorTwitterInput',   vendor.socialMedia.twitter   || '');
    setVal('vendorTiktokInput',    vendor.socialMedia.tiktok    || '');
  }
  if (vendor.coverImage) {
    document.getElementById('vendorCoverPreview').src = vendor.coverImage;
    document.getElementById('vendorCoverPlaceholder').style.display = 'none';
    document.getElementById('vendorCoverPreviewWrap').style.display = 'block';
  }

  var coverInput = document.getElementById('vendorCoverFile');
  var selectedCoverFile = null;
  if (coverInput) {
    coverInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); this.value=''; return; }
      selectedCoverFile = file;
      var reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById('vendorCoverPreview').src = e.target.result;
        document.getElementById('vendorCoverPlaceholder').style.display = 'none';
        document.getElementById('vendorCoverPreviewWrap').style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  var saveBtn = document.getElementById('vendorProfileSaveBtn');
  var msgBox  = document.getElementById('vendorProfileSaveMsg');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      msgBox.style.display = 'none';

      var formData = new FormData();
      formData.append('description',    getVal('vendorDescriptionInput'));
      formData.append('campusLocation', getVal('vendorCampusLocation'));
      formData.append('phone',          getVal('vendorPhoneInput'));
      formData.append('whatsApp',       getVal('vendorWhatsAppInput'));
      formData.append('instagram',      getVal('vendorInstagramInput'));
      formData.append('facebook',       getVal('vendorFacebookInput'));
      formData.append('twitter',        getVal('vendorTwitterInput'));
      formData.append('tiktok',         getVal('vendorTiktokInput'));
      if (selectedCoverFile) formData.append('cover', selectedCoverFile);

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      var result = await IMC_API.updateVendorProfile(formData);

      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile';

      msgBox.style.display = 'block';
      if (result.success) {
        msgBox.style.background = '#e8f9ee';
        msgBox.style.color = '#2d8653';
        msgBox.textContent = 'Profile updated!';
        Object.assign(vendorData, result.vendor);
      } else {
        msgBox.style.background = '#fff0f0';
        msgBox.style.color = '#c62828';
        msgBox.textContent = result.message || 'Could not update profile.';
      }
    });
  }
}


  // ================================================
  //   FILL PAYMENTS TAB
  // ================================================
  function fillPaymentsTab(vendor) {
    var table = document.getElementById('paymentsTable');
    if (!table) return;

    var date = vendor.createdAt
      ? new Date(vendor.createdAt).toLocaleDateString()
      : 'N/A';

    table.innerHTML =
      '<table class="data-table">' +
      '<thead><tr>' +
      '<th>Description</th><th>Amount</th>' +
      '<th>Date</th><th>Status</th>' +
      '</tr></thead>' +
      '<tbody><tr>' +
      '<td>Vendor Registration Fee</td>' +
      '<td>₦10,000</td>' +
      '<td>' + date + '</td>' +
      '<td><span class="status-badge approved">✅ Paid</span></td>' +
      '</tr></tbody>' +
      '</table>';
  }


  // ================================================
  //   DELETE PRODUCT
  // ================================================
  window.deleteProduct = async function (productId) {
    if (!confirm('Delete this product? This cannot be undone.')) return;

    var data = await IMC_API.deleteProduct(productId);

    if (data.success) {
      // Remove from local data
      if (vendorData && vendorData.products) {
        vendorData.products = vendorData.products.filter(function (p) {
          return p._id.toString() !== productId.toString();
        });
      }
      renderMyProducts(vendorData);

      // Update stat
      var statEl = document.getElementById('statProducts');
      if (statEl && vendorData && vendorData.products) {
        statEl.textContent = vendorData.products.length;
      }
    } else {
      alert(data.message || 'Could not delete product. Please try again.');
    }
  };

  // ================================================
  //   REMOVE UPLOAD PREVIEW
  // ================================================
  window.removeUpload = function (type) {
    if (type === 'image') {
      var fi = document.getElementById('productImageFile');
      var pi = document.getElementById('productImagePreview');
      var ph = document.getElementById('imagePlaceholder');
      var pw = document.getElementById('imagePreviewWrap');
      if (fi) fi.value = '';
      if (pi) pi.src   = '';
      if (ph) ph.style.display = 'flex';
      if (pw) pw.style.display = 'none';
    } else {
      var fv = document.getElementById('productVideoFile');
      var pv = document.getElementById('productVideoPreview');
      var vh = document.getElementById('videoPlaceholder');
      var vw = document.getElementById('videoPreviewWrap');
      if (fv) fv.value = '';
      if (pv) pv.src   = '';
      if (vh) vh.style.display = 'flex';
      if (vw) vw.style.display = 'none';
    }
  };

  // ================================================
  //   HELPERS
  // ================================================
  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
  }

  function infoItem(label, value) {
    return '<div class="profile-info-item">' +
      '<span class="profile-label">' + label + '</span>' +
      '<span class="profile-value">' + (value || '—') + '</span>' +
      '</div>';
  }

})();