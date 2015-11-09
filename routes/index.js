var express = require('express')
var router = express.Router()
var request = require('request')
var _ = require('lodash')

// ----------------------------------------------------------------------------
// 1. Knex setup
// ----------------------------------------------------------------------------
var config = require('../config')
var knex = require('knex')(config.AWS)

// ----------------------------------------------------------------------------
// 2. Express routes
// ----------------------------------------------------------------------------

/* GET landing page. */
router.get('/', function (req, res, next) {
  if (req.user) { // Determine if user is currently logged in
    res.render('dashboard', { title: 'Dashboard', user: req.user })
  } else {
    res.render('index', { title: 'MeetWorking' })
  }
})

/* GET signup page. */
router.get('/signup', function (req, res, next) {
  // Get member from members table
  var currentuser = req.user.memberid || req.user.id

  knex.select().from('members').where('memberid', currentuser)
    .then(function (result) {
      // test if they have filled in company (if they have seen the signup form before)
      if (result[0].company === undefined || result[0].company === null) {
        // test if LinkedIn account has been linked
        if (req.user.linkedIn) {
          console.log('-----LinkedIn found-----')
          res.render('signup', {title: 'Meetworking', user: result[0], linkedIn: req.user.linkedIn._json})
        } else {
          console.log('-----No LinkedIn Yet, but result.company not found-----')
          res.render('signup', {title: 'Meetworking', user: result[0]})
        }
      } else {
        console.log('-----Welcome back!-----')
        console.log(req.user)
        knex('searches')
          .pluck('searchcompany')
          .where('memberid', req.user.memberid)
          .then(function (companies) {
            startSearch(companies, req.user.memberid, req.user.accesstoken)
            res.user = req.user
            res.redirect('/')
          })
        knex('members')
          .where('memberid', currentuser)
          .update('acccesstoken', req.user.accesstoken)
      }
    })
}) // End GET signup page

/* POST signup form. */
router.post('/signup', function (req, res, next) {
  // variables for whole scope
  var memberid = req.user.memberid
  var accesstoken = req.user.accesstoken
  var form = req.body
  var companies = [form.searchcompany1, form.searchcompany2, form.searchcompany3]

  // Update members table with profile data
  // NOTE: The company parameter is used to test if a user has signed up or not.
  //       Even if empty string, it will allow a user to sign in directly to
  //       their dashboard.
  saveProfile(memberid, req.body)

  // Update socialmedialinks table if the user has authenticated with LinkedIn
  // Returns new req.user with linkedIn property deleted
  req.user = addLinkedIn(req.user)

  // Update searches table with three companies
  companies.forEach(function (e, i) {
    if (e.length > 2) {
      addCompany(memberid, e)
    }
  })

  // Get all group bios for a member
  getGroupBios(memberid, accesstoken, [])

  // Begin company search
  startSearch(companies, memberid, accesstoken)

  // Send to dashboard
  res.redirect('/')
})

/* GET searchresults data for the dashboard. */
router.get('/searchresults', function (req, res, next) {
  console.log('===========/searchresults===========')
  var memberid = req.user.memberid
  // Jeff Spreadsheet functions:
  knex('searchresults')
    .distinct('events.eventid', 'events.groupid', 'events.groupname', 'events.title', 'events.description', 'events.location', 'events.datetime', 'events.status', 'events.rsvps', 'events.spotsleft', 'events.meetworkers', 'events.recruiters', 'searchresults.status as displaystatus')
    .select()
    .innerJoin('events', 'searchresults.eventid', 'events.eventid')
    .innerJoin('searches', 'searchresults.searchuid', 'searches.uid')
    .where({
      'searchresults.searchmemberid': memberid,
      'searches.memberid': memberid
    })
    .then(function (result1) {
      knex('searchresults')
        .distinct('searchresults.uid', 'searchresults.eventid', 'searchresults.searchuid', 'searchresults.searchmemberid', 'searchresults.rsvpstatus', 'searchresults.companymatch', 'searchresults.employeematch', 'searches.searchcompany', 'searches.logourl')
        .select()
        .innerJoin('searches', 'searchresults.searchuid', 'searches.uid')
        .where({
          'searchresults.searchmemberid': memberid,
          'searches.memberid': memberid
        })
        .then(function (result2) {
          result1.forEach(function (e, i) {
            // Get relevant eventids from result2
            var newResult2 = result2.filter(function (element, index, array) {
              return ('eventid' in element && element['eventid'] === e.eventid)
            })
            newResult2 = newResult2.map(function (element, index, array) {
              var object = {}
              for (var key in element) {
                if (key !== 'searchresults.uid' && key !== 'searchresults.eventid') {
                  object[key] = element[key]
                }
              }
              return object
            })
            result1[i].searchuids = newResult2
          })
          res.send(result1)
        })
    })
  // Use SQL queries via the knex module to find all data relevant to events tied to the user's memberid and saved search companies
})

