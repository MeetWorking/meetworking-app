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

    // 'status' field from from searchresults table (need distinct value)
    displaystatus: '',

    // combination of fields from searchresults and searches tables (with the exception of searchresults.status)
    searchuids: []
  },
  initialize: function () {
    console.log('new SearchResultModel')
		// run queries that will add properties to each model instance which represents the count of members attending an event that work for a saved search company
		// update searchuids property with an array of objects that each contain searchuid, searchmemberid, rsvpstatus, companymatch, employeematch, searchcompany, and logourl
  }
})

var SearchResultCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: '/searchresults',
  initialize: function () {
    console.log('new SearchResultCollection')
    this.fetch()
  }
})
