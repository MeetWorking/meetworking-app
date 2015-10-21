var express = require('express')
var router = express.Router()

// ----------------------------------------------------------------------------
// 1b. Knex setup
// ----------------------------------------------------------------------------
var config = require('../config')
var knex = require('knex')(config.AWS)
// knex.select().table('searchresults')
//   .then(function (reply) {
//     console.log(reply)
//   })

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) { return next() }
  res.redirect('/login')
}

/* GET landing page. */
router.get('/', function (req, res, next) {
  if (req.user) { // Determine if user is currently logged in
    knex.select().from('members').where('memberid', req.user.id)
      .then(function (result) {
        // Retrieve member from table (maybe not needed)
        // console.log('req.user.id==>', req.user.id)
        // console.log('result==>', result)
      })
    knex.select().from('searchresults').where('searchmemberid', req.user.id)
      .then(function (result) {
        // Retrieve search results and display in order
        // console.log('req.user.id==>', req.user.id)
        // console.log('result==>', result)
      })
    console.log('req.user in index===>', req.user[0])
    res.render('dashboard', { title: 'Dashboard', user: req.user[0] })
  } else {
    res.render('index', { title: 'MeetWorking' })
  }
})

/* Submit user authentication for login. */
router.post('/', function (req, res, next) {
  if ('user') { // Determine if user is currently logged in
    res.render('dashboard', { title: 'Dashboard', user: req.user })
  } else {
    res.render('index', { title: 'MeetWorking', errorMessage: 'You are not logged in' })
  }
})

/* GET signup page. */
router.get('/signup', function (req, res, next) {
  knex.select().from('members').where('memberid', req.user.id)
    .then(function (result) {
      console.log('Here is your /signup result:  ', result)
      if (result.company === undefined || result.company === null) {
        if (req.user[0].linkedIn) {
          console.log('req.user[0].linkedIn---->', req.user[0].linkedIn)
          res.render('signup', {title: 'Meetworking', user: req.user[0], linkedIn: req.user[0].linkedIn._json})
        } else {
          res.render('signup', {title: 'Meetworking', user: req.user[0]})
        }
      } else {
        res.redirect('/')
      }
    })
})

/* Add new user. */
// router.get('/adduser', function (req, res, next) {
//   knex.select().from('members').where('memberid', req.user.id)
//     .then(function (result) {
//       if (result[0].usertypeid < 3) {
//         // User has previously signed up
//         res.redirect('/')
//       } else {
//         // User has previously been searched and/or has not signed up
//         res.render('signup', { title: 'Sign Up' })
//       }
//     })
// })

/* POST signup form. */
router.post('/signup', function (req, res, next) {
  res.redirect('/')
})

module.exports = router