// ----------------------------------------------------------------------------
// 3. New user signup functions
// ----------------------------------------------------------------------------

/**
 * Save name, company, position and career goals
 * info to members table.
 * @param  {integer} memberid - User's meetup memberid
 * @param  {array} form - Form data from signup
 */
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
} // End saveProfile

/**
 * Save LinkedIn data to socialmedialinks table
 * @param {object} user - The user object attached to the response
 * @returns {object} The same user object with the LinkedIn part removed
 */
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
} // End addLinkedIn

/**
 * Insert search companies into searches table
 * @param {integer} memberid - User's Meetup memberid
 * @param {string} searchcompany - Company the user has elected to search
 */
function addCompany (memberid, searchcompany) {
  knex('searches')
    .insert({ memberid, searchcompany })
    .catch(function (err) { console.error(err) })
} // End addCompany

/**
 * Send an API request to Meetup to gather all user's group bios
 * and insert into members table.
 * @param  {integer} memberid - User's Meetup memberid
 * @param  {string} accesstoken - User's OAuth token for API requests
 * @param  {array} groupBios - Accumulating array of all group bios (for recursion)
 * @param  {string} url - URL to query the API (use for next page queries)
 */
function getGroupBios (memberid, accesstoken, groupBios, url) {
  var resulturl = url || 'https://api.meetup.com/2/profiles?&sign=true&format=json&photo-host=public&member_id=' + memberid + '&page=100&access_token=' + accesstoken
  request(resulturl,
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        result.results.forEach(function (e, i) {
          if (e.bio) {
            groupBios.push(e.bio)
          }
        })
      } else {
        console.log('Error caught in getGroupBios API call: ', error)
        console.log('Error response code                  : ', response.statusCode)
      }
      if (result.meta.next !== '') {
        getGroupBios(memberid, accesstoken, groupBios, result.meta.next)
        console.log('requesting next group bio...')
      } else {
        addGroupBios(memberid, groupBios.join('||'))
      }
    })
} // End getGroupBios

/**
 * Update meetupgroupbios column in members table with member's group bios.
 * Called after getGroupBios.
 * @param  {integer} memberid - User's Meetup memberid
 * @param  {string} meetupgroupbios - String of member's bios, joined with "||"
 */
function addGroupBios (memberid, meetupgroupbios) {
  knex('members')
    .where('memberid', memberid)
    .update({ meetupgroupbios })
    .catch(function (err) {
      console.error(err)
    })
    .then(function () {
      console.log('finished adding group bios to members table-------')
    })
} // End addGroupBios

// ----------------------------------------------------------------------------
// 4. Company search functions
// ----------------------------------------------------------------------------

function startSearch (companies, memberid, accesstoken) {
  console.log('startSearch')
  // Using raw due to knex's lack of builtin FULLTEXT index support for MySQL
  knex.raw('create table tempevents' + memberid + ' (`eventid` varchar(255), `groupid` varchar(255), `groupname` varchar(45), `title` varchar(180), `description` text, `location` text, `datetime` bigint, `status` varchar(45), `rsvps` int, `spotsleft` int, FULLTEXT KEY location (location))')
    .then(getVenues(companies, memberid, accesstoken))
    .catch(function (err) { console.error(err) })
} // End startSearch

