const CLIENT_ID = '532321740472-sav0pgph4pqehgsu6ed1b6gges3uc9c1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDFaabRSbNULI9UxcBEzKqNE_01SiepwhE';
var FNAME = "syncjsdata.json"

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive.file \ https://www.googleapis.com/auth/userinfo.profile';
let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
   gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
   await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
   });
   gapiInited = true;
   var token = localStorage.getItem('gapi_token');
   if (token) {
      gapi.client.setToken(JSON.parse(token));
   } else if (!location.href.includes("login")) {
      location.replace("login?handoff=" + btoa(location.href).replaceAll("+", "%2B"))
   }
   if (!location.href.includes("login")) { setInterval(expireCheck, 500) }
   startup()
}


function gisLoaded() {
   tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      access_type: 'offline',
      expires_in: 43200,
      callback: ''
   });
   gisInited = true;
}

/**
 * Upload file to Google Drive.
 */
async function uploadFile(fileContent) {
   var file = new Blob([fileContent], {
      type: 'text/plain'
   });
   var metadata = {
      'name': FNAME, // Filename at Google Drive
      'mimeType': 'text/json', // mimeType at Google Drive
      // TODO [Optional]: Set the below credentials
      // Note: remove this parameter, if no target is needed
   };

   var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
   var form = new FormData();
   form.append('metadata', new Blob([JSON.stringify(metadata)], {
      type: 'application/json'
   }));
   form.append('file', file);

   var xhr = new XMLHttpRequest();
   xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
   xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
   xhr.responseType = 'json';
   xhr.onload = () => {
      console.log("File uploaded successfully. The Google Drive file id is %c" + xhr.response.id, "font-weight:bolder")
   };
   xhr.send(form);
}
async function findFile() {
   let response;
   try {
      response = await gapi.client.drive.files.list({
         'pageSize': 10,
         'fields': 'files(id, name)',
      });
      console.log(response)
   } catch (err) {
      console.error(err.message);
      return;
   }
   const files = response.result.files;
   var fid;
   Object.keys(files).forEach(async function (k) {
      if (files[k].name == FNAME) {
         if (fid) {
            alert("Duplicate data file found. Cleaning up...")
            var combine = {};
            console.log(combine)
            await get_doc(fid).then(function (data1) {
               console.log(data1)
               var data2 = JSON.parse(data1)
               Object.keys(data2).forEach(function (k) {
                  combine[k] = data2[k]
               })
            })
            await get_doc(files[k].id).then(function (data1) {
               console.log(data1)
               var data2 = JSON.parse(data1)
               Object.keys(data2).forEach(function (k) {
                  combine[k] = data2[k]
               })
            })
            console.log(combine)
            await deleteFile(fid)
            await deleteFile(files[k].id)
            await uploadFile(JSON.stringify(combine))
            setTimeout(function () { location.reload() }, 1000)
         } else {
            fid = files[k].id
         }
      }
   })
   if (fid) {
      console.log("FileFound: " + fid)
      return fid;
   } else {
      return false
   }
}


// function get_doc(id) {
//    const url = 'https://www.googleapis.com/drive/v3/files/' + id + '?alt=media';
//    var authToken = gapi.auth.getToken();
//    if (self.fetch) {
//       var setHeaders = new Headers();
//       setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
//       setHeaders.append('Content-Type', "text/json");

//       var setOptions = {
//          method: 'GET',
//          headers: setHeaders
//       };
//       return fetch(url, setOptions)
//          .then(response => {
//             if (response.ok) {
//                var reader = response.body.getReader();
//                var decoder = new TextDecoder();
//                return reader.read().then(function (result) {
//                   var data = decoder.decode(result.value, {
//                      stream: !result.done
//                   });
//                   return data;
//                });
//             } else {
//                console.error("Response error");
//             }
//          })
//          .catch(error => {
//             console.error(error.message);
//          });
//    }
// }


