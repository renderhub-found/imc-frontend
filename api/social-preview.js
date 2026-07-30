module.exports = async (req, res) => {
  var userAgent     = req.headers['user-agent'] || '';
  var secFetchMode  = req.headers['sec-fetch-mode'];
  var isBot = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|Googlebot|redditbot/i.test(userAgent);

  var type = req.query.type;
  var id   = req.query.id;

  var pageMap = {
    product: '/product-details.html?id=' + id,
    event:   '/event-details.html?id=' + id,
    news:    '/campus-news.html?id=' + id
  };
  var targetPage = pageMap[type] || '/';

  // Real navigation (including WhatsApp/Facebook in-app browsers) always
  // sends sec-fetch-mode: navigate. Crawlers building a link preview never
  // do. Anyone who isn't a recognized crawler goes straight to the real page.
  if (secFetchMode === 'navigate' || !isBot) {
    res.writeHead(302, { Location: targetPage });
    res.end();
    return;
  }

  var apiBase     = 'https://imc-backend-0i5i.onrender.com/api';
  var title       = 'Inside My Campus';
  var description = "Nigeria's #1 Campus Platform";
  var image       = 'https://insidemycampus.com/favicon.png';

  try {
    if (type === 'product' && id) {
      var r = await fetch(apiBase + '/vendors/products/all');
      var data = await r.json();
      var product = (data.products || []).find(function (p) { return p._id === id; });
      if (product) {
        title       = product.name;
        description = product.description || '';
        image       = (product.images && product.images[0]) || product.image || image;
      }
    } else if (type === 'event' && id) {
      var r = await fetch(apiBase + '/events/' + id);
      var data = await r.json();
      if (data.event) {
        title       = data.event.title;
        description = data.event.description || '';
        image       = data.event.coverImage || image;
      }
    } else if (type === 'news' && id) {
      var r = await fetch(apiBase + '/news/' + id);
      var data = await r.json();
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
  var pageUrl   = 'https://insidemycampus.com' + targetPage;

  var html =
    '<!DOCTYPE html><html><head>' +
    '<meta charset="utf-8"/>' +
    '<title>' + safeTitle + '</title>' +
    '<meta property="og:type" content="website"/>' +
    '<meta property="og:title" content="' + safeTitle + '"/>' +
    '<meta property="og:description" content="' + safeDesc + '"/>' +
    '<meta property="og:image" content="' + image + '"/>' +
    '<meta property="og:image:secure_url" content="' + image + '"/>' +
    '<meta property="og:image:width" content="1200"/>' +
    '<meta property="og:image:height" content="630"/>' +
    '<meta property="og:image:type" content="image/jpeg"/>' +
    '<meta property="og:url" content="' + pageUrl + '"/>' +
    '<meta name="twitter:card" content="summary_large_image"/>' +
    '<meta name="twitter:title" content="' + safeTitle + '"/>' +
    '<meta name="twitter:description" content="' + safeDesc + '"/>' +
    '<meta name="twitter:image" content="' + image + '"/>' +
    '</head><body>' + safeTitle + '</body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};