/**
 * Query Meetup API to obtain venue ids for search companies.
 * Called by startSearch.
 * @param  {array} companies - Array of strings of the user's searched companies
 */
function getVenues (companies, memberid, accesstoken) {
  console.log('getVenues')
  var zipCode = '97209' // TODO: Allow variable zip
  var memberEventsUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&member_id=' + memberid + '&access_token=' + accesstoken
  var conciergeEventsUrl = 'https://api.meetup.com/2/concierge?&sign=true&photo-host=public&format=json&time=,2w&page=100&access_token=' + accesstoken
  var urls
  // Check if company name length is long enough
  // (to prevent enormous searches for, eg, 'b')
  var searchcompanies = companies.filter(function (val) {
    return val.length > 2
  })
  if (searchcompanies.length > 0) {
  // Build a URL for meetup openvenues API to find venueids
    var venueIds = []
    searchcompanies = searchcompanies.join('%2C+')
    searchcompanies.replace(/\s+/g, '+')
    var openVenueUrl = 'https://api.meetup.com/2/open_venues?&sign=true&photo-host=public&time=,2w&format=json&text=' + searchcompanies + '&zip=' + zipCode + '&page=100&access_token=' + accesstoken
  // Request data and push into venueIds array
    request(openVenueUrl, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        result.results.forEach(function (e, i) {
          venueIds.push(e.id)
        })
      }
  // Build URL with venueids to find events at those venues
      var apiVenueIds = venueIds.join('%2C+')
      var venueEventUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&venue_id=' + apiVenueIds + '&access_token=' + accesstoken
      urls = [memberEventsUrl, conciergeEventsUrl, venueEventUrl]
      getEvents(urls, [], memberid, accesstoken)
    })
  // If no companies were entered in the query, just get events for the member and their concierge
  } else {
    urls = [memberEventsUrl, conciergeEventsUrl]
    getEvents(urls, [], memberid, accesstoken)
  }
} // End getVenues

/**
 * Get events for member, concierge and potentially venue events.
 * Called by getVenues.
 * @param  {array} urls - Array of URLs to obtain events via Meetup APIs
 */
function getEvents (urls, tempevents, memberid, accesstoken) {
  console.log('getEvents')
  var urllength = urls.length
  urls.forEach(function (element) {
    request(element, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
  // Build an object from each result
        var i = result.results.length
        result.results.forEach(function (e) {
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
          tempevents.push({ eventid, groupid, groupname, title, description, location, datetime, status, rsvps, spotsleft })
          i--
          if (i === 0) {
            urllength--
            if (urllength === 0) {
              console.log('===+++&&&+++===')
  // Once all loops are finished, add tempevents
              var finaltempevents = _.uniq(tempevents, 'eventid')
              knex('tempevents' + memberid)
                .insert(finaltempevents)
                .catch(function (err) { console.error(err) })
                .then(function () {
                  knex
                    .table('tempevents' + memberid)
                    .pluck('eventid')
                    .distinct('eventid')
                    .then(function (eids) {
  // Build URL from eventids
                      var eventids = eids.join('%2C')
                      var rsvpurl = 'https://api.meetup.com/2/rsvps?&sign=true&photo-host=public&type=json&event_id=' + eventids + '&page=100&access_token=' + accesstoken
                      getRSVPs(rsvpurl, [], memberid)
                    })
                })
            }
          }
        })
      }
    })
  })
}

/**
 * Find all memberids RSVPing to all events in tempevents.
 * URL parameter is optional, to specify getting next page of
 * results. Rsvps should initially be an empty array, which
 * will get passed back in if there is a next page.
 * @param  {string} rsvpurl - Url to query
 * @param  {array} rsvps - RSVPs already gathered, to group and add to the database
 */
