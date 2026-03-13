"use strict";
(function(){
  try {
    const l = localStorage.getItem("datashop_lang");
    if (l && typeof setLang === "function") setLang(l);
  } catch(e) {}
})();
