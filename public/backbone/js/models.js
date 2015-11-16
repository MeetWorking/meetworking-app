/* globals Backbone */

var SearchResultModel = Backbone.Model.extend({
  defaults: {
    // fields from events table
    eventid: '',
    groupid: '',
    groupname: '',
    groupurlname: '',
    title: '',
    description: '',
    location: '',
    datetime: '',
    status: '',
    rsvps: '',
    spotsleft: '',
    meetworkers: '',
    recruiters: '',
    rsvpstatus: '',

    // 'status' field from from searchresults table (need distinct value)
    displaystatus: '',

    // combination of fields from searchresults and searches tables (with the exception of searchresults.status)
    searchuids: [],
    companies: []
  },
  initialize: function () {
    console.log('new SearchResultModel')
		// run queries that will add properties to each model instance which represents the count of members attending an event that work for a saved search company
		// update searchuids property with an array of objects that each contain searchuid, searchmemberid, rsvpstatus, companymatch, employeematch, searchcompany, and logourl
  },
  changeRSVP: function () {
    // Toggle function for RSVP status
    console.log('changeRSVP in model')
    if (this.get('rsvpstatus') === 'yes') {
      this.save({rsvpstatus: 'no'},
        {
          success: function (model, jqXHR) {
          // Change rsvp color?
            console.log('Successfully saved ', model)
          },
          error: function (model, jqXHR) {
            if (jqXHR.status === 403) {
              console.log('error updating model')
              window.location = '/joinerror/' + model.get('groupurlname')
            } else {
              console.log('Some other error, %s, happened :-(', jqXHR.status + '')
            }
          }
        }
      ).fail(function () { console.log(arguments) })
    } else {
      this.save({rsvpstatus: 'yes'},
        {
          success: function (model, jqXHR) {
          // Change rsvp color?
            console.log('Successfully saved ', model)
          },
          error: function (model, jqXHR) {
            if (jqXHR.status === 403) {
              console.log('error updating model')
              window.location = '/joinerror/' + model.get('groupurlname')
            } else {
              console.log('Some other error happened :-(')
            }
          }
        }
      ).fail(function () { console.log(arguments) })
    }
  }
})

var EventRsvpModel = Backbone.Model.extend({
  defaults: {
    // fields from events table
    memberid: '',
    usertypeid: '',
    name: '',
    company: '',
    position: '',
    meetupprofileurl: '',
    imageurl: '',
    meetupsentence: '',
    careergoals: '',
    socialmedialinks: [],
    topics: [],
    searchuid: '',
    // Current member search companies
    companies: []
  },
  initialize: function () {
    console.log('new EventRsvpModel')
		// run queries that will add properties to each model instance which represents the count of members attending an event that work for a saved search company
		// update searchuids property with an array of objects that each contain searchuid, searchmemberid, rsvpstatus, companymatch, employeematch, searchcompany, and logourl
  }
})

var SearchResultCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: '/searchresults',
  initialize: function (opts) {
    console.log('new SearchResultCollection')
    this.fetch()
  }
})

var CompanySearchCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: window.location.pathname + '/results',
  initialize: function (opts) {
    console.log('new CompanySearchCollection')
    console.log(this.url)
    this.fetch()
  }
})

var EventRsvpCollection = Backbone.Collection.extend({
  model: EventRsvpModel,
  url: window.location.pathname + '/results',
  initialize: function (opts) {
    console.log('new EventRsvpCollection')
    console.log(this.url)
    this.fetch()
  }
})

var SingleEventCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: window.location.pathname + '/singleevent',
  initialize: function (opts) {
    console.log('new SearchResultCollection')
    this.fetch()
  }
})