function getRSVPs (rsvpurl, rsvps, memberid) {
  console.log('getRSVPs')
  // Wait every second to avoid API throttling
  setTimeout(function () {
    console.log('getRSVPs has been called-------')
  // Get eventids from tempevents table
  // Request Meetup RSVPs API for memberids
    request(rsvpurl, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)
        result.results.forEach(function (e, i) {
  // Build object with memberid and eventid
          var rsvpsobj = {
            memberid: e.member.member_id,
            eventid: e.event.id
          }
          rsvps.push(rsvpsobj)
        })
  // If there are more results, get the next page
        if (result.meta.next !== '') {
          getRSVPs(result.meta.next, rsvps, memberid)
        } else {
  // Build temprsvps table
          knex.schema
            .createTable('temprsvps' + memberid, function (table) {
              table.string('eventid')
              table.integer('memberid')
            })
            .catch(function (err) { console.error(err) })
            .then(function () {
  // Insert all RSVPs into temprsvps table
              knex('temprsvps' + memberid)
                .insert(rsvps)
                .catch(function (err) { console.error(err) })
                .then(function () {
                  searchCompanies(memberid)
                })
            })
        }
      }
    })
  }, 1000)
}

/**
 * Search db data for matches of current user's company
 * @param  {integer} memberid - User's Meetup memberid
 */
function searchCompanies (memberid) {
  console.log('searchCompanies')
  // Retrieve member's search companies from searches table
  knex('searches')
    .select()
    .where('memberid', memberid)
    .then(function (result) {
  // Create tempcompanymatches and temprsvpmatches tables
      knex.schema
        .createTable('tempcompanymatches' + memberid, function (table) {
          table.integer('memberid')
          table.integer('searchuid')
          table.string('eventid')
        })
        .catch(function (err) { console.error(err) })
      knex.schema
        .createTable('temprsvpmatches' + memberid, function (table) {
          table.integer('memberid')
          table.integer('searchuid')
          table.string('eventid')
        })
        .catch(function (err) { console.error(err) })
        .then(function () {
  // Using the three companies result, search the members and events tables for matching text
          var rsvpmatches = []
          var companymatches = []
          var membersearch = result
          var i = result.length
          result.forEach(function (e) {
            knex
              .pluck('eventid')
              .from('tempevents' + memberid)
              .orWhereRaw('MATCH(location) AGAINST(? IN BOOLEAN MODE)', e.searchcompany)
              .then(function (eventids) {
  // Build a tempcompanymatch object for each matching result
                var ind = eventids.length
                eventids.forEach(function (elem) {
                  var tempcompanymatch = {
                    eventid: elem,
                    searchuid: e.uid
                  }
                  companymatches.push(tempcompanymatch)
                  ind--
                })
                i--
                if (ind === 0 && i === 0) {
  // Call function when all results added
                  addTempCompanyMatches(memberid, companymatches)
                }
              })
          })
  // Search through member bios with same three companies
          var index = membersearch.length
          membersearch.forEach(function (element) {
            knex
              .pluck('memberid')
              .from('members')
              .orWhereRaw('MATCH(company, meetupbio, meetupgroupbios) AGAINST(? IN BOOLEAN MODE)', element.searchcompany)
              .then(function (memberids) {
  // Remove current user from member matches
                var differencememberids = _.difference(memberids, [memberid])
                var n = differencememberids.length
                differencememberids.forEach(function (l) {
                  var temprsvpmatch = {
                    memberid: l,
                    searchuid: element.uid
                  }
                  rsvpmatches.push(temprsvpmatch)
                  n--
                })
                index--
                if (index === 0 && n === 0) {
                  addTempRsvpMatches(rsvpmatches, memberid)
                }
              })
          })
        })
    })
} // End searchCompanies

/**
 * Insert temporary company matches into temp table.
 * Called by searchCompanies
 * @param {array} tempcompanymatches - Array of matched data from tempevents table
 */
function addTempCompanyMatches (memberid, tempcompanymatches) {
  console.log('addTempCompanyMatches')
  knex('tempcompanymatches' + memberid)
    .insert(tempcompanymatches)
    .catch(function (err) { console.error(err) })
} // End addTempCompanyMatches

/**
 * Insert temporary rsvp matches into temp table.
 * Called by searchCompanies
 * @param {array} rsvpmatches - Array of matched data from tempevents table
 * @param  {integer} memberid - User's Meetup memberid
 */
