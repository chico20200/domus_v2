// backend/config/paypal.js
const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';


// Obtiene un token de acceso de PayPal
async function getAccessToken() {

    console.log('CLIENT_ID length:', process.env.PAYPAL_CLIENT_ID?.length);
  console.log('SECRET length:', process.env.PAYPAL_SECRET?.length);
  console.log('MODE:', process.env.PAYPAL_MODE);

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || 'Error autenticando con PayPal');
  }
  return data.access_token;
}



module.exports = { PAYPAL_API, getAccessToken };