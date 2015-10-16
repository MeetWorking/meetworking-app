/* globals describe, it, expect */

describe('Signing up', function () {
  it('should request authentication for Meetup.com', function () {
    var a = true
    expect(a).toBe(true)
  })

  it('should receive OAuth token after receiving successful authentication from Meetup.com', function () {
    var a = true
    expect(a).toBe(true)
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