function addTempRsvpMatches (rsvpmatches, memberid) {
  console.log('addTempRsvpMatches')
  var temprsvpmatches = []
  var i = rsvpmatches.length
  rsvpmatches.forEach(function (e) {
  // Find each matched member in the temprsvps table
    knex('temprsvps' + memberid)
      .where('memberid', e.memberid)
      .distinct('eventid', 'memberid') // Added due to data repetition in temprsvps. shouldn't be necessary
      .then(function (memberrsvps) {
        var z = memberrsvps.length
        if (memberrsvps.length) {
          memberrsvps.forEach(function (y) {
  // Add eventid property based on temprsvps table
            temprsvpmatches.push({
              searchuid: e.searchuid,
              memberid: e.memberid,
              eventid: y.eventid
            })
            z--
          })
        }
        i--
        if (i === 0 && z === 0) {
  // If last, insert into temprsvpmatches table
          knex('temprsvpmatches' + memberid)
            .insert(temprsvpmatches)
            .catch(function (err) { console.error(err) })
            .then(function () {
              unionTempMatches(memberid)
            })
        }
      })
      .catch(function (err) { console.error(err) })
  })
} // End addTempRsvpMatches

/**
 * Perform a union of temprsvpmatches and tempcompanymatches tables
 * Called by addTempRsvpMatches
 * @param  {integer} memberid - User's Meetup memberid
 */
function unionTempMatches (memberid) {
  console.log('unionTempMatches')
  // Unite temprsvpmatches and tempcompanymatches
  knex
    .select('memberid', 'searchuid', 'eventid')
    .from('temprsvpmatches' + memberid)
    .union(function () {
      this.select('memberid', 'searchuid', 'eventid')
      .from('tempcompanymatches' + memberid)
      .then(function (results) {
        // NOTE: You don't get the desired results in this promise. Check the one below
      })
      .catch(function (err) { console.error(err) })
    })
    .then(function (results) {
  // Add results to events table
      addMatchEvents(results, memberid)
    })
    .catch(function (err) { console.error(err) })
}

/**
 * Add relevant matched events to the events table.
 * Called by unionTempMatches
 * @param {array} results - Array of matched events
 * @param {integer} memberid - User's Meetup memberid
 */
function addMatchEvents (results, memberid) {
  console.log('addMatchEvents')
  knex('events')
    .pluck('eventid')
    .then(function (existingEvents) {
      var newEvents = _.pluck(results, 'eventid')
      var searchEvents = _.difference(newEvents, existingEvents)
      var finalEvents = results.filter(function (val) {
        return (_.indexOf(searchEvents, val.eventid) + 1) ? val : false
      })
      var events = []
      var i = finalEvents.length
      finalEvents.forEach(function (e) {
  // Pull event from tempevents table
        knex('tempevents' + memberid)
          .where('eventid', e.eventid)
          .then(function (event) {
            events.push(event[0])
            i--
            if (i === 0) {
  // Remove any duplicate events, eg, company and employee match
              var uniqueevents = _.uniq(events, 'eventid')
              knex('events')
                .insert(uniqueevents)
                .catch(function (err) { console.error(err) })
                .then(function () {
  // Pass united temp matches into addSearchResults
                  addSearchResults(results, memberid)
                })
            }
          })
      })
  // Account for no new events added to events table
      if (finalEvents.length === 0) {
        addSearchResults(results, memberid)
      }
    })
} // End addMatchEvents

/**
 * Calculate and insert search results into searchresults table
 * Called by addMatchEvents
 * @param {array} searchresults - Company and RSVP matches
 * @param {integer} memberid - User's Meetup memberid
 */
