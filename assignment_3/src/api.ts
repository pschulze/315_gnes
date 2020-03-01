import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:8000');

export function init(userId) {
  socket.emit('init', userId);
}

export function emitMessage(userId, message) {
  socket.emit('message', { userId, message });
  console.log(`sent message: ${message} from ${userId}`);
}

export function subscribeToStateUpdate(callback) {
  socket.on('sync_state', (messages, users) => callback(messages, users));
  console.log('subscribed to state updates');
}

export function requestState() {
  socket.emit('sync_state');
}

export function subscribeToErrors(callback) {
  socket.on('bad_value', (errorMessage) => callback(errorMessage));
}

export function updateUser(user) {
  socket.emit('update_user', user);
  console.log('sent update user message');
}
