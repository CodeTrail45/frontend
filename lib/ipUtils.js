// File: lib/ipUtils.js

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    // Use req.socket.remoteAddress (or similar) to get the IP.
    let ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.socket?.remoteAddress || '';
  
    // Normalize IPv6-mapped IPv4 addresses.
    if (ip && ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }
    // Normalize IPv6 loopback address to IPv4.
    if (ip === '::1') {
      ip = '127.0.0.1';
    }
    return ip;
  }
  
module.exports = { getClientIp };
  