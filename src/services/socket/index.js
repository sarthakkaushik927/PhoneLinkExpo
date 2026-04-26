/**
 * src/services/socket/index.js
 * =============================
 * Exports a pre-built SocketClient singleton for app-wide use.
 *
 * Import the singleton:
 *     import socketClient from '../services/socket';
 *
 * Import the class (e.g. for testing):
 *     import { SocketClient } from '../services/socket';
 */

import SocketClient from './SocketClient';

const socketClient = new SocketClient();

export default socketClient;
export { SocketClient };
