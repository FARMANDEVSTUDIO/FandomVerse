/* =========================================================
   FandomVerse — bookmarks.js
   Content bookmarking system. Bookmarks persist in localStorage;
   personal notes are session-only (sessionStorage), per the SRS.
   ========================================================= */

window.FV = window.FV || {};

const FV_BM_KEY = "fv_bookmarks";
const FV_NOTES_KEY = "fv_bookmark_notes";

FV.loadBookmarks = function loadBookmarks(){
  try{ return JSON.parse(localStorage.getItem(FV_BM_KEY)) || []; }catch(e){ return []; }
};
FV.saveBookmarks = function saveBookmarks(list){
  try{ localStorage.setItem(FV_BM_KEY, JSON.stringify(list)); }catch(e){}
};
FV.isBookmarked = function isBookmarked(type, id){
  return FV.loadBookmarks().some(b => b.type === type && b.id === id);
};
FV.toggleBookmark = function toggleBookmark(type, id, title, href){
  let list = FV.loadBookmarks();
  const exists = list.find(b => b.type === type && b.id === id);
  if(exists){
    list = list.filter(b => !(b.type === type && b.id === id));
    FV.showToast && FV.showToast("Removed from bookmarks.");
  }else{
    list.push({ type, id, title, href, savedAt: Date.now() });
    FV.showToast && FV.showToast("Added to bookmarks.");
  }
  FV.saveBookmarks(list);
  document.querySelectorAll(`[data-bookmark-type="${type}"][data-bookmark-id="${id}"]`).forEach(btn => {
    btn.classList.toggle("bookmarked", !exists);
    btn.innerHTML = FV.icon(exists ? "bookmark" : "bookmarkFilled", 16);
    if(!exists){
      btn.classList.remove("flash-highlight");
      void btn.offsetWidth;
      btn.classList.add("flash-highlight");
    }
  });
  FV.renderBookmarkCount && FV.renderBookmarkCount();
};

FV.saveNote = function saveNote(key, text){
  try{
    const notes = JSON.parse(sessionStorage.getItem(FV_NOTES_KEY)) || {};
    notes[key] = text;
    sessionStorage.setItem(FV_NOTES_KEY, JSON.stringify(notes));
  }catch(e){}
};
FV.getNote = function getNote(key){
  try{ const notes = JSON.parse(sessionStorage.getItem(FV_NOTES_KEY)) || {}; return notes[key] || ""; }catch(e){ return ""; }
};

FV.renderBookmarkCount = function renderBookmarkCount(){
  const el = document.getElementById("bookmarkCount");
  if(!el) return;
  const n = FV.loadBookmarks().length;
  el.textContent = n;
  el.classList.toggle("hidden", n === 0);
};

document.addEventListener("DOMContentLoaded", () => {
  FV.renderBookmarkCount();

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bookmark-type]");
    if(!btn) return;
    e.preventDefault(); e.stopPropagation();
    FV.toggleBookmark(btn.dataset.bookmarkType, btn.dataset.bookmarkId, btn.dataset.bookmarkTitle, btn.dataset.bookmarkHref);
  });
});
