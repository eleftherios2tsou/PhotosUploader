const qrcode = require('qrcode-terminal');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const url = `http://${ip}:3000`;

console.log(`\nScan this QR code to upload wedding photos:\n`);
qrcode.generate(url, { small: true });
console.log(`\nURL: ${url}\n`);
