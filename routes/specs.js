var express = require('express')
var router = express.Router()

router.get('/spec', function (req, res, next) {
  res.render('spec', { title: 'Spec Runner' })
})

module.exports = router
