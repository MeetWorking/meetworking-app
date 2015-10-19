var express = require('express')
var router = express.Router()

/* GET landing page. */
router.get('/', function (req, res, next) {
  if (req.user) { // Determine if user is currently logged in
    res.render('dashboard', { title: 'Dashboard', user: req.user })
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
  res.render('signup', { title: 'Sign Up' })
})

/* POST signup form. */
router.post('/signup', function (req, res, next) {
  res.redirect('/')
})

module.exports = router
