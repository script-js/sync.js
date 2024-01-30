void(window.open("https://sync-js.pages.dev/backup?fromURL=" + encodeURI(location.href) + "&data=" + btoa(JSON.stringify(localStorage)).replaceAll("+","%2B")))

alert("A new tab will open with the stored data. Copy it, then paste it into the next prompt.");
window.open("https://sync-js.pages.dev/get?url=" + location.href);
var sjsSYSjson = JSON.parse(prompt("Paste Data:"));
Object.keys(sjsSYSjson).forEach(function (k) {localStorage.setItem(k,sjsSYSjson[k])})
