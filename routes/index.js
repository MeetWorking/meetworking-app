var express = require('express')
var router = express.Router()
var request = require('request')
var _ = require('lodash')

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
  console.log('req.user===>', req.user)
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
        knex('members')
          .where('memberid', currentuser)
          .update('acccesstoken', req.user.accesstoken)
        res.user = req.user
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

function getGroupBios (memberid, accesstoken, groupBios, url) {
  console.log('getGroupBios is called-------')
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
  var memberEventsUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&member_id=' + memberid + '&access_token=' + accesstoken
  var conciergeEventsUrl = 'https://api.meetup.com/2/concierge?&sign=true&photo-host=public&format=json&time=,2w&page=100&access_token=' + accesstoken
  knex.schema
    .createTable('tempevents', function (table) {
      table.string('eventid')
      table.string('groupid')
      table.string('groupname', 45)
      table.string('title', 45)
      table.text('description')
      table.text('location').index()
      table.dateTime('datetime')
      table.string('status', 45)
      table.integer('rsvps')
      table.integer('spotsleft')
    })
    .catch(function (err) { console.error(err) })
    .then(getVenues(companies))
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
                    getRSVPs(false, [])
                  }
                } else {
                  knex('tempevents')
                    .insert({ eventid, groupid, groupname, title, description, location, datetime, status, rsvps, spotsleft })
                    .catch(function (err) { console.error(err) })
                    .then(function () {
                      if (index === 2 && i === length - 1) {
                        getRSVPs(false, [])
                      }
                    })
                }
              })
          })
        }
      })
    })
  }
  // function getCompanyEvents (companies) {
  //   var zipCode = '97209'
  //   var searchcompanies = companies.filter(function (val) {
  //     return val.length > 2
  //   })
  //   if (searchcompanies.length !== 0) {
  //     searchcompanies = searchcompanies.join('%2C+')
  //     searchcompanies.replace(/\s+/g, '+')
  //     var openVenueUrl = 'https://api.meetup.com/2/open_venues?&sign=true&photo-host=public&time=,2w&format=json&text=' + searchcompanies + '&zip=' + zipCode + '&page=100&access_token=' + accesstoken
  //     var venueIds = []
  //     console.log('getCompanyEvents has been called for-------', openVenueUrl)
  //     request(openVenueUrl, function (error, response, body) {
  //       if (!error && response.statusCode === 200) {
  //         var result = JSON.parse(body)
  //         result.results.forEach(function (e, i) {
  //           venueIds.push(e.id)
  //         })
  //       }
  //       var apiVenueIds = venueIds.join('%2C+')
  //       var venueEventUrl = 'https://api.meetup.com/2/events?&sign=true&photo-host=public&format=json&time=,2w&page=100&venue_id=' + apiVenueIds + '&access_token=' + accesstoken
  //       getEvents(venueEventUrl, true)
  //       console.log('getCompanyEvents has finished-------')
  //     }
  //   )
  //   }
  // }
    // Insert group bios into members table
  function getRSVPs (url, rsvps) {
    setTimeout(function () {
      console.log('getRSVPs has been called-------')
      knex
        .table('tempevents')
        .pluck('eventid')
        .then(function (eids) {
          console.log('====event ids plucked====', eids)
          var eventids = eids.join('%2C')
          var rsvpurl = url || 'https://api.meetup.com/2/rsvps?&sign=true&photo-host=public&type=json&event_id=' + eventids + '&page=100&access_token=' + accesstoken
          request(rsvpurl, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              var result = JSON.parse(body)
              console.log('===RSVP API RESULT===', result)
              result.results.forEach(function (e, i) {
                var rsvpsobj = {
                  memberid: e.member.member_id,
                  eventid: e.event.id
                }
                rsvps.push(rsvpsobj)
              })
              if (result.meta.next !== '') {
                getRSVPs(result.meta.next, rsvps)
              } else {
                knex.schema
                  .createTable('temprsvps', function (table) {
                    table.string('eventid')
                    table.integer('memberid')
                    // TODO: Add more columns if necessary
                  })
                  .catch(function (err) { console.error(err) })
                  .then(function () {
                    knex('temprsvps')
                      .insert(rsvps)
                      .catch(function (err) { console.error(err) })
                      .then(function () {
                        // run getBios
                        knex('temprsvps')
                          .pluck('memberid')
                          .then(function (tempmembers) {
                            knex('members')
                              .pluck('memberid')
                              .then(function (members) {
                                var uniquetempmembers = _.uniq(tempmembers)
                                var differencetempmembers = _.difference(uniquetempmembers, members)
                                var memberids = differencetempmembers.join('%2C')
                                var url = 'https://api.meetup.com/2/members?&sign=true&photo-host=public&format=json&member_id=' + memberids + '&page=100&access_token=' + accesstoken
                                getBios(url)
                              })
                              .catch(function (err) { console.error(err) })
                          })
                          .catch(function (err) { console.error(err) })
                      })
                  })
              }
            }
          })
        })
    }, 1000)
  }

  function getBios (url) {
    request(url, function (error, response, body) {
      var members = []
      var socialmedias = []
      var topics = []
      if (!error && response.statusCode === 200) {
        var membersresult = JSON.parse(body)
        membersresult.results.forEach(function (e, i) {
          var imageurl = ''
          if (e.photo) {
            imageurl = e.photo.photo_link || ''
          }
          var membersobj = {
            memberid: e.id,
            name: e.name,
            meetupprofileurl: e.link,
            imageurl,
            meetupbio: e.bio || '',
            usertypeid: 3,
            alerts: 'OFF'
          }
          var mediaservices = e.other_services
          for (var key in mediaservices) {
            var socialmediaobj = {}
            socialmediaobj.memberid = e.id
            socialmediaobj.mediaprofileurl = mediaservices[key].identifier

            switch (key) {
              case 'facebook':
                socialmediaobj.socialmediauid = 1
                break
              case 'twitter':
                socialmediaobj.socialmediauid = 2
                socialmediaobj.mediaprofileurl = 'http://twitter.com/' + mediaservices[key].identifier.slice(1)
                break
              case 'linkedin':
                socialmediaobj.socialmediauid = 3
                break
              case 'flickr':
                socialmediaobj.socialmediauid = 4
                break
              case 'tumblr':
                socialmediaobj.socialmediauid = 5
                break
              default:
                console.error('Unknown social media outlet')
            }
            socialmedias.push(socialmediaobj)
          }
          for (var topic in e.topics) {
            var topicobj = {
              memberid: e.id,
              topic: e.topics[topic].name
            }
            topics.push(topicobj)
          }
          members.push(membersobj)
        })
        knex('members')
          .insert(members)
          .catch(function (err) { console.error(err) })
          .then(function () {
            knex('socialmedialinks')
              .insert(socialmedias)
              .catch(function (err) { console.error(err) })
              .then(function () {
                knex('topics')
                  .insert(topics)
                  .catch(function (err) { console.error(err) })
              })
          })
        if (membersresult.meta.next !== '') {
          getBios(membersresult.meta.next)
          console.log('requesting next group bio...')
        } else {
          console.log('getBios has finished====')
          knex('members')
            .pluck('memberid')
            .then(function (members) {
              members.forEach(function (e, i) {
                setTimeout((function (x) {
                  return function () { getGroupBios(e, accesstoken, []) }
                })(i), 10000 * i)
                setTimeout(searchCompanies(), 10000 * i)
              })
            })
            .catch(function (err) { console.error(err) })
        }
      }
    })
  }
  function searchCompanies () {
    knex('searches')
      .select()
      .where('memberid', req.user.memberid)
      .then(function (result) {
        console.log('search companies:', result)
      })
    // knex
    //   .pluck('memberid')
    //   .from('members')
    //   .orWhereRaw('MATCH(company, meetupbio, meetupgroupbios) AGAINST(? IN BOOLEAN MODE)', company)
    //   .then(function (matches) {
    //     console.log(matches)
    //     // addTempRsvpMatches(matches, company, memberid)
    //   })
  }

  function addTempRsvpMatches (matches, company, memberid) {

  }
  res.redirect('/')
})

