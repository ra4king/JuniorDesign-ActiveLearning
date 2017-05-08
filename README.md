# BlackMamba-ActiveLearning
The Active Learning site for Junior Design 2016-2017. Currently running at roiatalla.com/active-learning

### Prerequisites
-------------
- NodeJS: minimum v6.0: `sudo apt-get install nodejs`
- NPM: comes installed with NodeJS
- MongoDB: set it up with a user account: `sudo apt-get install mongodb`

### Launching the server
--------------------
- Create a `config.json` file in `src/server` with keys: url, user, pwd, which are the URL of the MongoDB server, the username, and password of the MongoDB user.

~~~    
{
  "url": "mongodb://localhost:27017/admin",
  "user": "admin",
  "pwd": "pwdforadmin"
}
~~~

- `npm install`
- `npm start`

To debug:
- `npm run debug`

By default the server is listening on port 1337 and expects the root path to start with `/active-learning`.
To change these, modify the values in `src/server/main.js` (and `src/server/debug.js` if using the debug mode).


### Release Notes:
--------------------

#### New Features
- Account creation with secure password encryption
- Course Creation with semesters for that course
  - Questions persist within a course from semester to semester
- Question creation for mutiple choice with image capability
- Quiz creation
  - Live quizzes
  - Review Quizzes
- Quiz settings
  - Open/Close Date
  - Number of submissions
  - Live or not
  - What the students see upon submission
- Roster and TA management with invitation link creation
- Statistics for students, quizzes, and questions
