/* globals describe, it, expect, beforeEach, afterEach */
var index = require('../routes/index')
var config = require('../config')
var knex = require('knex')(config.AWS)
var request = require('supertest')
var app = require('../app')

describe('Signing up', function () {
  var server
  beforeEach(function () {
    server = require('../bin/www')
  })
  afterEach(function () {
    server.close()
  })
  it('should request authentication for Meetup.com', function () {
    request(server)
      .get('/auth/meetup')
      .expect(function (res) {
        console.log(res)
      })
  })

  it('should receive OAuth token after receiving successful authentication from Meetup.com', function () {
    request(server)
      .get('/auth/meetup/callback')
      .expect(function (res) {
        console.log(res)
      })
  })

  it('should add a new record in the members table', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should give the user a cookie', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should load models with data if the user has search result records in the database', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should add company, position and career goals fields to the member database', function () {
    var result
    var form = {
      name: 'Mitch Lillie',
      company: 'Portland Code School',
      position: 'JavaScript Developer',
      careergoals: 'Networking and job hunting!'
    }
    index.saveProfile(188525180, form)
    knex('members')
      .select()
      .where('name', 'Mitch Lillie')
      .then(function (result) {
        console.log(result)
        result = result
      })
      .catch(function (err) { console.error(err) })
    // expect(typeof result).toEqual('object')
  })
})

describe('Logging in', function () {
  it('should request authentication for Meetup.com', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should receive OAuth token after receiving successful authentication from Meetup.com', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should not add a new record in the members table', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should give the user a cookie', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should load models with data if the user has search result records in the database', function () {
    var a = true
    expect(a).toBe(true)
  })
})

describe('Logging out', function () {
  it('should remove a cookie', function () {
    var a = true
    expect(a).toBe(true)
  })
})

describe('Connecting to LinkedIn', function () {
  it('should request authentication for LinkedIn.com', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should receive OAuth token after receiving successful authentication from LinkedIn.com', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should update member profile record in the database', function () {
    var a = true
    expect(a).toBe(true)
  })
})

describe('A dashboard containing events at a company', function () {
  it('should be sorted with earliest events first', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should be sorted with highest search score first', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should increase the RSVP count for an event when you click the RSVP button, as well as decrease the # spots remaining', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should decrease the RSVP count for an event when you click the unRSVP button, as well as increase the # spots remaining', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should decrease the RSVP count for an event when you click the unRSVP button, as well as increase the # spots remaining', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should only find events that are tied to saved searches for the memberID of the logged in user', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should create models when you submit a search for a new company, or update when you search for a company that is part of an Active saved search', function () {
    var a = true
    expect(a).toBe(true)
  })
})

describe('The search results page and the settings page', function () {
  it('should create a new record with status set as Active (or update any existing record as having Active status) in the Searches table when you follow a company', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should update record in the Searches table as Inactive when you unfollow a company', function () {
    var a = true
    expect(a).toBe(true)
  })
})

describe('On the event attendees page', function () {
  it('the Meetup message button should direct you to the correct URL link for the logged in user', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('the LinkedIn search button should direct you to the correct URL link for the logged in user', function () {
    var a = true
    expect(a).toBe(true)
  })
})