router.get('/testing', function (req, res, next) {
  // We need:
  // Search Results table:
  // {
  //   eventid: '',
  // XXX   searchuid: '',
  // XXX  searchmemberid: '',
  //   rsvpstatus: '',
  //   companymatch: '',
  //   employeematch: '',
  //   status: ''
  // }
  // Events table (unique only):
  // {
  //  groupid:
  //  groupname:
  //  title:
  //  description:
  //  location:
  //  datetime:
  //  rsvps:
  //  spotsleft:
  // }
  var memberid = 188525180 // TODO: replace with req.user.memberid
  function searchCompanies () {
    knex('searches')
      .select()
      .where('memberid', memberid)
      .then(function (result) {
        knex.schema
          .createTable('tempcompanymatches', function (table) {
            table.integer('memberid')
            table.integer('searchuid')
            table.string('eventid')
          })
          .catch(function (err) { console.error(err) })
        knex.schema
          .createTable('temprsvpmatches', function (table) {
            table.integer('memberid')
            table.integer('searchuid')
            table.string('eventid')
          })
          .catch(function (err) { console.error(err) })
          .then(function () {
            result.forEach(function (e, i) {
              knex
                .pluck('memberid')
                .from('members')
                .orWhereRaw('MATCH(company, meetupbio, meetupgroupbios) AGAINST(? IN BOOLEAN MODE)', e.searchcompany)
                .then(function (matches) {
                  addTempRsvpMatches(matches, e.uid, memberid)
                })
              knex
                .pluck('eventid')
                .from('tempevents')
                .orWhereRaw('MATCH(location) AGAINST(? IN BOOLEAN MODE)', e.searchcompany)
                .then(function (eventids) {
                  addTempCompanyMatches(eventids, e.uid)
                })
            })
          })
      })
  }

  function addTempCompanyMatches (eventids, searchuid) {
    var tempcompanymatches = []
    eventids.forEach(function (e, i) {
      var tempcompanymatch = {
        eventid: e,
        searchuid
      }
      tempcompanymatches.push(tempcompanymatch)
      if (i === eventids.length - 1) {
        knex('tempcompanymatches')
          .insert(tempcompanymatches)
          .catch(function (err) { console.error(err) })
      }
    })
  }

  function addTempRsvpMatches (matches, searchuid, memberid) {
    var temprsvpmatches = []
    var differencematches = _.difference(matches, [memberid])
    differencematches.forEach(function (e, i) {
      knex('temprsvps')
        .where('memberid', e)
        .distinct('eventid', 'memberid') // Added due to data repetition in temprsvps. shouldn't be necessary
        .then(function (result) {
          console.log('result of temprsvpmatches==', result)
          result.forEach(function (ele, ind) {
            var temprsvpmatch = {
              memberid: ele.memberid,
              searchuid,
              eventid: ele.eventid
            }
            temprsvpmatches.push(temprsvpmatch)
            if (i === differencematches.length - 1 && ind === result.length - 1) {
              knex('temprsvpmatches')
                .insert(temprsvpmatches)
                .catch(function (err) { console.error(err) })
                .then(unionTempMatches())
            }
          })
        })
        .catch(function (err) { console.error(err) })
    })
  }
  function unionTempMatches () {
    console.log('unionTempMatches is beginning')
    knex
      .select('memberid', 'searchuid', 'eventid')
      .from('temprsvpmatches')
      .union(function () {
        this.select('memberid', 'searchuid', 'eventid')
        .from('tempcompanymatches')
        .then(function (results) {
          console.log('union complete')
        })
        .catch(function (err) { console.error(err) })
      })
      .then(function (results) {
        console.log('Expecting all four results here: ', results)
        // Add to events table
        addMatchEvents(results)
        // Add to searchresults table
      })
      .catch(function (err) { console.error(err) })
  }
  function addMatchEvents (results) {
    var events = []
    results.forEach(function (e, i) {
      knex('tempevents')
        .where('eventid', e.eventid)
        .then(function (event) {
          events.push(event[0])
          if (i === results.length - 1) {
            var uniqueevents = _.uniq(events, 'eventid')
            knex('events')
              .insert(uniqueevents)
              .catch(function (err) { console.error(err) })
              .then(function () {
                console.log('events added to events table')
                addSearchResults(results)
              })
          }
        })
    })
  }

  function addSearchResults (searchresults) {
    console.log('adding search results')
    var tempresults = []
    searchresults.forEach(function (e, i) {
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
      knex('temprsvps')
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
          console.log('one result constructed: ', finalresult)
          tempresults.push(finalresult)
          if (i === searchresults.length - 1) {
            console.log('tempresults is currently: ', tempresults)
  // 4. Check employee and company match and override falses with trues
            var alltrue = []
            var finals
            tempresults.forEach(function (elem, ind) {
              var oneid = tempresults.filter(function (value) {
                return (elem.id === value.id && elem.searchuid === value.searchuid ? value : false)
              })
              console.log('oneid: ', oneid)
              var trues = oneid.reduce(function (pv, cv) {
                cv.companymatch = pv.companymatch || cv.companymatch
                cv.employeematch = pv.employeematch || cv.employeematch
                return cv
              })
              console.log('trues: ', trues)
              alltrue.push(trues)
              console.log('alltrue: ', alltrue)
              if (ind === searchresults.length - 1) {
                console.log('all done! here are the finals:')
                finals = _.uniq(alltrue, 'eventid')
  // 5. Add to database and trigger deletion of temp tables
                knex('searchresults')
                  .insert(finals)
                  .then(function () {
                    console.log('search results added!')
                    addRsvps(searchresults)
                  })
                  .catch(function (err) { console.error(err) })
              }
            })
          }
        })
    })
  }

  function addRsvps (searchresults) {
    searchresults.forEach(function (e, i) {
      console.log('searchresult in rsvp: ', e)
      if (e.memberid) {
        knex('searchresults')
          .where({
            searchuid: e.searchuid,
            eventid: e.eventid
          })
          .then(function (result) {
            console.log('we got an rsvp result! : ', result)
            console.log('result.uid: %s  e.memberid: %s', result.uid, e.memberid)
            knex('rsvps')
              .insert({
                searchresultuid: result[0].uid,
                rsvpmemberid: e.memberid
              })
              .catch(function (err) { console.error(err) })
              .then(function () {
                console.log('DONE! ♪┏(・o･)┛♪┗ ( ･o･) ┓♪')
              })
          })
      }
    })
  }
  searchCompanies()
  res.send('Check your logs')
})

/* GET searchresults data for the dashboard. */
router.get('/searchresults', function (req, res, next) {
  var memberid = req.user.memberid
  var searchResults = []
  console.log(memberid)
  // each item in the array needs to be an object
    // {
    //   id: '',
    //   eventid: '',
    //   groupid: '',
    //   groupname: '',
    //   title: '',
    //   description: '',
    //   location: '',
    //   datetime: '',
    //   status: '',
    //   rsvps: '',
    //   spotsleft: '',
    //   meetworkers: '',
    //   recruiters: '',
    //   displaystatus: '',
    //   searchuids: []
    // }
  // Use SQL queries via the knex module to find all data relevant to events tied to the user's memberid and saved search companies

  res.send(searchResults)
})

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
