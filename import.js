var sjs = {
  modal: false,
  showDot: function () {
    var sjsInjection = document.createElement("div")
    sjsInjection.innerHTML = `
      <div style="position: fixed;right:50px;bottom:50px;"><img src="https://sync-js.pages.dev/icon.png" width="20" style="border: 5px solid rgba(0, 0, 0, 0.45);border-radius:20px;cursor:pointer;" onclick="sjs.openDialog()" title="sync.js" /></div>
      `;
    document.documentElement.appendChild(sjsInjection);
  },
  backUp: function (custom, useurl) {
    try {
      var lsdata = {}
      if (custom) {
        Object.keys(custom).forEach(function (k) {
          lsdata[custom[k]] = localStorage.getItem(custom[k])
        })
      } else {
        lsdata = localStorage
      }
      if (useurl) {
        window.open("https://sync-js.pages.dev/backup?fromURL=" + btoa(location.href) + "&data=" + btoa(JSON.stringify(lsdata)), "", "width=500,height=900")
      } else {
        window.open("https://sync-js.pages.dev/backup?fromURL=" + btoa(location.href), "", "width=500,height=900")
        window.addEventListener("message", function (e) {
          if (e.origin.includes("sync-js.pages.dev") && e.data == "SJS:LOADED") {
            e.source.postMessage("SJSDATA:" + btoa(JSON.stringify(lsdata)), "https://sync-js.pages.dev/")
          }
        })
      }
    } catch (err) {
      alert(err)
    }
  },
  restore: function () {
    window.open("https://sync-js.pages.dev/get?url=" + btoa(location.href), "", "width=500,height=900");
    window.addEventListener("message", (event) => {
      if (event.origin.includes("//sync-js.pages.dev")) {
        var sjsSYSjson = JSON.parse(event.data);
        Object.keys(sjsSYSjson).forEach(function (k) {
          localStorage.setItem(k, sjsSYSjson[k])
        });
        location.reload();
      }
    }, false);
  },
  openDialog: function () {
    if (sjs.modal) {
      console.log("y")
      sjsSetModal.style.display = 'block';
    } else {
      var sjsInjection = document.createElement("div")
      sjsInjection.innerHTML = `
<div style="display: block; /* Hidden by default */ position: fixed; /* Stay in place */ z-index: 1; /* Sit on top */ left: 0; top: 0; width: 100%; /* Full width */ height: 100%; /* Full height */ overflow: auto; /* Enable scroll if needed */ background-color: rgb(0,0,0); /* Fallback color */ background-color: rgba(0,0,0,0.4); /* Black w/ opacity */" id="sjsSetModal"><div style="display: block; position: fixed; z-index: 1; left: 0px; top: 0px; width: 100%; height: 100%; overflow: auto; background-color: rgba(0, 0, 0, 0.4);"><div style="margin: 15% auto; background: white; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); text-align: center; box-sizing: border-box; border-radius: 10px; width: 50%; border: 2px solid blue;padding: 20px;">
  <span style="color: red; float: right; font-size: 28px; font-weight: bold; cursor:pointer;" onclick="sjsSetModal.style.display = 'none'">×</span>
  <img src="https://sync-js.pages.dev/icon.png" style="margin:auto"><br>
  <button onclick="sjs.backUp()" style="transition: ease 150ms; background: #46b063; border: none; border-radius: 3px; width: 70%; height: 50px;">Back Up</button>
  <br>
  <button onclick="sjs.restore()" style="transition: ease 150ms; background: #46b063; border: none; border-radius: 3px; width: 70%; height: 50px;">Restore</button>
</div>
</div>
`;
      document.documentElement.appendChild(sjsInjection);
      sjs.modal = true;
    }
  }
}

//postMessage script: try { window.open("https://sync-js.pages.dev/backup?fromURL=" + btoa(location.href), "", "width=500,height=900"); window.addEventListener("message", function (e) { if (e.origin.includes("sync-js.pages.dev") && e.data == "SJS:LOADED") { e.source.postMessage("SJSDATA:" + btoa(JSON.stringify(localStorage)), "https://sync-js.pages.dev/") } }); } catch (error) { alert(error) }
