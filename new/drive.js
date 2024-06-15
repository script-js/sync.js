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

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
	gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
	await gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: [DISCOVERY_DOC],
	});
	gapiInited = true;
	maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: '', // defined later
	});
	gisInited = true;
	maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
	if (gapiInited && gisInited) {
		document.getElementById('authorize_button').style.visibility = 'visible';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	tokenClient.callback = async (resp) => {
		if (resp.error !== undefined) {
			throw (resp);
		}
		document.getElementById('signout_button').style.visibility = 'visible';
		document.getElementById('authorize_button').value = 'Refresh';
                await findFile().then(function (fid) {
		  if (fid == false) {
		    uploadFile("{}")
		  }
		})
	};

	if (gapi.client.getToken() === null) {
		// Prompt the user to select a Google Account and ask for consent to share their data
		// when establishing a new session.
		tokenClient.requestAccessToken({ prompt: 'consent' });
	} else {
		// Skip display of account chooser and consent dialog for an existing session.
		tokenClient.requestAccessToken({ prompt: '' });
	}
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
	const token = gapi.client.getToken();
	if (token !== null) {
		google.accounts.oauth2.revoke(token.access_token);
		gapi.client.setToken('');
		document.getElementById('content').style.display = 'none';
		document.getElementById('content').innerHTML = '';
		document.getElementById('authorize_button').value = 'Authorize';
		document.getElementById('signout_button').style.visibility = 'hidden';
	}
}

/**
 * Upload file to Google Drive.
 */
async function uploadFile(fileContent) {
	var file = new Blob([fileContent], { type: 'text/plain' });
	var metadata = {
		'name': FNAME, // Filename at Google Drive
		'mimeType': 'text/json', // mimeType at Google Drive
		// TODO [Optional]: Set the below credentials
		// Note: remove this parameter, if no target is needed
	};

	var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
	var form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	var xhr = new XMLHttpRequest();
	xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
	xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xhr.responseType = 'json';
	xhr.onload = () => {
		document.getElementById('content').innerHTML = "File uploaded successfully. The Google Drive file id is <b>" + xhr.response.id + "</b>";
		document.getElementById('content').style.display = 'block';
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
          document.getElementById('content').innerText = err.message;
          return;
        }
        const files = response.result.files;
	console.log(files)
        if (!files || files.length == 0) {
		uploadFile("{}") 
          document.getElementById('content').innerText = 'No files found.';
          return;
        } else {
	var fid;
        Object.keys(files).forEach(function(k) {
	  if (files[k].name == FNAME) {
	    console.log(files[k])
            fid = files[k].id
	  }
	})
        if (fid) {
	  return fid;
	} else {
	  return false
	}
	}
      }


		  function get_doc(id){
    const url = 'https://www.googleapis.com/drive/v3/files/'+id+'?alt=media';
    var authToken = gapi.auth.getToken();
    if(self.fetch){
        var setHeaders = new Headers();
        setHeaders.append('Authorization', 'Bearer ' + authToken.access_token);
        setHeaders.append('Content-Type', "text/json");

        var setOptions = {
            method: 'GET',
            headers: setHeaders
        };
        return fetch(url,setOptions)
            .then(response => { 
                if(response.ok){
                    var reader = response.body.getReader();
                    var decoder = new TextDecoder();
                    return reader.read().then(function(result){
                        var data = decoder.decode(result.value, {stream: !result.done});
                        console.log(data);
                        return data;
                    });
                }
                else{
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
			console.log(fid)
			if (fid == false) {
			  uploadFile(JSON.stringify(jdata))
			} else {
		  await get_doc(fid).then(function(data) {
			  console.log(data)
		    var d2 = JSON.parse(data)
		    Object.keys(jdata).forEach(function(k) {
		      d2[k] = jdata[k]
		    })
		    deleteFile(fid)
		    uploadFile(JSON.stringify(d2))
		  });
			}
		  })
		}