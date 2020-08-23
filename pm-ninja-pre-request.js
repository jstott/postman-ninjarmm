/** 
* Postman pre-request authentication for Ninja RMM API requests.
*
* The NinjaRMM REST API uses a custom HTTP scheme based on a keyed-HMAC (Hash Message Authentication Code) for authentication.
* You must calculate and set each request headers with 'Authentication' and 'x-nj-date' values.

* This pre-request script is a solution to enable a more traditional api development workflow and exploration.
*
* ACTION NEEDED to use this helper script:
* In Postman, assign variables for Ninja RMM for:
*    baseUrl
*    ninja_accessKeyId 
*    ninja_secretAccessKey
*
* The access & secret keys can be found in the main NinjaRMM portal, under Configuration -> Integrations -> API
*
* Add this script as a pre-rerequest for your collection, such that all requests will use this script before calling the endpoint.
*
* @author J. Stott <jwstott@gmail.com>
*/

var CryptoJS = require("crypto-js");

// capture Ninja access tokens - set at environment, collection, or global
var privateKey = pm.variables.get("ninja_accessKeyId") ;
var secretAccessKey = pm.variables.get("ninja_secretAccessKey");

// capture selected element of the request
var reqElement = {
    canonicalPath: '/' + pm.request.url.path.join('/'),
    method: pm.request.method.toUpperCase(),
    contentMd5: '',
    contentType: '',
    date: new Date().toUTCString(),
}

// From the selected request element above, form a base64 encoded string
var encodedRequest = getEncodedRequest(reqElement);

// Use your API secret access key to calculate the HMAC of the derived signedString
var signature = getSignedSignature(secretAccessKey,encodedRequest);
//console.log('signature', signature);

// Construct the signature with your privateKey
let authorization = `NJ ${privateKey}:${signature}`;

// Add both the authorization and date headers to the current request
pm.request.headers.upsert({key: 'Authorization', value: authorization});
// date further limits the possibility a intercepted requests could be replayed (required by auth)
pm.request.headers.upsert({key: 'x-nj-date', value: reqElement.date}); 

//console.log('pre-request authorization completed');

/**
 * Construct and encoded a request signature
 */
function getEncodedRequest(element) {
    var sendString = [element.method, element.contentMD5,element.contentType,element.date,element.canonicalPath].join('\n');
    return Buffer.from(sendString).toString('base64')
}
 
/**
 * Sign a request signature
 */
function getSignedSignature(secretAccessKey, encodedSignature) {
    var signed = CryptoJS.HmacSHA1(encodedSignature, secretAccessKey);
    return signed.toString(CryptoJS.enc.Base64);
}