var socket = new function() {
    var listeners = {};
    var callbacks = {};

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i].trim();
            if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
        }
        return null;
    }

    var session_id = readCookie('session_id');
    
    var connecting = false;

    var thisSocket = this;

    var websocket;

    function connect() {
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
        s.onopen = function() {
            websocket = s;
            console.log('Connected to server!');

            thisSocket.send('login', session_id, function(err) {
                if(err) {
                    console.error('Failed to authenticate to API.');
                } else {
                    console.log('Successfully logged in.');
                }

                thisSocket.emit('login', !err);
            });
        };
        s.onmessage = function(msg) {
            var data = JSON.parse(msg.data);

            if(callbacks[data.id]) {
                var cb = callbacks[data.id];
                cb.callback(data.err, data.data, cb.request);
                delete callbacks[data.id];
            }
            else if(!data.err) {
                thisSocket.emit(data.id, data.data);
            }
        };
        s.onclose = function() {
            websocket = null;
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

    this.on = function(command, callback) {
        listeners[command] = listeners[command] || [];
        listeners[command].push(callback);
    }

    this.once = function(command, callback) {
        var func = function(data) {
            callback(data);

            var idx = listeners[command].indexOf(func);
            if(idx >= 0) {
                listeners[command].splice(idx, 1);
            }
        };

        this.on(command, func);
    }

    this.emit = function(command, data) {
        if(listeners[command]) {
            listeners[command].forEach((cb) => cb(data));
        }
    }

    var next_id = 0;

    this.send = function(command, data, callback) {
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
