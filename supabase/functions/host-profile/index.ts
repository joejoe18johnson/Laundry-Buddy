import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const PACKAGE = "com.laundrybuddy.app"

function buildPage(deepLink: string, pageUrl: string): string {
  const intentPath = deepLink.replace(/^laundrybuddy:\/\//, "")
  const intentUrl =
    `intent://${intentPath}#Intent;scheme=laundrybuddy;package=${PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Laundry Buddy</title>
    <meta http-equiv="refresh" content="0;url=${deepLink.replace(/"/g, "&quot;")}" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f6f6f6;
        color: #242c34;
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        background: #fff;
        border-radius: 18px;
        padding: 32px 28px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        border: 1px solid #e8e8e8;
      }
      h1 { font-size: 1.5rem; margin: 0 0 12px; }
      p { color: #424242; line-height: 1.55; margin: 0 0 16px; }
      .btn {
        display: inline-block;
        margin-top: 8px;
        padding: 14px 20px;
        border-radius: 12px;
        background: #000;
        color: #fff;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 id="title">Opening Laundry Buddy</h1>
      <p id="status">Launching the app...</p>
      <a id="open-app" class="btn" href="${deepLink.replace(/"/g, "&quot;")}">Open Laundry Buddy</a>
    </div>
    <script>
      (function () {
        var deepLink = ${JSON.stringify(deepLink)};
        var intentUrl = ${JSON.stringify(intentUrl)};
        var isAndroid = /Android/i.test(navigator.userAgent);
        function tryOpenApp() {
          if (isAndroid && intentUrl) {
            window.location.replace(intentUrl);
            return;
          }
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            var iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = deepLink;
            document.body.appendChild(iframe);
            window.setTimeout(function () {
              try { document.body.removeChild(iframe); } catch (e) {}
            }, 2000);
          }
          window.location.replace(deepLink);
        }
        tryOpenApp();
        window.setTimeout(function () {
          document.getElementById('title').textContent = 'Open host profile';
          document.getElementById('status').textContent =
            'If Laundry Buddy did not open automatically, tap the button below.';
        }, 2200);
      })();
    </script>
  </body>
</html>`
}

function errorPage(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laundry Buddy</title></head><body><p>${message}</p></body></html>`
}

Deno.serve((req) => {
  const url = new URL(req.url)
  let hostId = url.searchParams.get("host")?.trim() ?? ""
  const hostUserId = url.searchParams.get("user")?.trim() ?? ""

  if (!hostId && !hostUserId) {
    return new Response(errorPage("This host profile link is missing its host id."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  if (!hostId && hostUserId) {
    hostId = `host-${hostUserId.slice(0, 8)}`
  }

  let deepLink = `laundrybuddy://host/${encodeURIComponent(hostId)}`
  if (hostUserId) {
    deepLink += `?user=${encodeURIComponent(hostUserId)}`
  }

  const pageUrl = url.toString()

  return new Response(buildPage(deepLink, pageUrl), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  })
})
