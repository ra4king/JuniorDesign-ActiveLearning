# BlackMamba-ActiveLearning
The Active Learning site for Junior Design 2016-2017.

Prerequisites
-------------
- NodeJS
- NPM
- MongoDB

Launching the server
--------------------
- Create a `config.json` file in `src/server` with keys: url, user, pwd, which are the URL of the MongoDB server, the username, and password of the MongoDB user.
- `npm install`
- `npm start`

By default the server is listening on port 1337 and expects the root path to start with `/active-learning`.
To change these, modify the values in `src/server/main.js` (and `src/server/debug.js` if using the debug mode).
