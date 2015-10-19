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

// ----------------------------------------------------------------------------
// 1a. Passport authentication, strategies and sessions
// ----------------------------------------------------------------------------
var passport = require('passport')
var MeetupStrategy = require('passport-meetup').Strategy
var LinkedInStrategy = require('passport-linkedin').Strategy
var config = require('./config')
var MEETUP_KEY = config.MEETUP_KEY
var MEETUP_SECRET = config.MEETUP_SECRET
var LINKEDIN_KEY = config.LINKEDIN_KEY
var LINKEDIN_SECRET = config.LINKEDIN_SECRET

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Meetup profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
  console.log('user====>', user)
  done(null, user)
})

passport.deserializeUser(function (obj, done) {
  done(null, obj)
})

passport.use(new MeetupStrategy({
  consumerKey: MEETUP_KEY,
  consumerSecret: MEETUP_SECRET,
  callbackURL: 'http://127.0.0.1:3000/auth/meetup/callback'
  // callbackURL: '/'
},
  function (token, tokenSecret, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // To keep the example simple, the user's Meetup profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Meetup account with a user record in your database,
      // and return that user instead.
      return done(null, profile)
    })
  }
))

passport.use(new LinkedInStrategy({
  consumerKey: LINKEDIN_KEY,
  consumerSecret: LINKEDIN_SECRET,
  callbackURL: 'http://127.0.0.1:3000/auth/linkedin/callback',
  profileFields: ['id', 'first-name', 'last-name', 'headline', 'positions', 'summary', 'picture-url']
},
  function (token, tokenSecret, profile, done) {
    // TODO: Why does the following break the meetup auth route?
    // process.nextTick(function () {
    //   return done(null, profile)
    // })
    // User.findOrCreate({ linkedinId: profile.id }, function (err, user) {
    //   return done(err, user);
    // })
  }
))

// ----------------------------------------------------------------------------
// 2. Routes
// ----------------------------------------------------------------------------
var routes = require('./routes/index')
var users = require('./routes/users')

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
app.use(express.static(path.join(__dirname, 'public')))
app.use('/spec', express.static(path.join(__dirname, 'spec')))

app.use('/', routes)
app.use('/users', users)

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
