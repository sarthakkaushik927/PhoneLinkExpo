/**
 * src/config/server.config.js
 * ============================
 * Single source of truth for all server connectivity settings.
 *
 * ⚠️  ACTION REQUIRED BEFORE RUNNING:
 *     Update SERVER_IP to your desktop PC's LAN IPv4 address.
 *
 *     Windows → open a terminal and run: ipconfig
 *               look for "IPv4 Address" under your Wi-Fi adapter.
 *
 *     Linux   → open a terminal and run: ip addr
 *               look for "inet" on your wlan0 / wlp interface.
 *
 * Example:
 *     export const SERVER_IP = '192.168.1.42';
 */

/** @type {string} Your desktop PC's LAN IPv4 address. */
// Physical phone on Wi-Fi → use your laptop's LAN IPv4 address
// Run `ipconfig` on your PC and look for "IPv4 Address" under Wi-Fi adapter
export const SERVER_IP = '192.168.29.207'; // <── your laptop's LAN IP

/** @type {number} Must match PORT in server/.env (default: 8765). */
export const SERVER_PORT = 8765;

/** @type {string} Assembled WebSocket URL — do not edit directly. */
export const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;
