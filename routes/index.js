var express = require('express')
var router = express.Router()
var request = require('request')

// ----------------------------------------------------------------------------
// 1b. Knex setup
// ----------------------------------------------------------------------------
var config = require('../config')
var knex = require('knex')(config.AWS)

/* GET landing page. */
router.get('/', function (req, res, next) {
  if (req.user) { // Determine if user is currently logged in
    console.log('req.user in index===>', req.user)
    res.render('dashboard', { title: 'Dashboard', user: req.user })
  } else {
    res.render('index', { title: 'MeetWorking' })
  }
})

// /* Submit user authentication for login. */
// router.post('/', function (req, res, next) {
//   if ('user') { // Determine if user is currently logged in
//     res.render('dashboard', { title: 'Dashboard', user: req.user })
//   } else {
//     res.render('index', { title: 'MeetWorking', errorMessage: 'You are not logged in' })
//   }
// })

/* GET signup page. */
router.get('/signup', function (req, res, next) {
  knex.select().from('members').where('memberid', req.user.id)
    .then(function (result) {
      console.log('Here is your /signup result:  ', result)
      if (result.company === undefined || result.company === null) {
        console.log('req.user in /signup ==>', req.user)
        if (req.user.linkedIn) {
          res.render('signup', {title: 'Meetworking', user: req.user, linkedIn: req.user.linkedIn._json})
        } else {
          res.render('signup', {title: 'Meetworking', user: req.user})
        }
      } else {
        res.redirect('/')
      }
    })
})

function addCompany (memberid, searchcompany) {
  knex('searches')
    .insert({ memberid, searchcompany })
    .catch(function (err) { console.error(err) })
}

