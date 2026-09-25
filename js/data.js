/* =========================================================
   FandomVerse — data.js
   Loads all JSON content files once, exposes via FV.data.
   FV_BASE is set per page (root pages: "", subfolder pages: "../").
   ========================================================= */

window.FV = window.FV || {};

FV.data = (async function loadAllData(){
  const base = window.FV_BASE || "";
  const files = {
    categories: base + "data/categories.json",
    articles: base + "data/articles.json",
    characters: base + "data/characters.json",
    events: base + "data/events.json",
    trailers: base + "data/trailers.json",
    merchandise: base + "data/merchandise.json",
    releases: base + "data/releases.json",
    chatbot: base + "data/chatbot.json"
  };

  const entries = await Promise.all(
    Object.entries(files).map(async ([key, path]) => {
      try{
        const res = await fetch(path, { cache: "no-store" });
        if(!res.ok) throw new Error(String(res.status));
        return [key, await res.json()];
      }catch(err){
        console.warn(`FandomVerse: could not load ${path} (${err.message || err})`);
        return [key, key === "chatbot" ? { intents: [], quickPrompts: [] } : []];
      }
    })
  );

  return Object.fromEntries(entries);
})();

FV.escapeHtml = function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
};

FV.catById = async function catById(id){
  const data = await FV.data;
  return (data.categories || []).find(c => c.id === id);
};
