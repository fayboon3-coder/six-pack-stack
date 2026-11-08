/* Funnel tracking for the website. Writes to the same `events` table as the app
   (supabase/006_events.sql) and shares the app's anonymous id ("sps:anon"), so one
   person can be followed from a video link, through the Stack Score, into the app
   and to a purchase. Fire-and-forget: it never blocks or breaks a page. */
(function () {
  var URL_ = "https://ejcditarwgsqasecuqmx.supabase.co/rest/v1/events";
  var KEY = "sb_publishable_7-MLNhS_mB4odxRMlNo4CA_99Dn50vk"; // publishable (public) key, same as the app
  var sent = {};
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function anon() {
    var id = store("sps:anon");
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); store("sps:anon", id); }
    return id;
  }
  function src() {
    var v = "";
    try { var q = new URLSearchParams(location.search); v = q.get("src") || q.get("utm_source") || ""; } catch (e) {}
    if (v) store("sps_src", v.slice(0, 80)); else v = store("sps_src") || "";
    return (v || "direct").slice(0, 80);
  }
  // Boon's own devices: open any page once with ?internal=1 and that browser stops being
  // counted (?internal=0 turns counting back on). Keeps test clicks out of the funnel numbers.
  var internal = (function () {
    try {
      var f = new URLSearchParams(location.search).get("internal");
      if (f === "1") localStorage.setItem("sps:internal", "1");
      if (f === "0") localStorage.removeItem("sps:internal");
      return localStorage.getItem("sps:internal") === "1";
    } catch (e) { return false; }
  })();
  window.spsTrack = function (name, props, once) {
    try {
      props = props || {};
      props.src = props.src || src();
      props.page = location.pathname.replace(/\.html$/, "") || "/";
      var key = name + JSON.stringify(props);
      if (once && sent[key]) return; sent[key] = 1;
      if (internal || /\b(localhost|127\.0\.0\.1)\b/.test(location.hostname)) return; // don't count tests
      fetch(URL_, {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=minimal" },
        body: JSON.stringify({ anon_id: anon(), name: String(name).slice(0, 40), props: props, platform: "web" })
      }).catch(function () {});
    } catch (e) {}
  };
})();
