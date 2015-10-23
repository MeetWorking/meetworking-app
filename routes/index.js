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
  // Get member from members table
  knex.select().from('members').where('memberid', req.user.id)
    .then(function (result) {
      // test if they have filled in company (if they have seen the signup form before)
      if (result.company === undefined || result.company === null) {
        // test if LinkedIn account has been linked
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

function saveProfile (memberid, form) {
  knex('members')
    .where('memberid', memberid)
    .update({
      name: form.name,
      company: form.company,
      position: form.position,
      careergoals: form.careergoals
    })
    .catch(function (err) { console.error(err) })
}

function addLinkedIn (user) {
  if (user.linkedIn) {
    knex('socialmedialinks')
      .select()
      .where({memberid: user.memberid, socialmediauid: 3})
      .then(function (result) {
        if (result.length === 1) {
          knex('socialmedialinks')
            .update({
              memberid: user.memberid,
              socialmediauid: 3,
              mediaprofileurl: user.linkedIn._json.publicProfileUrl
            })
            .where({memberid: user.memberid, socialmediauid: 3})
        } else {
          knex('socialmedialinks')
            .insert({
              memberid: user.memberid,
              socialmediauid: 3,
              mediaprofileurl: user.linkedIn._json.publicProfileUrl
            })
        }
      })
      .then(function () {
        delete user.linkedIn
        return user
      })
  }
}

function addCompany (memberid, searchcompany) {
  knex('searches')
    .insert({ memberid, searchcompany })
    .catch(function (err) { console.error(err) })
}

function getGroupBios (memberid, accesstoken, groupBios) {
  console.log('getGroupBios is called-------')
  var url = 'https://api.meetup.com/2/profiles?&sign=true&format=json&photo-host=public&member_id=' + memberid + '&page=100&access_token=' + accesstoken
  request(url,
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        result.results.forEach(function (e, i) {
          if (e.bio) {
            groupBios.push(e.bio)
          }
        })
      }
      if (result.meta.next !== '') {
        getGroupBios(memberid, result.meta.next)
        console.log('requesting next group bio...')
      } else {
        addGroupBios(memberid, groupBios.join('||'))
      }
    })
}

function addGroupBios (memberid, meetupgroupbios) {
  knex('members')
    .where('memberid', memberid)
    .update({ meetupgroupbios })
    .catch(function (err) { console.error(err) })
    .then(function () {
      console.log('finished adding group bios to members table-------')
    })
}

/* POST signup form. */
router.post('/signup', function (req, res, next) {
  // variables for whole scope
  var memberid = req.user.memberid
  var accesstoken = req.user.accesstoken

  // Update members table with profile data
  // NOTE: The company parameter is used to test if a user has signed up or not.
  //       Even if empty string, it will allow a user to sign in directly to
  //       their dashboard.
  saveProfile(memberid, req.body)

  // Update socialmedialinks table if the user has authenticated with LinkedIn
  // Returns new req.user with linkedIn property deleted
  req.user = addLinkedIn(req.user)

  // Update searches table with three companies
  var form = req.body
  var companies = [form.searchcompany1, form.searchcompany2, form.searchcompany3]
  companies.forEach(function (e, i) {
    if (e.length > 2) {
      addCompany(memberid, e)
    }
  })

  // Get all group bios for a member
  getGroupBios(memberid, accesstoken, [])
  var rsvpUrl = '' // TODO: build url
  var memberEventsUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&member_id=' + memberid + '&access_token=' + accesstoken
  var conciergeEventsUrl = 'https://api.meetup.com/2/concierge?&sign=true&photo-host=public&format=json&time=,2w&page=100&access_token=' + accesstoken
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
    .then(getVenues(companies))
    // .catch(function (err) { console.error(err) })
    // .then(getEvents(conciergeEventsUrl, false))
    // .catch(function (err) { console.error(err) })
    // .then(getCompanyEvents(companies))
    // .catch(function (err) { console.error(err) })
    // .then(getRSVPs(rsvpUrl, true))
    // .catch(function (err) { console.error(err) })
  // TODO: Drop table

  function getVenues (companies) {
    var zipCode = '97209'
    var urls
    var searchcompanies = companies.filter(function (val) {
      return val.length > 2
    })
    if (searchcompanies.length > 0) {
      var venueIds = []
      searchcompanies = searchcompanies.join('%2C+')
      searchcompanies.replace(/\s+/g, '+')
      var openVenueUrl = 'https://api.meetup.com/2/open_venues?&sign=true&photo-host=public&time=,2w&format=json&text=' + searchcompanies + '&zip=' + zipCode + '&page=100&access_token=' + accesstoken
      request(openVenueUrl, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var result = JSON.parse(body)
          result.results.forEach(function (e, i) {
            venueIds.push(e.id)
          })
        }
        var apiVenueIds = venueIds.join('%2C+')
        var venueEventUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&venue_id=' + apiVenueIds + '&access_token=' + accesstoken
        urls = [memberEventsUrl, conciergeEventsUrl, venueEventUrl]
        getEvents(urls)
      })
    } else {
      urls = [memberEventsUrl, conciergeEventsUrl]
      getEvents(urls)
    }
  }
  function getEvents (urls) {
    urls.forEach(function (element, index) {
      console.log('getEvents has been called for ------- ', element)
      request(element, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var result = JSON.parse(body)
          var length = result.results.length
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
                  if (index === urls.length - 1 && i === length - 1) {
                    getRSVPs()
                  }
                } else {
                  knex('tempevents')
                    .insert({ eventid, groupid, groupname, title, description, location, datetime, status, rsvps, spotsleft })
                    .catch(function (err) { console.error(err) })
                    .then(function () {
                      if (index === 2 && i === length - 1) {
                        getRSVPs()
                      }
                    })
                }
              })
          })
        }
      })
    })
  }
  function getCompanyEvents (companies) {
    var zipCode = '97209'
    var searchcompanies = companies.filter(function (val) {
      return val.length > 2
    })
    if (searchcompanies.length !== 0) {
      searchcompanies = searchcompanies.join('%2C+')
      searchcompanies.replace(/\s+/g, '+')
      var openVenueUrl = 'https://api.meetup.com/2/open_venues?&sign=true&photo-host=public&time=,2w&format=json&text=' + searchcompanies + '&zip=' + zipCode + '&page=100&access_token=' + accesstoken
      var venueIds = []
      console.log('getCompanyEvents has been called for-------', openVenueUrl)
      request(openVenueUrl, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var result = JSON.parse(body)
          result.results.forEach(function (e, i) {
            venueIds.push(e.id)
          })
        }
        var apiVenueIds = venueIds.join('%2C+')
        var venueEventUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&venue_id=' + apiVenueIds + '&access_token=' + accesstoken
        getEvents(venueEventUrl, true)
        console.log('getCompanyEvents has finished-------')
      }
    )
    }
  }
    // Insert group bios into members table
  function getRSVPs (url) {
    setTimeout(function () {
      console.log('getRSVPs has been called-------')
      knex
        .table('tempevents')
        .pluck('eventid')
        .then(function (eids) {
          console.log('====event ids plucked====', eids)
          var eventids = eids.join('%2C')
          var url = 'https://api.meetup.com/2/rsvps?&sign=true&photo-host=public&type=json&event_id=' + eventids + '&page=100&access_token=' + accesstoken
          request(url, function (error, response, body) {
            console.log('error: ', error)
            var rsvps = []
            if (!error && response.statusCode === 200) {
              var result = JSON.parse(body)
              console.log('===RSVP API RESULT===', result)
              result.results.forEach(function (e, i) {
                var obj = {
                  memberid: e.member.member_id,
                  eventid: e.event.id
                }
                rsvps.push(obj)
              })
              knex.schema
                .createTable('temprsvps', function (table) {
                  table.string('eventid')
                  table.string('memberid')
                  // TODO: Add more columns if necessary
                })
                .catch(function (err) { console.error(err) })
                .then(function () {
                  knex('temprsvps')
                    .insert(rsvps)
                    .catch(function (err) { console.error(err) })
                    .then(function () {
                      // run getBios
                      // run getGroupBios
                    })
                })
            }
          })
        })
    }, 1000)
  }
  res.redirect('/')
})

module.exports = router

// Testing exports methods
module.exports.saveProfile = saveProfile
module.exports.addLinkedIn = addLinkedIn
module.exports.addCompany = addCompany
module.exports.getGroupBios = getGroupBios
module.exports.addGroupBios = addGroupBios
