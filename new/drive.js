const CLIENT_ID = '532321740472-sav0pgph4pqehgsu6ed1b6gges3uc9c1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDFaabRSbNULI9UxcBEzKqNE_01SiepwhE';
var FNAME = "syncjsdata.json"

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
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
      location.replace("login")
   }
   startup()
}


function gisLoaded() {
   tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
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
   } catch (err) {
      console.error(err.message);
      return;
   }
   const files = response.result.files;
   if (!files || files.length == 0) {
      uploadFile("{}")
      console.log('Sent to file creation');
      return;
   } else {
      var fid;
      Object.keys(files).forEach(function (k) {
         if (files[k].name == FNAME) {
            fid = files[k].id
         }
      })
      if (fid) {
         console.log("FileFound: " + fid)
         return fid;
      } else {
         return false
      }
   }
}


function get_doc(id) {
   const url = 'https://www.googleapis.com/drive/v3/files/' + id + '?alt=media';
   var authToken = gapi.auth.getToken();
   if (self.fetch) {
      var setHeaders = new Headers();
      setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
      setHeaders.append('Content-Type', "text/json");

      var setOptions = {
         method: 'GET',
         headers: setHeaders
      };
      return fetch(url, setOptions)
         .then(response => {
            if (response.ok) {
               var reader = response.body.getReader();
               var decoder = new TextDecoder();
               return reader.read().then(function (result) {
                  var data = decoder.decode(result.value, {
                     stream: !result.done
                  });
                  return data;
               });
            } else {
               console.error("Response error");
            }
         })
         .catch(error => {
            console.error(error.message);
         });
   }
}
async function deleteFile(fileId) {
   const access_token = gapi.auth.getToken().access_token;
   const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
   return await fetch(url, {
      method: 'DELETE',
      headers: {
         'Authorization': `Bearer ${access_token}`
      }
   }).then(res => res.json());
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
   await findFile().then(async function (fid) {
      if (fid == false) {
         uploadFile("{}")
         location.reload()
      } else {
         await get_doc(fid).then(function (data) {
            var d2 = JSON.parse(data)
            if (!d2[siteid]) {
               d2[siteid] = {}
            }
            Object.keys(jdata).forEach(function (k) {
               d2[siteid][k] = jdata[k]
            })
            deleteFile(fid)
            uploadFile(JSON.stringify(d2))
         });
      }
   })
}
