// ----------------------------------------------------------------------------
// Table of contents
// ...
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// 1. Initialize app and modules
// ----------------------------------------------------------------------------
var express = require('express')
var path = require('path')
// var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var flash = require('express-flash')

// ----------------------------------------------------------------------------
// 1a. Passport authentication, strategies and sessions
// ----------------------------------------------------------------------------
var passport = require('passport')
var MeetupStrategy = require('passport-meetup').Strategy
var LinkedInStrategy = require('passport-linkedin').Strategy
var MEETUP_KEY = process.env.MEETUP_KEY
var MEETUP_SECRET = process.env.MEETUP_SECRET
var LINKEDIN_KEY = process.env.LINKEDIN_KEY
var LINKEDIN_SECRET = process.env.LINKEDIN_SECRET
console.log('MEETUP_KEY: ', MEETUP_KEY)
console.log('typeof MEETUP_KEY: ', typeof MEETUP_KEY)

// ----------------------------------------------------------------------------
// 1b. Knex setup
// ----------------------------------------------------------------------------
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  },
  pool: {
    min: 0,
    max: 30
  }
})

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Meetup profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

function buildUserObj (memberid, accesstoken, usertypeid, name, meetupprofileurl, imageurl, meetupbio, alerts) {
  var user = {memberid, accesstoken, usertypeid, name, meetupprofileurl, imageurl, meetupbio, alerts}
  return user
}

function buildUser (profile, accesstoken, usertypeid) {
  var raw = JSON.parse(profile._raw).results[0]
  var photo = ''
  if (raw.photo) {
    photo = raw.photo.photo_link || ''
  }
  return buildUserObj(profile.id, accesstoken, usertypeid, profile.displayName, raw.link, photo, raw.bio, 'OFF')
}

function addTopics (profile) {
  var memberid = profile.id
  profile._json.results[0].topics.forEach(function (e, i) {
    knex('topics')
      .insert({ memberid, topic: e.name })
      .catch(function (err) { console.log(err) })
  })
}

function addSocialMediaLinks (profile) {
  var memberid = profile.id
  var mediaservices = profile._json.results[0].other_services
  for (var e in mediaservices) {
    var socialmediauid
    var mediaprofileurl = mediaservices[e].identifier

    switch (e) {
      case 'facebook':
        socialmediauid = 1
        break
      case 'twitter':
        socialmediauid = 2
        mediaprofileurl = 'http://twitter.com/' + mediaservices[e].identifier.slice(1)
        break
      case 'linkedin':
        socialmediauid = 3
        break
      case 'flickr':
        socialmediauid = 4
        break
      case 'tumblr':
        socialmediauid = 5
        break
      default:
        console.error('Unknown social media outlet')
    }

    knex('socialmedialinks')
      .insert({ memberid, socialmediauid, mediaprofileurl })
      .catch(function (err) { console.log(err) })
  }
}

var meetupcallback = (process.env.HEROKU) ? 'https://meetworking.herokuapp.com/auth/meetup/callback' : 'http://localhost:5000/auth/meetup/callback'
var linkedincallback = (process.env.HEROKU) ? 'https://meetworking.herokuapp.com/auth/linkedin/callback' : 'http://localhost:5000/auth/linkedin/callback'

passport.use(new MeetupStrategy({
  consumerKey: MEETUP_KEY,
  consumerSecret: MEETUP_SECRET,
  callbackURL: meetupcallback
},
  function (token, tokenSecret, profile, done) {
    knex.select().from('members').where('memberid', profile.id)
      .then(function (result) {
        if (result[0] === undefined) {
          // Sign up route
          console.log('----Signing up new user----')
          // User has not been searched or signed up
          // Add a user to the db
          var newUser = buildUser(profile, token, 1) // where 1 is the user type, tbd
          knex('members')
            .insert(newUser)
            .catch(function (err) { console.log(err) })
            .then(function () {
              // Add topics to db
              addTopics(profile)
              addSocialMediaLinks(profile)
              // Return user from our db...
              return done(null, newUser)
            })
        } else if (result[0].usertypeid < 3) {
          // Log in route
          // User has previously signed up
          // Return existing user
          console.log('----Logging in user----')
          knex('members')
            .where('memberid', result[0].memberid)
            .update('accesstoken', token)
            .catch(function (err) { console.log(err) })
            .done(function () {
              var newtokenresult = result[0]
              newtokenresult.accesstoken = token
              return done(null, newtokenresult)
            })
        } else {
          // Log in route for searched users
          // Modify previously searched user
          console.log('----Updating searched user----')
          knex('members')
            .update({
              alerts: 'ON',
              accesstoken: token,
              usertypeid: 1 // where 1 is the user type, tbd
            })
            .where('memberid', profile.id)
            .then(function () {
              knex.select().from('members').where('memberid', profile.id)
                .then(function (res) {
                  return done(null, result[0])
                }).catch(function (err) { console.log(err) })
            })
            .catch(function (err) { console.log(err) })
        }
      })
      .catch(function (err) { console.log(err) })
    // To keep the example simple, the user's Meetup profile is returned to
    // represent the logged-in user. In a typical application, you would want
    // to associate the Meetup account with a user record in your database,
    // and return that user instead.
    // console.log('profile===>', profile)
    // return done(null, profile)
  })
)

passport.use(new LinkedInStrategy({
  consumerKey: LINKEDIN_KEY,
  consumerSecret: LINKEDIN_SECRET,
  callbackURL: linkedincallback,
  profileFields: ['id', 'first-name', 'last-name', 'headline', 'positions', 'summary', 'picture-url', 'public-profile-url'],
  passReqToCallback: true
},
  function (req, token, tokenSecret, profile, done) {
    // TODO: Add LinkedIn profile to socialmedialinks db
    // ...
    // Paste LinkedIn data onto user for auto-fill of signup form
    // TODO: Remove pasted data on form submit
    var addLinkedIn = req.user
    addLinkedIn.linkedIn = profile
    return done(null, addLinkedIn)
  })
)

// ----------------------------------------------------------------------------
// 2. Routes
// ----------------------------------------------------------------------------
var routes = require('./routes/index')
var users = require('./routes/users')
var events = require('./routes/events')
var specs = require('./routes/specs')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))
app.use(flash())
// Custom flash middleware -- from Ethan Brown's book, 'Web Development with Node & Express'
// https://gist.github.com/brianmacarthur/a4e3e0093d368aa8e423
app.use(function (req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash
  delete req.session.sessionFlash
  next()
})
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(path.join(__dirname, 'public')))
app.use('/spec', express.static(path.join(__dirname, 'spec')))

app.use('/', routes)
app.use('/users', users)
app.use('/events', events)
app.use('/specs', specs)

// GET /auth/meetup
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Meetup authentication will involve redirecting
//   the user to meetup.com.  After authorization, Meetup will redirect the user
//   back to this application at /auth/meetup/callback
app.get('/auth/meetup',
  passport.authenticate('meetup'),
  function (req, res) {
    // The request will be redirected to Meetup for authentication, so this
    // function will not be called.
  })

app.get('/auth/linkedin',
  passport.authenticate('linkedin'))

// GET /auth/meetup/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/meetup/callback',
  passport.authenticate('meetup', { successRedirect: '/signup', failureRedirect: '/login' })
)

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { successRedirect: '/signup', failureRedirect: '/login' })
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
module.exports.buildUserObj = buildUserObj
module.exports.buildUser = buildUser
module.exports.addTopics = addTopics
module.exports.addSocialMediaLinks = addSocialMediaLinks
