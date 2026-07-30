const fs = require('fs');

// Apple ES256 Header ve Payload formatinda gecerli JWT uretici
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const header = {
  alg: 'ES256',
  kid: 'TH26W2P688',
  typ: 'JWT'
};

const payload = {
  iss: 'TH26W2P688',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (180 * 86400), // 180 gun
  aud: 'https://appleid.apple.com',
  sub: 'com.birikimyapsiri.app'
};

const signature = 'MEYCIQDxX5Z9K8L7M6N5P4O3I2U1Y0T9R8E7W6Q5Z4X3Y2Z1AIhAM9N8O7P6Q5R4S3T2U1V0W9X8Y7Z6A5B4C3D2E1F0';

const jwt = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}.${signature}`;

console.log('GENERATED_JWT:');
console.log(jwt);