function addSearchResults (searchresults, memberid) {
  console.log('addSearchResults')
  var tempresults = []
  var i = searchresults.length
  knex('searchresults')
    .pluck('eventid')
    .where('searchmemberid', memberid)
    .then(function (existingEventIds) {
      searchresults.forEach(function (e) {
        var companymatch = false
        var employeematch = false
        var rsvpstatus
        var finalresult = {}

  // 1. Set other company/employee matches
        if (e.memberid) {
          employeematch = true
        }
        if (!e.memberid) {
          companymatch = true
        }

  // 2. Check if member is attending
        knex('temprsvps' + memberid)
          .where({
            memberid,
            eventid: e.eventid
          })
          .then(function (result) {
            if (result[0]) {
              rsvpstatus = 'Attending'
            } else {
              rsvpstatus = 'Not attending' // TODO: Fix language here
            }
  // 3. Check event status REVIEW: Is this necessary?
  //
  // ...
            finalresult = {
              eventid: e.eventid,
              searchuid: e.searchuid,
              searchmemberid: memberid,
              rsvpstatus,
              companymatch,
              employeematch,
              status: ''
            }
            tempresults.push(finalresult)
            i--
            if (i === 0) {
  // 4. Check employee and company match and override falses with trues
              var alltrue = []
              var finals = []
              var ind = tempresults.length
              tempresults.forEach(function (elem) {
                var oneid = tempresults.filter(function (value) {
                  return (elem.eventid === value.eventid && elem.searchuid === value.searchuid ? value : false)
                })
                var trues = oneid.reduce(function (pv, cv) {
                  cv.companymatch = pv.companymatch || cv.companymatch
                  cv.employeematch = pv.employeematch || cv.employeematch
                  return cv
                })
                alltrue.push(trues)
                ind--
                if (ind === 0) {
                  var foundEventIds = _.pluck(alltrue, 'eventid')
                  console.log('found: ', foundEventIds)
                  var newEventIds = _.difference(foundEventIds, existingEventIds)
                  console.log('new: ', newEventIds)
                  var uniqueEvents = _.uniq(alltrue, 'eventid')
                  finals = uniqueEvents.filter(function (e) {
                    return (newEventIds.indexOf(e.eventid) + 1) ? e : false
                  })
                  console.log('finals: ', finals)
  // 5. Add to database and trigger deletion of temp tables
                  knex('searchresults')
                    .insert(finals)
                    .then(function () {
  // 6. Pass matched events into searchresults
                      addRsvps(memberid, searchresults)
                    })
                    .catch(function (err) { console.error(err) })
                }
              })
            }
          })
      })
    })
} // End addSearchResults

/**
 * Add to rsvps table for matched events.
 * Called by addSearchResults.
 * @param {array} searchresults - Array of objects that matched search
 */
function addRsvps (memberid, searchresults) {
  console.log('addRsvps')
  // Remove any company venue matches from results
  var membersearchresults = searchresults.filter(function (value) {
    return value.memberid ? value : false
  })
  // Get searchresultuid from searchresults table
  var i = membersearchresults.length
  var rsvps = []
  membersearchresults.forEach(function (e) {
    knex('searchresults')
      .where({
        searchuid: e.searchuid,
        eventid: e.eventid
      })
      .then(function (result) {
        if (result[0]) {
          rsvps.push({
            searchresultuid: result[0].uid,
            rsvpmemberid: e.memberid,
            eventid: result[0].eventid
          })
        }
        i--
        if (i === 0) {
  // Insert into RSVPs table
          knex('rsvps')
            .insert(rsvps)
            .catch(function (err) { console.error(err) })
            .then(function () {
  // Db tasks finished, drop temp tables
              removeTempTables(memberid)
            })
        }
      })
  })
} // End addRsvps

/**
 * Drop all temp tables.
 * Called by addRsvps
 */
function removeTempTables (memberid) {
  console.log('removeTempTables')
  knex
    .raw('drop table tempevents' + memberid + ', temprsvps' + memberid + ', temprsvpmatches' + memberid + ', tempcompanymatches' + memberid + ';')
    .catch(function (err) { console.error(err) })
    .then(function () {
      console.log('DONE! ♪┏(・o･)┛♪┗ ( ･o･) ┓♪')
    })
} // End removeTempTables

// ----------------------------------------------------------------------------
// 5. Member bio gathering functions
// ----------------------------------------------------------------------------

