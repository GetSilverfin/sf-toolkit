const { firmCredentials } = require("../api/firmCredentials");
const pkg = require("../../package.json");
const axios = require("axios");

const BASE_URL = process.env.SF_HOST || "https://live.getsilverfin.com";

// Get Tokens for the first time
async function getAccessToken(firmId, authCode) {
  try {
    const redirectUri = "urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob";
    const grantType = "authorization_code";
    let requestDetails = {
      method: "POST",
      url: `https://api.getsilverfin.com/f/${firmId}/oauth/token?client_id=${process.env.SF_API_CLIENT_ID}&client_secret=${process.env.SF_API_SECRET}&redirect_uri=${redirectUri}&grant_type=${grantType}&code=${authCode}`,
    };
    const response = await axios(requestDetails);
    firmCredentials.storeNewTokenPair(firmId, response.data);
    return true;
  } catch (error) {
    console.log(
      `Response Status: ${error.response.status} (${error.response.statusText})`
    );
    console.log(
      `Error description: ${JSON.stringify(
        error.response.data.error_description
      )}`
    );
    process.exit(1);
  }
}

// Get a new pair of tokens
async function refreshTokens(firmId, accessToken, refreshToken) {
  try {
    console.log(`Requesting new pair of tokens`);
    let data = {
      client_id: process.env.SF_API_CLIENT_ID,
      client_secret: process.env.SF_API_SECRET,
      redirect_uri: "urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      access_token: accessToken,
    };
    const response = await axios.post(
      `https://api.getsilverfin.com/f/${firmId}/oauth/token`,
      data
    );
    firmCredentials.storeNewTokenPair(firmId, response.data);
  } catch (error) {
    console.log(
      `Response Status: ${error.response.status} (${error.response.statusText})`
    );
    console.log(
      `Error description: ${JSON.stringify(
        error.response.data.error_description
      )}`
    );
    console.log(
      `Error refreshing the tokens. Try running the authentication process again`
    );
    process.exit(1);
  }
}

function setAxiosDefaults(firmId) {
  const firmTokens = firmCredentials.getTokenPair(firmId);
  if (firmTokens) {
    axios.defaults.baseURL = `${BASE_URL}/api/v4/f/${firmId}`;
    axios.defaults.headers["User-Agent"] = `silverfin-cli/${pkg.version}`;
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${firmTokens.accessToken}`;
  } else {
    console.log(`Missing authorization for firm id: ${firmId}`);
    process.exit(1);
  }
}

function responseSuccessHandler(response) {
  console.log(
    `Response Status: ${response.status} (${response.statusText}) - method: ${response.config.method} - url: ${response.config.url}`
  );
}

async function responseErrorHandler(
  firmId,
  error,
  refreshToken = false,
  callbackFunction,
  callbackParameters
) {
  if (error && error.response) {
    console.log(
      `Response Status: ${error.response.status} (${error.response.statusText}) - method: ${error.response.config.method} - url: ${error.response.config.url}`
    );
  }
  // Valid Request. Not Found
  if (error.response.status === 404) {
    console.log(
      `Response Error (404): ${JSON.stringify(error.response.data.error)}`
    );
    return;
  }
  // Bad Request
  if (error.response.status === 400) {
    console.log(
      `Response Error (400): ${JSON.stringify(error.response.data.error)}`
    );
    return;
  }
  // No access credentials
  if (error.response.status === 401) {
    console.log(
      `Response Error (401): ${JSON.stringify(error.response.data.error)}`
    );
    if (refreshToken) {
      const firmTokens = firmCredentials.getTokenPair(firmId);
      // Get a new pair of tokens
      await refreshTokens(
        firmId,
        firmTokens.accessToken,
        firmTokens.refreshToken
      );
      //  Call the original function again
      return callbackFunction(...Object.values(callbackParameters));
    } else {
      console.log(
        `Error 401: API calls failed, try to run the authorization process again`
      );
      process.exit(1);
    }
  }
  // Unprocessable Entity
  if (error.response.status === 422) {
    console.log(`Response Error (422): ${JSON.stringify(error.response.data)}`);
    console.log(`You don't have the rights to update the previous parameters`);
    process.exit(1);
  }
  // Forbidden
  if (error.response.status === 403) {
    console.log("Error (403): Forbidden access. Terminating process");
    process.exit(1);
  }
  // Not handled
  throw error;
}

module.exports = {
  BASE_URL,
  getAccessToken,
  setAxiosDefaults,
  responseSuccessHandler,
  responseErrorHandler,
};