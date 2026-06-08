// ================================================
//   INSIDE MY CAMPUS — api.js
//   Handles ALL communication with the backend
//   Include this on every page that needs the API
// ================================================

var IMC_API = (function () {
  'use strict';

  // ---- Your backend URL ----
  // Development: your local server
  // Production: your deployed server (Railway, Render etc)
 // Auto-detects development vs production
var BASE_URL = (
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost'
)
  ? 'http://localhost:5000/api'
  : ' https://imc-backend-0y2u.onrender.com 

  // ================================================
  //   HELPER: Get token from localStorage
  // ================================================
  function getToken() {
    return localStorage.getItem('imc_token') || null;
  }

  // ================================================
  //   HELPER: Save login data to localStorage
  // ================================================
  function saveAuthData(token, user) {
    localStorage.setItem('imc_token',      token);
    localStorage.setItem('imc_user',       JSON.stringify(user));
    localStorage.setItem('imc_logged_in',  'true');
  }

  // ================================================
  //   HELPER: Clear login data (logout)
  // ================================================
  function clearAuthData() {
    localStorage.removeItem('imc_token');
    localStorage.removeItem('imc_user');
    localStorage.removeItem('imc_logged_in');
  }

  // ================================================
  //   HELPER: Check if user is logged in
  // ================================================
  function isLoggedIn() {
    var token = getToken();
    var user  = localStorage.getItem('imc_user');
    return token !== null && user !== null;
  }

  // ================================================
  //   HELPER: Get current user object
  // ================================================
  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('imc_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  // ================================================
  //   CORE: Make API request
  //   This is used by ALL other functions
  // ================================================
  async function request(method, endpoint, data, requiresAuth) {
    try {
      // Build request options
      var options = {
        method:  method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add auth token if required
      if (requiresAuth) {
        var token = getToken();
        if (!token) {
          return {
            success: false,
            message: 'Not logged in. Please login first.'
          };
        }
        options.headers['Authorization'] = 'Bearer ' + token;
      }

      // Add body for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      // Make the request
      var response = await fetch(BASE_URL + endpoint, options);
      var result   = await response.json();

      return result;

    } catch (err) {
      // Network error — backend not running
      console.error('API Error:', err.message);

      if (err.message.includes('fetch') ||
          err.message.includes('Failed') ||
          err.message.includes('NetworkError')) {
        return {
          success: false,
          message: 'Cannot connect to server. ' +
                   'Make sure the backend is running on port 5000.',
          networkError: true
        };
      }

      return {
        success: false,
        message: 'Something went wrong. Please try again.'
      };
    }
  }

  // ================================================
  //   AUTH: Register
  // ================================================
  async function register(userData) {
    var result = await request('POST', '/auth/register', userData, false);

    if (result.success) {
      saveAuthData(result.token, result.user);
    }

    return result;
  }

  // ================================================
  //   AUTH: Login
  // ================================================
  async function login(email, password) {
    var result = await request(
      'POST',
      '/auth/login',
      { email: email, password: password },
      false
    );

    if (result.success) {
      saveAuthData(result.token, result.user);
    }

    return result;
  }

  // ================================================
  //   AUTH: Logout
  // ================================================
  function logout() {
    clearAuthData();
    window.location.href = 'index.html';
  }

  // ================================================
  //   AUTH: Get my profile
  // ================================================
  async function getProfile() {
    return await request('GET', '/auth/me', null, true);
  }

  // ================================================
  //   AUTH: Update profile
  // ================================================
  async function updateProfile(data) {
    return await request('PUT', '/auth/update-profile', data, true);
  }

  // ================================================
  //   AUTH: Change password
  // ================================================
  async function changePassword(currentPassword, newPassword) {
    return await request(
      'PUT',
      '/auth/change-password',
      {
        currentPassword: currentPassword,
        newPassword:     newPassword
      },
      true
    );
  }

  // ================================================
  //   VENDORS: Get all vendors
  // ================================================
  async function getVendors(filters) {
    var query = '';
    if (filters) {
      var params = new URLSearchParams(filters);
      query      = '?' + params.toString();
    }
    return await request('GET', '/vendors' + query, null, false);
  }

  // ================================================
  //   VENDORS: Register as vendor
  // ================================================
  async function registerVendor(vendorData) {
    return await request('POST', '/vendors/register', vendorData, true);
  }

  // ================================================
  //   VENDORS: Add product
  // ================================================
  async function addProduct(productData) {
    return await request('POST', '/vendors/products', productData, true);
  }

  // ================================================
  //   VENDORS: Get my vendor profile
  // ================================================
  async function getMyVendorProfile() {
    return await request('GET', '/vendors/my-profile', null, true);
  }

  // ================================================
  //   AMBASSADORS: Register as ambassador
  // ================================================
  async function registerAmbassador(ambData) {
    return await request(
      'POST', '/ambassadors/register', ambData, true
    );
  }

  // ================================================
  //   AMBASSADORS: Get my ambassador profile
  // ================================================
  async function getMyAmbassadorProfile() {
    return await request(
      'GET', '/ambassadors/my-profile', null, true
    );
  }

  // ================================================
  //   ADS: Get all approved ads
  // ================================================
  async function getAds() {
    return await request('GET', '/ads', null, false);
  }

  // ================================================
  //   ADS: Submit a new ad
  // ================================================
  async function submitAd(adData) {
    return await request('POST', '/ads', adData, true);
  }

  // ================================================
  //   NEWS: Get all approved news
  // ================================================
  async function getNews(filters) {
    var query = '';
    if (filters) {
      var params = new URLSearchParams(filters);
      query      = '?' + params.toString();
    }
    return await request('GET', '/news' + query, null, false);
  }

  // ================================================
  //   NEWS: Submit news (ambassador)
  // ================================================
  async function submitNews(newsData) {
    return await request('POST', '/news', newsData, true);
  }

  // ================================================
  //   COURSES: Get all courses
  // ================================================
  async function getCourses() {
    return await request('GET', '/courses', null, false);
  }

  // ================================================
  //   COURSES: Purchase a course
  // ================================================
  async function purchaseCourse(courseId, paymentRef) {
    return await request(
      'POST',
      '/courses/purchase',
      { courseId: courseId, paymentRef: paymentRef },
      true
    );
  }

  // ================================================
//   PAYMENTS: Initialize payment
// ================================================
async function initializePayment(amount, type, description, metadata) {
  return await request(
    'POST',
    '/payments/initialize',
    {
      amount:      amount,
      type:        type,
      description: description || type,
      metadata:    metadata    || {}
    },
    true
  );
}

// ================================================
//   PAYMENTS: Verify payment after redirect
// ================================================
async function verifyPayment(reference, type, metadata) {
  return await request(
    'POST',
    '/payments/verify',
    {
      reference: reference,
      type:      type,
      metadata:  metadata || {}
    },
    true
  );
}

  // ================================================
  //   ADMIN: Get stats
  // ================================================
  async function getAdminStats() {
    return await request('GET', '/admin/stats', null, true);
  }

  // ================================================
  //   ADMIN: Update vendor status
  // ================================================
  async function updateVendorStatus(vendorId, status) {
    return await request(
      'PUT',
      '/admin/vendors/' + vendorId,
      { status: status },
      true
    );
  }

  // ================================================
  //   ADMIN: Update ad status
  // ================================================
  async function updateAdStatus(adId, status) {
    return await request(
      'PUT',
      '/admin/ads/' + adId,
      { status: status },
      true
    );
  }

  // ================================================
  //   HEALTH CHECK
  // ================================================
  async function checkHealth() {
    return await request('GET', '/health', null, false);
  }

  // ================================================
  //   PUBLIC API — what other files can use
  // ================================================
  return {
    // Auth
    register:               register,
    login:                  login,
    logout:                 logout,
    getProfile:             getProfile,
    updateProfile:          updateProfile,
    changePassword:         changePassword,
    isLoggedIn:             isLoggedIn,
    getCurrentUser:         getCurrentUser,
    getToken:               getToken,
    saveAuthData:           saveAuthData,
    clearAuthData:          clearAuthData,

    // Vendors
    getVendors:             getVendors,
    registerVendor:         registerVendor,
    addProduct:             addProduct,
    getMyVendorProfile:     getMyVendorProfile,

    // Ambassadors
    registerAmbassador:     registerAmbassador,
    getMyAmbassadorProfile: getMyAmbassadorProfile,

    // Ads
    getAds:                 getAds,
    submitAd:               submitAd,

    // News
    getNews:                getNews,
    submitNews:             submitNews,

    // Courses
    getCourses:             getCourses,
    purchaseCourse:         purchaseCourse,

    // Payments
    verifyPayment:          verifyPayment,

    // Admin
    getAdminStats:          getAdminStats,
    updateVendorStatus:     updateVendorStatus,
    updateAdStatus:         updateAdStatus,

    // Health
    checkHealth:            checkHealth
  };

})();

initializePayment: initializePayment,
verifyPayment:     verifyPayment,