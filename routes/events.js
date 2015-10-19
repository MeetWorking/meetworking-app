var express = require('express')
var router = express.Router()

/* GET event details page that lists attendees and their profile information. */
router.get('/:id', function (req, res, next) {
  var id = req.params.id
  res.render('event', { title: 'Event Attendees', id: id })
})

module.exports = router
