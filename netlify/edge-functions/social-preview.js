export default async (request, context) => {
  // A real browser navigating to this URL (including in-app browsers like
  // WhatsApp's or Facebook's, which DO include "WhatsApp"/"FBAN" etc. in
  // their user-agent string) always sends sec-fetch-mode: navigate.
  // Link-preview crawlers fetch the page in the background to build a
  // card and never send this header. Checking it first means real
  // visitors always get the real page, no matter what.
  var secFetchMode = request.headers.get('sec-fetch-mode');
  if (secFetchMode === 'navigate') {
    return context.next();
  }

  var userAgent = request.headers.get('user-agent') || '';
  var isBot = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|Googlebot|redditbot/i.test(userAgent);

  if (!isBot) {
    return context.next();
  }

  var url       = new URL(request.url);
  var pathParts = url.pathname.split('/').filter(Boolean);
  var id        = url.searchParams.get('id') || pathParts[pathParts.length - 1] || null;
  var apiBase   = 'https://imc-backend-0i5i.onrender.com/api';

  var title       = 'Inside My Campus';
  var description = "Nigeria's #1 Campus Platform";
  var image       = 'https://insidemycampus.com/favicon.png';

  var isProduct = url.pathname.indexOf('product-details') !== -1 || url.pathname.indexOf('/product/') !== -1;
  var isEvent   = url.pathname.indexOf('event-details')   !== -1 || url.pathname.indexOf('/event/')   !== -1;
  var isNews    = url.pathname.indexOf('campus-news')      !== -1 || url.pathname.indexOf('/news/')    !== -1;

  try {
    if (isProduct && id) {
      var res  = await fetch(apiBase + '/vendors/products/all');
      var data = await res.json();
      var product = (data.products || []).find(function (p) { return p._id === id; });
      if (product) {
        title       = product.name;
        description = product.description || '';
        image       = (product.images && product.images[0]) || product.image || image;
      }
    } else if (isEvent && id) {
      var res  = await fetch(apiBase + '/events/' + id);
      var data = await res.json();
      if (data.event) {
        title       = data.event.title;
        description = data.event.description || '';
        image       = data.event.coverImage || image;
      }
    } else if (isNews && id) {
      var res  = await fetch(apiBase + '/news/' + id);
      var data = await res.json();
      if (data.news) {
        title       = data.news.title;
        description = (data.news.content || '').replace(/<[^>]*>/g, '').substring(0, 200);
        image       = data.news.image || image;
      }
    }
  } catch (err) {
    // fall through with defaults
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var safeTitle = esc(title);
  var safeDesc  = esc((description || '').substring(0, 200));

  var html =
    '<!DOCTYPE html><html><head>' +
    '<meta charset="utf-8"/>' +
    '<title>' + safeTitle + '</title>' +
    '<meta property="og:type" content="website"/>' +
    '<meta property="og:title" content="' + safeTitle + '"/>' +
    '<meta property="og:description" content="' + safeDesc + '"/>' +
    '<meta property="og:image" content="' + image + '"/>' +
    '<meta property="og:url" content="' + url.href + '"/>' +
    '<meta name="twitter:card" content="summary_large_image"/>' +
    '<meta name="twitter:title" content="' + safeTitle + '"/>' +
    '<meta name="twitter:description" content="' + safeDesc + '"/>' +
    '<meta name="twitter:image" content="' + image + '"/>' +
    '</head><body>' + safeTitle + '</body></html>';

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};

export const config = {
  path: ['/product-details.html', '/event-details.html', '/campus-news.html', '/product/*', '/event/*', '/news/*']
};