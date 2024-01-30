void(window.open("https://sync-js.pages.dev/backup?fromURL=" + encodeURI(location.href) + "&data=" + btoa(JSON.stringify(localStorage)).replaceAll("+","%2B")))

window.open("https://sync-js.pages.dev/get?url=" + location.href);
var sjsSYSjson = JSON.parse(prompt("Paste Data:"));
Object.keys(sjsSYSjson).forEach(function (k) {localStorage.setItem(k,sjsSYSjson[k])})
