import { readCookie } from './utils.jsx';

export default new function() {
    var listeners = {};
    var callbacks = {};

    var session_id = readCookie('session_id');
    
    var connecting = false;

    var websocket;
    var loggedIn = false;

    var connect = () => {
        if(session_id == null) {
            console.error('Could not find session_id cookie?!');
            return;
        }

        if(connecting) {
            return;
        }

        connecting = true;

        console.log('Connecting...');
        var s = new WebSocket('wss://www.roiatalla.com/active-learning/api');
        s.onopen = () => {
            websocket = s;
            console.log('Connected to server!');

            this.send('login', session_id, (err, user) => {
                if(err) {
                    console.error('Failed to authenticate to API.');
                } else {
                    console.log('Successfully logged in.');
                }

                loggedIn = true;
                this.emit('login', user);
            });
        };
        s.onmessage = (msg) => {
            var data = JSON.parse(msg.data);

            if(callbacks[data.id]) {
                var cb = callbacks[data.id];
                cb.callback(data.err, data.data, cb.request);
                delete callbacks[data.id];
            }
            else if(data.event) {
                this.emit(data.event, data.data);
            }
        };
        s.onclose = () => {
            websocket = null;
            loggedIn = false;
            connecting = false;
            console.log('Connection closed.');
            setTimeout(connect, 1000);
        };
    }

    function isSocketAvailable() {
        if(websocket == null) {
            alert('No connection to the server. Attemping to reconnect...');
            connect();
            return false;
        }

        return true;
    }

    this.isConnected = () => websocket != null;

    this.isLoggedIn = () => loggedIn;

    this.on = (command, callback) => {
        listeners[command] = listeners[command] || [];
        listeners[command].push(callback);
    }

    this.once = (command, callback) => {
        var func = (data) => {
            callback(data);
            this.remove(command, func);
        };

        this.on(command, func);
    }

    this.remove = (command, callback) => {
        var idx = listeners[command].indexOf(callback);
        if(idx >= 0) {
            listeners[command].splice(idx, 1);
        }
    }

    this.emit = (command, data) => {
        if(listeners[command]) {
            listeners[command].forEach((cb) => cb(data));
        }
    }

    var next_id = 0;

    this.send = (command, data, callback) => {
        if(!command) {
            return callback('Invalid command');
        }

        if(typeof data === 'function') {
            callback = data;
            data = undefined;
        }

        if(isSocketAvailable()) {
            var to_send = {
                id: next_id++,
                command: command,
                data: data
            };

            websocket.send(JSON.stringify(to_send));
            
            if(callback && typeof callback === 'function') {
                callbacks[to_send.id] = {request: to_send, callback: callback};
            }
        } else if(callback && typeof callback === 'function') {
            callback('Not connected');
        }
    }

    connect();
}
