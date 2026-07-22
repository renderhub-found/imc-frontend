// ================================================
//   app.js — shared helper only.
//   The old homepage-loading functions this file used to contain
//   (loadTrendingVendors, loadHomeNews, loadHomeMarketplace,
//   loadHomeEvents, loadHomeAds) targeted container IDs that no longer
//   exist on Index.html — Index.html now loads its own homepage data
//   directly. Leaving those functions in meant every page that includes
//   app.js (13 pages) fired 5 extra, completely wasted API calls on
//   every load, and on Index.html specifically it doubled the number of
//   requests hitting the backend at once — which is why the homepage
//   needed a refresh or two before it caught up.
// ================================================

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}