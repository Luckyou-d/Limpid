// Cloudflare Worker entry: rewrite clean routes to their static HTML, serve everything else from ./public
const REWRITES = {
  "/mobile": "/mobile.html",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = REWRITES[url.pathname];
    if (target) {
      url.pathname = target;
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
