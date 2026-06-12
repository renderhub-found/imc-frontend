// ================================================
//   INSIDE MY CAMPUS — api.js
//   Single source of truth for all API calls
// ================================================

var IMC_API = (function () {
  'use strict';

  var BASE_URL = (
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost'
  )
    ? 'http://localhost:5000/api'
    : 'https://imc-backend-0y2u.onrender.com/api';

  console.log('[API] BASE_URL:', BASE_URL);

  // ---- Token helpers ----
  function getToken()  { return localStorage.getItem('imc_token') || null; }

  function saveAuthData(token, user) {
    localStorage.setItem('imc_token',     token);
    localStorage.setItem('imc_user',      JSON.stringify(user));
    localStorage.setItem('imc_logged_in', 'true');
  }

  function clearAuthData() {
    localStorage.removeItem('imc_token');
    localStorage.removeItem('imc_user');
    localStorage.removeItem('imc_logged_in');
  }

  function isLoggedIn() {
    return !!getToken() && !!localStorage.getItem('imc_user');
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('imc_user') || 'null');
    } catch (e) { return null; }
  }

  // ---- Core request ----
  async function request(method, endpoint, data, requiresAuth) {
    try {
      var options = {
        method:  method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (requiresAuth) {
        var token = getToken();
        if (!token) {
          return { success: false, message: 'Not logged in.', notLoggedIn: true };
        }
        options.headers['Authorization'] = 'Bearer ' + token;
      }

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      var url      = BASE_URL + endpoint;
      var response = await fetch(url, options);
      var text     = await response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('[API] Non-JSON response from', endpoint, ':', text.substring(0, 200));
        return { success: false, message: 'Server returned unexpected response.' };
      }

    } catch (err) {
      console.error('[API] Request error:', endpoint, err.message);
      return {
        success:      false,
        message:      'Connection error. Please check your internet.',
        networkError: true
      };
    }
  }

  // ================================================
  //   AUTH
  // ================================================

  async function register(userData) {
    var result = await request('POST', '/auth/register', userData, false);
    if (result.success) saveAuthData(result.token, result.user);
    return result;
  }

  async function login(email, password) {
    var result = await request('POST', '/auth/login',
      { email: email, password: password }, false);
    if (result.success) saveAuthData(result.token, result.user);
    return result;
  }

  function logout() {
    clearAuthData();
    window.location.href = 'index.html';
  }

  async function getProfile() {
    return await request('GET', '/auth/me', null, true);
  }

  async function updateProfile(data) {
    return await request('PUT', '/auth/update-profile', data, true);
  }

  async function changePassword(currentPassword, newPassword) {
    return await request('PUT', '/auth/change-password',
      { currentPassword: currentPassword, newPassword: newPassword }, true);
  }

  // ================================================
  //   VENDORS
  // ================================================

  async function getVendors(filters) {
    var q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return await request('GET', '/vendors' + q, null, false);
  }

  async function registerVendor(vendorData) {
    console.log('[API] registerVendor:', JSON.stringify(vendorData));
    return await request('POST', '/vendors/register', vendorData, true);
  }

  async function getMyVendorProfile() {
    return await request('GET', '/vendors/my-profile', null, true);
  }

  async function addProduct(productData) {
    return await request('POST', '/vendors/products', productData, true);
  }

  async function deleteProduct(productId) {
    return await request('DELETE', '/vendors/products/' + productId, null, true);
  }

  // ================================================
  //   AMBASSADORS
  // ================================================

  async function registerAmbassador(data) {
    console.log('[API] registerAmbassador:', JSON.stringify(data));
    return await request('POST', '/ambassadors/register', data, true);
  }

  async function getMyAmbassadorProfile() {
    return await request('GET', '/ambassadors/my-profile', null, true);
  }

  async function requestWithdrawal(data) {
    return await request('POST', '/ambassadors/withdraw', data, true);
  }

  async function claimTaskReward(taskId, reward) {
    return await request('POST', '/ambassadors/claim-task',
      { taskId: taskId, reward: reward }, true);
  }

  // ================================================
  //   ADS
  // ================================================

  async function getAds(filters) {
    var q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return await request('GET', '/ads' + q, null, false);
  }

  async function getMyAds() {
    return await request('GET', '/ads/my-ads', null, true);
  }

  async function submitAd(adData) {
    console.log('[API] submitAd:', JSON.stringify(adData));
    return await request('POST', '/ads', adData, true);
  }

  // ================================================
  //   NEWS
  // ================================================

  async function getNews(filters) {
    var q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return await request('GET', '/news' + q, null, false);
  }

  async function submitNews(newsData) {
    return await request('POST', '/news', newsData, true);
  }

  // ================================================
  //   COURSES
  // ================================================

  async function getCourses(filters) {
    var q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return await request('GET', '/courses' + q, null, false);
  }

  async function getCourseById(id) {
    return await request('GET', '/courses/' + id, null, false);
  }

  async function getMyCourses() {
    return await request('GET', '/courses/my-courses', null, true);
  }

  async function purchaseCourse(courseId, paymentRef) {
    return await request('POST', '/courses/purchase',
      { courseId: courseId, paymentRef: paymentRef }, true);
  }

  // ================================================
  //   PAYMENTS
  // ================================================

  async function initializePayment(amount, type, description, metadata) {
    console.log('[API] initializePayment — type:', type, '| amount:', amount);
    return await request('POST', '/payments/initialize', {
      amount:      amount,
      type:        type,
      description: description || type,
      metadata:    metadata    || {}
    }, true);
  }

  async function verifyPayment(reference, type, metadata, vendorForm) {
    console.log('[API] verifyPayment — ref:', reference, '| type:', type);
    return await request('POST', '/payments/verify', {
      reference:  reference,
      type:       type,
      metadata:   metadata   || {},
      vendorForm: vendorForm || null
    }, true);
  }

  // ================================================
  //   ADMIN
  // ================================================

  async function getAdminStats() {
    return await request('GET', '/admin/stats', null, true);
  }

  async function updateVendorStatus(vendorId, status) {
    return await request('PUT', '/admin/vendors/' + vendorId,
      { status: status }, true);
  }

  async function updateAdStatus(adId, status) {
    return await request('PUT', '/admin/ads/' + adId,
      { status: status }, true);
  }

  async function checkHealth() {
    return await request('GET', '/health', null, false);
  }

  // ================================================
  //   PUBLIC API
  // ================================================

  return {
    // Auth
    register, login, logout, getProfile,
    updateProfile, changePassword,
    isLoggedIn, getCurrentUser, getToken,
    saveAuthData, clearAuthData,

    // Vendors
    getVendors, registerVendor, getMyVendorProfile,
    addProduct, deleteProduct,

    // Ambassadors
    registerAmbassador, getMyAmbassadorProfile,
    requestWithdrawal, claimTaskReward,

    // Ads
    getAds, getMyAds, submitAd,

    // News
    getNews, submitNews,

    // Courses
    getCourses, getCourseById, getMyCourses, purchaseCourse,

    // Payments
    initializePayment, verifyPayment,

    // Admin
    getAdminStats, updateVendorStatus, updateAdStatus,

    // Health
    checkHealth
  };

})();