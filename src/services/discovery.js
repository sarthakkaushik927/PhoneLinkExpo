/**
 * src/services/discovery.js
 * =========================
 * Listens for UDP broadcast packets from the Python server
 * to automatically discover the server's IP and port.
 */

import dgram from 'react-native-udp';

class DiscoveryService {
  constructor() {
    this.socket = null;
    this.listeners = [];
  }

  startListening(port = 8766) {
    if (this.socket) return;

    try {
      this.socket = dgram.createSocket('udp4');
      
      this.socket.bind(port, function(err) {
        if (err) {
            console.error('UDP Bind Error:', err);
        }
      });

      this.socket.on('message', (msg, rinfo) => {
        try {
          const payload = JSON.parse(msg.toString());
          if (payload.service === 'PhoneLink' && payload.ip) {
            this.listeners.forEach(cb => cb(payload.ip, payload.port || 8765));
          }
        } catch (e) {
          // Ignore invalid JSON or unrelated packets
        }
      });

      this.socket.on('error', (err) => {
        console.error('UDP Error:', err);
        this.stopListening();
      });

    } catch (e) {
      console.error('Failed to start UDP discovery:', e);
    }
  }

  stopListening() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('Error closing UDP socket:', e);
      }
      this.socket = null;
    }
  }

  onDiscover(callback) {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  offDiscover(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }
}

export default new DiscoveryService();
