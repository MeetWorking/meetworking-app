/* globals Backbone */

var SearchResultModel = Backbone.Model.extend({
  defaults: {
    // fields from events table
    eventid: '',
    groupid: '',
    groupname: '',
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
    searchuids: []
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
      this.set('rsvpstatus', 'no')
      this.save(
        { error: function (model, jqXHR) {
          if (jqXHR.statusCode === 403) {
            console.log('error updating model')
            window.location = '/joinerror'
          } else {
            console.log('Some other error happened :-(')
          }
        }}
      )
    } else {
      this.set('rsvpstatus', 'yes')
      this.save(
        { error: function (model, jqXHR) {
          if (jqXHR.statusCode === 403) {
            console.log('error updating model')
            window.location = '/joinerror'
          } else {
            console.log('Some other error happened :-(')
          }
        }}
      )
    }
  }
})

var SearchResultCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: '/searchresults',
  initialize: function () {
    console.log('new SearchResultCollection')
    this.fetch(
      { error: function (model, jqXHR) {
        if (jqXHR.statusCode === 403) {
          console.log('error updating model')
          window.location = '/joinerror'
        } else {
          console.log('Some other error happened :-(')
        }
      }})
  }
})
