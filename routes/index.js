var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
})

router.get('/spec', function (req, res, next) {
  res.render('spec', { title: 'SpecRunner' })
})

module.exports = router
