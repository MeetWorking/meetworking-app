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
    // combination of fields from searchresults and searches tables
    searchuids: []
  },
  initialize: function () {
		// this.fetch();
    // run queries that will add properties to each model instance which represents the count of members attending an event that work for a saved search company
		// update searchuids property with an array of objects that each contain searchuid, searchmemberid, rsvpstatus, companymatch, employeematch, displaystatus, searchcompany, and logourl
    // this.on("change", this.save, this);
  }
	// Add methods if needed...
})

var SearchResultCollection = Backbone.Collection.extend({
  model: SearchResultModel,
  url: '/tasks',
  initialize: function () {
    this.fetch()
  }
})

var dashboard = new SearchResultCollection()
