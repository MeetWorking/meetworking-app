/* globals Backbone, $, _, moment */

var GUI = (function () {
  var SearchResultView = Backbone.View.extend({
    tagName: 'div',
    className: 'search-result',
    render: function () {
      this.$el.attr('style', 'margin-top: 50px')

      var myDate = moment(this.model.get('datetime'))
      var date = myDate.format('dddd, MMMM D') // this.model.get('datetime').slice(0, 10)
      var $date = $('<h2>').text(date)

      var $card = $('<div style="border: 1px solid black">')
      //
      var $cardLeft = $('<div style="width: 20%; float: left; padding-right: 2%">')
      var time = myDate.format('h:mm A') // this.model.get('datetime').slice(11)
      var $time = $('<h3>').text(time)
      $cardLeft.append($time)
      //
      var $cardRight = $('<div style="width: 80%; float: left">')
      var $title = $('<h3>').text(this.model.get('title'))
      var $group = $('<p style="font-size: 1.25rem">').text('(Meetup Group: ' + this.model.get('groupname') + ')')
      //
      //
      var $div = $('<div>')
      var $divLeft = $('<div style="width: 65%; float: left">')
      var $location = $('<div style="height: 50px">').html('<h3>@ ' + this.model.get('location') + '</h3>')
      $divLeft.append($location)
      var $divRight = $('<div style="margin-left: 2%; width: 32%; float: left">')
      var $rsvpButton = $('<input type="button" id="rsvp" value="RSVP" style="height: 50px; width: 45%">')
      var $spots = $('<div style="text-align: center; padding-top: 10px; width: 45%">').html('<p style="font-size: 1.25rem">' + this.model.get('spotsleft') + ' spots left</p>')
      $divRight.append($rsvpButton).append($spots)
      $div.append($divLeft).append($divRight)
      //
      //
      var $attendance = $('<h3>').text(this.model.get('rsvps') + ' attending, ' + this.model.get('meetworkers') + ' MeetWorkers, ' + this.model.get('recruiters') + ' Recruiters')
      $cardRight.append($title).append($group).append($div).append($attendance)
      //
      $card.append($cardLeft).append($cardRight)

      this.$el.append($date).append($card)
      this.container.append(this.$el)
    },
    initialize: function (opts) {
      _.extend(this, opts) // if (opts) {this.container = opts.container}
      this.render()
    },
    events: {
      'click #rsvp': 'changeRSVP'
    },
    changeRSVP: function () {
      console.log('changeRSVP in view')
      this.model.changeRSVP()
    }
  })

  var DashboardView = Backbone.View.extend({
    tagName: 'div',
    id: 'search-results',
    render: function () {
      this.$el.html('<h1>Events</h1>')
      this.container.append(this.$el)
      console.log('DashboardView rendered')
    },
    initialize: function (opts) {
      _.extend(this, opts) // if (opts) {this.container = opts.container}
      this.render()
      var self = this
      var selectedView = 'Recommended'
      var selectedResults = this.collection.where({displaystatus: selectedView})
      selectedResults.forEach(function (element, index, array) {
        var searchResult = new SearchResultView({
          model: element,
          container: self.$el
        })
      })
      this.listenTo(this.collection, 'add', this.addSearchResultView)
    },
    events: {
      //
    },
    addSearchResultView: function (model) {
      var searchResult = new SearchResultView({
        model: model,
        container: this.$el
      })
    }
  })

  function guiConstructor (searchResults, container) {
    var dashboardView = new DashboardView({
      collection: searchResults,
      container: $(container)
    })
  }

  return guiConstructor
}())
