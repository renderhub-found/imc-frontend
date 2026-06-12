// ================================================
//   INSIDE MY CAMPUS — api.js
//   Complete production API client
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

  // ---- Helpers ----
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
  async function request(method, endpoint, data, auth) {
    try {
      var options = {
        method:  method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (auth) {
        var token = getToken();
        if (!token) {
          return { success: false, message: 'Not logged in.', notLoggedIn: true };
        }
        options.headers['Authorization'] = 'Bearer ' + token;
      }

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      var response = await fetch(BASE_URL + endpoint, options);
      var text     = await response.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('[API] Non-JSON from', endpoint, ':', text.substring(0, 200));
        return { success: false, message: 'Unexpected server response.' };
      }

    } catch (err) {
      console.error('[API]', endpoint, 'error:', err.message);
      return { success: false, message: 'Connection error.', networkError: true };
    }
  }

  // ---- AUTH ----
  async function register(data) {
    var r = await request('POST', '/auth/register', data, false);
    if (r.success) saveAuthData(r.token, r.user);
    return r;
  }

  async function login(email, password) {
    var r = await request('POST', '/auth/login',
      { email: email, password: password }, false);
    if (r.success) saveAuthData(r.token, r.user);
    return r;
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

  async function changePassword(current, next) {
    return await request('PUT', '/auth/change-password',
      { currentPassword: current, newPassword: next }, true);
  }

  async function forgotPassword(email) {
    return await request('POST', '/auth/forgot-password', { email: email }, false);
  }

  async function resetPassword(token, password) {
    return await request('POST', '/auth/reset-password',
      { token: token, password: password }, false);
  }

  // ---- VENDORS ----
  async function getVendors(f) {
    var q = f ? '?' + new URLSearchParams(f).toString() : '';
    return await request('GET', '/vendors' + q, null, false);
  }

  async function registerVendor(data) {
    console.log('[API] registerVendor:', JSON.stringify(data));
    return await request('POST', '/vendors/register', data, true);
  }

  async function getMyVendorProfile() {
    return await request('GET', '/vendors/my-profile', null, true);
  }

  async function addProduct(data) {
    return await request('POST', '/vendors/products', data, true);
  }

  async function deleteProduct(id) {
    return await request('DELETE', '/vendors/products/' + id, null, true);
  }

  // ---- AMBASSADORS ----
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

  // ---- ADS ----
  async function getAds(f) {
    var q = f ? '?' + new URLSearchParams(f).toString() : '';
    return await request('GET', '/ads' + q, null, false);
  }

  async function getMyAds() {
    return await request('GET', '/ads/my-ads', null, true);
  }

  async function submitAd(data) {
    console.log('[API] submitAd:', JSON.stringify(data));
    return await request('POST', '/ads', data, true);
  }

  // ---- NEWS ----
  async function getNews(f) {
    var q = f ? '?' + new URLSearchParams(f).toString() : '';
    return await request('GET', '/news' + q, null, false);
  }

  async function submitNews(data) {
    return await request('POST', '/news', data, true);
  }

  // ---- COURSES ----
  async function getCourses(f) {
    var q = f ? '?' + new URLSearchParams(f).toString() : '';
    return await request('GET', '/courses' + q, null, false);
  }

  async function getCourseById(id) {
    return await request('GET', '/courses/' + id, null, false);
  }

  async function getMyCourses() {
    return await request('GET', '/courses/my-courses', null, true);
  }

  // ---- PAYMENTS ----
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

  // ---- ADMIN ----
  async function getAdminStats() {
    return await request('GET', '/admin/stats', null, true);
  }

  async function updateVendorStatus(id, status) {
    return await request('PUT', '/admin/vendors/' + id, { status: status }, true);
  }

  async function checkHealth() {
    return await request('GET', '/health', null, false);
  }

  return {
    // Auth
    register, login, logout, getProfile,
    updateProfile, changePassword, forgotPassword, resetPassword,
    isLoggedIn, getCurrentUser, getToken, saveAuthData, clearAuthData,
    // Vendors
    getVendors, registerVendor, getMyVendorProfile, addProduct, deleteProduct,
    // Ambassadors
    registerAmbassador, getMyAmbassadorProfile, requestWithdrawal, claimTaskReward,
    // Ads
    getAds, getMyAds, submitAd,
    // News
    getNews, submitNews,
    // Courses
    getCourses, getCourseById, getMyCourses,
    // Payments
    initializePayment, verifyPayment,
    // Admin
    getAdminStats, updateVendorStatus,
    // Health
    checkHealth
  };

})();