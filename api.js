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
    : 'https://imc-backend-0i5i.onrender.com/api';

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
      var isFormData = data instanceof FormData;

      var options = {
        method:  method,
        headers: {}
      };

      if (!isFormData) {
        options.headers['Content-Type'] = 'application/json';
      }
      // FormData sets its own Content-Type with boundary automatically — never set it manually

      if (auth) {
        var token = getToken();
        if (!token) {
          return { success: false, message: 'Not logged in.', notLoggedIn: true };
        }
        options.headers['Authorization'] = 'Bearer ' + token;
      }

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = isFormData ? data : JSON.stringify(data);
      }

      var response = await fetch(BASE_URL + endpoint, options);

      // ---- Session expired / invalid token ----
      // If an authenticated request comes back 401, the token is no longer
      // valid (expired, rotated secret, deleted user, etc). Clear the stale
      // session and send the user to a clean login instead of leaving pages
      // silently broken while still "looking" logged in.
      if (auth && response.status === 401 && !window.location.pathname.endsWith('login.html')) {
        clearAuthData();
        window.location.href = 'login.html?sessionExpired=true';
        return { success: false, message: 'Session expired. Please log in again.' };
      }

      var text = await response.text();

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
    console.log('[API] login called — email:', email);
    var result = await request('POST', '/auth/login', {
      email:    email,
      password: password
    }, false);
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

  // ---- Google Auth ----
  async function googleAuth(credential) {
    console.log('[API] googleAuth called');
    var result = await request('POST', '/auth/google', { credential: credential }, false);
    if (result.success) saveAuthData(result.token, result.user);
    return result;
  }

  // ---- Events ----
  async function getEvents(filters) {
    var q = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return await request('GET', '/events' + q, null, false);
  }

  async function getEventById(id) {
    return await request('GET', '/events/' + id, null, false);
  }

  async function createEvent(data) {
    return await request('POST', '/events', data, true);
  }

  async function updateEvent(id, data) {
    return await request('PUT', '/events/' + id, data, true);
  }

  async function deleteEvent(id) {
    return await request('DELETE', '/events/' + id, null, true);
  }

  async function getMyEvents() {
    return await request('GET', '/events/my-events', null, true);
  }

  async function getMyTickets() {
    return await request('GET', '/events/my-tickets', null, true);
  }

  async function purchaseTicket(eventId, ticketTypeId, data) {
    return await request(
      'POST',
      '/events/' + eventId + '/tickets/' + ticketTypeId + '/purchase',
      data,
      true
    );
  }

// ---- Ticket verification ----
  async function verifyTicket(eventId, ticketCode) {
    return await request('POST', '/events/' + eventId + '/verify-ticket',
      { ticketCode: ticketCode }, true);
  }

  // ---- Admin: Events + Notifications ----
  async function getAdminEvents() {
    return await request('GET', '/admin/events', null, true);
  }

  async function getAdminNotifications() {
    return await request('GET', '/admin/notifications', null, true);
  }

  // ---- Ambassador withdrawals ----
  async function getMyWithdrawals() {
    return await request('GET', '/ambassadors/my-withdrawals', null, true);
  }

  // ---- Ambassador news with file upload ----
  async function submitNewsWithFiles(formData) {
    return await request('POST', '/news', formData, true);
  }

  // ---- Notifications ----
  async function getNotifications() {
    return await request('GET', '/notifications', null, true);
  }

  async function getMyNotifications() {
    return await request('GET', '/notifications', null, true);
  }

  async function getUnreadCount() {
    return await request('GET', '/notifications/unread-count', null, true);
  }

  async function markNotificationRead(id) {
    return await request('PUT', '/notifications/' + id + '/read', null, true);
  }

  async function markAllNotificationsRead() {
    return await request('PUT', '/notifications/read-all', null, true);
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

  async function addProductWithFiles(formData) {
    return await request('POST', '/vendors/products', formData, true);
  }

  async function deleteProduct(id) {
    return await request('DELETE', '/vendors/products/' + id, null, true);
  }

  async function getAllProducts() {
    return await request('GET', '/vendors/products/all', null, false);
  }

  async function logProductLead(productId, customerName) {
    return await request('POST', '/vendors/products/' + productId + '/lead',
      { customerName: customerName }, false);
  }

  async function logProductClick(productId) {
    return await request('POST', '/vendors/products/' + productId + '/click', {}, false);
  }

  async function rateVendor(vendorId, value) {
    return await request('POST', '/vendors/' + vendorId + '/rate', { value: value }, true);
  }

  async function uploadVendorProfilePicture(formData) {
    return await request('PUT', '/vendors/profile-picture', formData, true);
  }

  async function updateVendorProfile(formData) {
    return await request('PUT', '/vendors/profile', formData, true);
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

  async function createNewsAdmin(formData) {
    return await request('POST', '/news/admin/create', formData, true);
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

  // ---- EVENT IMAGE UPLOAD ----
  async function createEventWithFile(formData) {
    return await request('POST', '/events', formData, true);
  }

  async function checkHealth() {
    return await request('GET', '/health', null, false);
  }

  return {
    // Auth
    register, login, logout, getProfile,
    updateProfile, changePassword, forgotPassword, resetPassword,
    isLoggedIn, getCurrentUser, getToken, saveAuthData, clearAuthData,
    // Google
    googleAuth,
    // Vendors
    getVendors, registerVendor, getMyVendorProfile,
    addProduct, addProductWithFiles, deleteProduct,
    getAllProducts, logProductLead, logProductClick, rateVendor, uploadVendorProfilePicture, updateVendorProfile,
    // Events
    getEvents, getEventById, createEvent, createEventWithFile, updateEvent, deleteEvent,
    getMyEvents, purchaseTicket, getMyTickets,
    verifyTicket, getAdminEvents, getAdminNotifications,
    getMyWithdrawals, submitNewsWithFiles,
    // Notifications
    getNotifications, getMyNotifications, getUnreadCount,
    markNotificationRead, markAllNotificationsRead,
    // Ambassadors
    registerAmbassador, getMyAmbassadorProfile, requestWithdrawal, claimTaskReward,
    // Ads
    getAds, getMyAds, submitAd,
    // News
    getNews, submitNews, createNewsAdmin,
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