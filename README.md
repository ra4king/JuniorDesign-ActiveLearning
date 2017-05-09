# BlackMamba-ActiveLearning
The Active Learning site for Junior Design 2016-2017. Currently running at roiatalla.com/active-learning

### Prerequisites
-------------
- NodeJS: minimum v6.0: `sudo apt-get install nodejs`
- NPM: comes installed with NodeJS
- MongoDB: set it up with a user account: `sudo apt-get install mongodb`

### Launching the server
--------------------
- Create a `config.json` file in `src/server` like so:

~~~
{
  "port": 1337,                                   /* the port the server will be listening on */
  "base_path": "/active-learning",                /* the base path of the site */
  "mongo_url": "mongodb://localhost:27017/admin", /* the URL of the MongoDB instance */
  "user": "admin",                                /* the username of the MongoDB account */
  "pwd": "pwdforadmin"                            /* the password of the MongoDB account */
}
~~~

- `npm install`
- `npm start`


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