// Disclosure: this function was mostly generated by Google Gemini
async function get_doc(id) {
    const url = 'https://www.googleapis.com/drive/v3/files/' + id + '?alt=media';
    const authToken = gapi.auth.getToken();

    if (!authToken || !authToken.access_token) {
        console.error("Authentication token not available. Please ensure GAPI is loaded and authenticated.");
        return await get_doc(id);
    }

    const setHeaders = new Headers();
    setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
    setHeaders.append('Content-Type', "application/json");

    const setOptions = {
        method: 'GET',
        headers: setHeaders
    };

    try {
        const response = await fetch(url, setOptions);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`HTTP error! Status: ${response.status} - ${response.statusText}. Response: ${errorBody.substring(0, 500)}`);
            return null;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let receivedChunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            receivedChunks.push(value);
        }

        let totalLength = 0;
        for (const chunk of receivedChunks) {
            totalLength += chunk.length;
        }
        let combinedChunks = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of receivedChunks) {
            combinedChunks.set(chunk, offset);
            offset += chunk.length;
        }

        const textData = decoder.decode(combinedChunks);

        return textData;

    } catch (error) {
        alert("Error fetching JSON from Google Drive:\n" + error.message)
        console.error("Error fetching JSON from Google Drive:", error.message);
        return null;
    }
}

async function deleteFile(fileId) {
   console.log("Delete: " + fileId)
   const access_token = gapi.auth.getToken().access_token;
   const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
   return await fetch(url, {
      method: 'DELETE',
      headers: {
         'Authorization': `Bearer ${access_token}`
      }
   }).then(res => console.log(res));
}

async function addEntries(jdata) {
   await findFile().then(async function (fid) {
      if (fid == false) {
         uploadFile(JSON.stringify(jdata))
      } else {
         await get_doc(fid).then(function (data) {
            var d2 = JSON.parse(data)
            Object.keys(jdata).forEach(function (k) {
               d2[k] = jdata[k]
            })
            deleteFile(fid)
            uploadFile(JSON.stringify(d2))
         });
      }
   })
}

async function addEntriesBySite(jdata, siteid) {
   console.log(jdata)
   await findFile().then(async function (fid) {
      if (fid == false) {
         await uploadFile("{}")
         alert("Storage file not found. Press OK to create it and reload.")
         setTimeout(function () { location.reload() }, 200)
      } else {
         await get_doc(fid).then(function (data) {
            console.log(data)
            var d2 = JSON.parse(data)
            if (!d2[siteid]) {
               d2[siteid] = {}
            }
            Object.keys(jdata).forEach(function (k) {
               d2[siteid][k] = jdata[k]
            })
            deleteFile(fid)
            console.log(JSON.stringify(d2))
            uploadFile(JSON.stringify(d2))
         });
      }
   })
}

async function editorDelete(domain) {
   await findFile().then(async function (fid) {
      if (fid == false) {
         alert("How did you get this error?")
         location.reload()
      } else {
         await get_doc(fid).then(function (data) {
            var d2 = JSON.parse(data)
            console.log(d2[domain])
            delete d2[domain]
            console.log(d2)
            var con1 = confirm("Are you sure you want to delete all data from " + domain + "?")
            if (con1 == true) {
               deleteFile(fid)
               uploadFile(JSON.stringify(d2))
               alert("Deleted Successfully")
               startup()
            }
         });
      }
   })
}

async function expireCheck() {
   var data = await (await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + gapi.auth.getToken().access_token)).json();
   if (data.error == "invalid_token") {
      localStorage.setItem("gapi_token", "")
      location.replace("login?handoff=" + btoa(location.href).replaceAll("+", "%2B"))
   }
}

async function showProfileBR() {
   var profile = await (await fetch("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + gapi.auth.getToken().access_token)).json();
   profContent.innerHTML = `<img src="${profile.picture}" style="border-radius:100%" width="25">${profile.name}`
}