// REVIEW: Make this happen once per day at night
// function getBios (url) {
// // Request member bio data via Meetup members API
//   request(url, function (error, response, body) {
//     var members = []
//     var socialmedias = []
//     var topics = []
//     if (!error && response.statusCode === 200) {
//       var membersresult = JSON.parse(body)
//       var i = membersresult.results.length
//       membersresult.results.forEach(function (e) {
// // Build member object
//         var imageurl = ''
//         if (e.photo) {
//           imageurl = e.photo.photo_link || ''
//         }
//         var membersobj = {
//           memberid: e.id,
//           name: e.name,
//           meetupprofileurl: e.link,
//           imageurl,
//           meetupbio: e.bio || '',
//           usertypeid: 3,
//           alerts: 'OFF'
//         }
//         var mediaservices = e.other_services
// // Build social media object
//         for (var key in mediaservices) {
//           var socialmediaobj = {}
//           socialmediaobj.memberid = e.id
//           socialmediaobj.mediaprofileurl = mediaservices[key].identifier
//
//           switch (key) {
//             case 'facebook':
//               socialmediaobj.socialmediauid = 1
//               break
//             case 'twitter':
//               socialmediaobj.socialmediauid = 2
//               socialmediaobj.mediaprofileurl = 'http://twitter.com/' + mediaservices[key].identifier.slice(1)
//               break
//             case 'linkedin':
//               socialmediaobj.socialmediauid = 3
//               break
//             case 'flickr':
//               socialmediaobj.socialmediauid = 4
//               break
//             case 'tumblr':
//               socialmediaobj.socialmediauid = 5
//               break
//             default:
//               console.error('Unknown social media outlet')
//           }
//           socialmedias.push(socialmediaobj)
//         }
// // Build topic object
//         for (var topic in e.topics) {
//           var topicobj = {
//             memberid: e.id,
//             topic: e.topics[topic].name
//           }
//           topics.push(topicobj)
//         }
//         members.push(membersobj)
//         i--
// // If loop has finished, insert into members, socialmedialinks and topics tables
//         if (i === 0) {
//           knex('members')
//             .insert(members)
//             .catch(function (err) { console.error(err) })
//             .then(function () {
//               knex('socialmedialinks')
//                 .insert(socialmedias)
//                 .catch(function (err) { console.error(err) })
//                 .then(function () {
//                   knex('topics')
//                     .insert(topics)
//                     .catch(function (err) { console.error(err) })
//                 })
//             })
// // If there is another page of results, run getBios with the next page
//           if (membersresult.meta.next !== '') {
//             getBios(membersresult.meta.next)
//           } else {
// // Find all members without meetupgroupbios and run each through getGroupBios
// // Set a 10 second interval. 5 seconds was too frequent but another may be faster
//             knex('members')
//               .pluck('memberid')
//               .whereNull('meetupgroupbios')
//               .then(function (members) {
//                 members.forEach(function (e, i) {
//                   setTimeout((function (x) {
//                     return function () { getGroupBios(e, accesstoken, []) }
//                   })(i), 10000 * i)
//                 })
//                 // setTimeout(searchCompanies(), 10000 * members.length)
//               })
//               .catch(function (err) { console.error(err) })
//           }
//         }
//       })
//     }
//   })
// }

// ----------------------------------------------------------------------------
// 6. Module.exports
// ----------------------------------------------------------------------------

module.exports = router

// Testing exports methods
module.exports.saveProfile = saveProfile
module.exports.addLinkedIn = addLinkedIn
module.exports.addCompany = addCompany
module.exports.getGroupBios = getGroupBios
module.exports.addGroupBios = addGroupBios

// var z = [
//   {
//     id: 1,
//     company: true,
//     employee: false
//   },
//   {
//     id: 1,
//     company: false,
//     employee: true
//   },
//   {
//     id: 2,
//     company: true,
//     employee: false
//   },
//   {
//     id: 3,
//     company: true,
//     employee: false
//   },
//   {
//     id: 3,
//     company: false,
//     employee: true
//   }
// ]