/* POST signup form. */
router.post('/signup', function (req, res, next) {
  var form = req.body
  // Update members table with profile data
  // NOTE: The company parameter is used to test if a user has signed up or not.
  //       Even if empty string, it will allow a user to sign in directly to
  //       their dashboard.
  knex('members')
    .where('memberid', req.user.memberid)
    .update({
      name: form.name,
      company: form.company,
      position: form.position,
      careergoals: form.careergoals
    })
    .catch(function (err) { console.error(err) })
  // Update socialmedialinks table if the user has authenticated with LinkedIn
  if (req.user.linkedIn) {
    knex('socialmedialinks')
      .select()
      .where({memberid: req.user.memberid, socialmediauid: 3})
      .then(function (result) {
        if (result.length === 1) {
          knex('socialmedialinks')
            .update({
              memberid: req.user.memberid,
              socialmediauid: 3,
              mediaprofileurl: req.user.linkedIn._json.publicProfileUrl
            })
            .where({memberid: req.user.memberid, socialmediauid: 3})
        } else {
          knex('socialmedialinks')
            .insert({
              memberid: req.user.memberid,
              socialmediauid: 3,
              mediaprofileurl: req.user.linkedIn._json.publicProfileUrl
            })
        }
      })
      .done(function () {
        delete req.user.linkedIn
      })
  }
  // Update searches table with three companies
  var companies = [form.searchcompany1, form.searchcompany2, form.searchcompany3]
  companies.forEach(function (e, i) {
    addCompany(req.user.memberid, e)
  })
  // Get all group bios for a member
  var accesstoken = req.user.accesstoken
  var groupBios = []
  function getGroupBios (url) {
    request(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        // console.log('results===> ', result.results) // Show the HTML for the Google homepage.
        // console.log('meta===> ', result.meta) // Show the HTML for the Google homepage.
        result.results.forEach(function (e, i) {
          if (e.bio) {
            groupBios.push(e.bio)
          }
        })
      }
      console.log('requesting...')
      if (result.meta.next !== '') {
        getGroupBios(result.meta.next)
        console.log('requesting next...')
      } else {
        var meetupgroupbios = groupBios.join('||')
        knex('members')
          .where('memberid', req.user.memberid)
          .update({ meetupgroupbios })
          .catch(function (err) { console.error(err) })
        res.redirect('/')
      }
    }
    )
  }
  var groupBioUrl = 'https://api.meetup.com/2/profiles?&sign=true&format=json&photo-host=public&member_id=' + req.user.memberid + '&page=100&access_token=' + accesstoken
  getGroupBios(groupBioUrl)

  knex.schema
    .createTable('tempevents', function (table) {
      table.string('eventid')
      table.string('groupid')
      table.string('groupname', 45)
      table.string('title', 45)
      table.text('description')
      table.text('location')
      table.dateTime('datetime')
      table.string('status', 45)
      table.integer('rsvps')
      table.integer('spotsleft')
    })
    .catch(function (err) { console.error(err) })
    .then(function () {
      console.log('member events adding to db')
      var memberEventsUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&member_id=' + req.user.memberid + '&access_token=' + req.user.accesstoken
      getEvents(memberEventsUrl, true)
    })
    .catch(function (err) { console.error(err) })
    .then(function () {
      console.log('concierge events adding to db')
      var conciergeEventsUrl = 'https://api.meetup.com/2/concierge?&sign=true&photo-host=public&format=json&time=,2w&page=100&access_token=' + req.user.accesstoken
      getEvents(conciergeEventsUrl, false)
    })
  // TODO: Drop table
  function getEvents (url, next) {
    request(url, function (error, response, body) {
      console.log('requesting...')
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        // console.log('results===> ', result.results) // Show the HTML for the Google homepage.
        // console.log('meta===> ', result.meta) // Show the HTML for the Google homepage.
        result.results.forEach(function (e, i) {
          console.log('--------', i)
          var eventid = e.id
          var groupid = e.group.id
          var groupname = e.group.name
          var title = e.name
          var description = e.description
          var location
          if (e.venue) {
            location = e.venue.name
          } else {
            location = null
          }
          var datetime = e.time
          var status = e.status
          var rsvps = e.yes_rsvp_count
          var spotsleft = e.rsvp_limit - e.yes_rsvp_count || null
          knex('tempevents')
            .select()
            .where({ eventid })
            .then(function (result) {
              if (result.length > 0) {
                console.log('event exists in the temp table')
              } else {
                knex('tempevents')
                  .insert({ eventid, groupid, groupname, title, description, location, datetime, status, rsvps, spotsleft })
                  .catch(function (err) { console.error(err) })
              }
            })
        })
      }
      if (next) {
        if (result.meta.next !== '') {
          getEvents(result.meta.next, true)
          console.log('requesting next...')
        }
      }
    })
  }
  function getCompanyEvents (url) {
    var venueIds = []
    request(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        // console.log('results===> ', result.results) // Show the HTML for the Google homepage.
        // console.log('meta===> ', result.meta) // Show the HTML for the Google homepage.
        result.results.forEach(function (e, i) {
          venueIds.push(e.id)
        })
      }
      console.log('requesting...')
      if (result.meta.next !== '') {
        getCompanyEvents(result.meta.next)
        console.log('requesting next...')
      } else {
        var apiVenueIds = venueIds.join('%2C+')
        var venueEventUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&venue_id=' + apiVenueIds + '&access_token=' + req.user.accesstoken
        getEvents(venueEventUrl, true)
        // knex('members')
        //   .where('memberid', req.user.memberid)
        //   .update({ meetupgroupbios })
        //   .catch(function (err) { console.error(err) })
      }
    }
  )
  }
    // Insert group bios into members table
  var zipCode = '97209'
  var searchcompanies = companies.join('%2C+')
  searchcompanies.replace(/\s+/g, '+')
  var openVenueUrl = 'https://api.meetup.com/2/open_venues?&sign=true&photo-host=public&format=json&text=' + searchcompanies + '&zip=' + zipCode + '&page=100&access_token=' + req.user.accesstoken
  getCompanyEvents(openVenueUrl)
})

module.exports = router
