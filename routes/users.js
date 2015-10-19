var express = require('express')
var router = express.Router()

/* GET dashboard page. */
router.get('/dashboard', function (req, res, next) {
  if (req.user) { // Determine if user is currently logged in
    res.render('dashboard', { title: 'Dashboard', user: req.user })
  } else {
    res.render('index', { title: 'MeetWorking' })
  }
})

/* GET search results page. */
router.get('/results', function (req, res, next) {
  res.render('results', { title: '' })
})

/* POST new company to follow. */
router.post('/results', function (req, res, next) {
  // Follow a company
  res.send(200)
})

/* GET settings page. */
router.get('/settings', function (req, res, next) {
  res.render('settings')
})

/* PUT updated settings. */
router.put('/settings', function (req, res, next) {
  res.redirect('/users/dashboard')
})

/* Log the user out. */
router.get('/logout', function (req, res, next) {
  // Remove user's cookie
  req.logout()
  res.redirect('/')
})

/* Change an event's RSVP status. */
router.put('/rsvp', function (req, res, next) {
  // Change RSVP status as requested
  res.send(200)
})

module.exports = router
