/* globals Backbone, $, _, moment */

var GUI = (function () {
  var SearchResultView = Backbone.View.extend({
    tagName: 'div',
    className: 'search-result',
    render: function () {
      var date = moment(this.model.get('datetime')).format('dddd, MMMM D')
      var $date = $('<h2 class="date">').text(date)
      var $link = $('<a>')
        .attr('href', '/detailed/' + this.model.get())
      var $card = $('<div class="card">')
      //
      var $cardLeft = $('<div class="card-left">')

      var time = moment(this.model.get('datetime')).format('h:mm A')
      var $time = $('<h3 class="time">').text(time)
      $cardLeft.append($time)
      //
      var $cardRight = $('<div class="card-right">')
      var $title = $('<h3 class="title">').text(this.model.get('title'))
      var $group = $('<p class="group">').text(this.model.get('groupname'))
      //
      //
      var $div = $('<div>')
      var $divLeft = $('<div class="div-left">')
      var $location = $('<div class="location">').html('<p>@ ' + this.model.get('location') + '</p>')
      var $divRight = $('<div class="div-right">')
      var $rsvpButton = $('<input type="button" class="btn btn-primary btn-sm" id="rsvp" value="RSVP">')
      if (this.model.get('rsvpstatus') === 'yes') {
        $rsvpButton = $('<input type="button" class="btn btn-default btn-sm" id="rsvp" value="Going">')
      }
      var $spots = ''
      if (this.model.get('spotsleft')) {
        $spots = $('<div class="spots-left">').html('<p>' + this.model.get('spotsleft') + ' spots left</p>')
      }
      //
      //
      var $attendance = ''
      if (this.model.get('rsvps')) {
        $attendance = $('<h5 class="rsvps">').text(this.model.get('rsvps') + ' attending') // + this.model.get('meetworkers') + ' MeetWorkers, ' + this.model.get('recruiters') + ' Recruiters')
      }
      var uids = _.pluck(this.model.get('companies'), 'uid')
      console.log('this.model.get(companies): ', this.model.get('companies'))
      this.model.get('searchuids').forEach(function (searchuid, index) {
        if (uids.indexOf(searchuid.searchuid) === 0) {
          // set color1 class
          if (searchuid.companymatch) {
            $location.addClass('color1')
          }
          if (searchuid.employeematch) {
            $attendance.addClass('color1')
          }
        } else if (uids.indexOf(searchuid.searchuid) === 1) {
          // set color2 class
          if (searchuid.companymatch) {
            $location.addClass('color2')
          }
          if (searchuid.employeematch) {
            $attendance.addClass('color2')
          }
        } else if (uids.indexOf(searchuid.searchuid) === 2) {
          // set color3 class
          if (searchuid.companymatch) {
            $location.addClass('color3')
          }
          if (searchuid.employeematch) {
            $attendance.addClass('color3')
          }
        } else if (searchuid.searchuid) {
          // Temp company or unhandled company
          if (searchuid.companymatch) {
            $location.addClass('colortemp')
          }
          if (searchuid.employeematch) {
            $attendance.addClass('colortemp')
          }
        }
      })
      $divLeft.append($group).append($location)
      $divRight.append($rsvpButton).append($spots).append($attendance)
      $div.append($divLeft).append($divRight)
      $cardRight.append($title).append($div)
      //
      $card.append($cardLeft).append($cardRight)

      this.$el.append($date).append($card)
      this.container.append(this.$el)
    },
    initialize: function (opts) {
      _.extend(this, opts) // if (opts) {this.container = opts.container}
      this.render()
      this.listenTo(this.model, 'sync', this.updateRSVP)
    },
    events: {
      'click #rsvp': 'changeRSVP'
    },
    updateRSVP: function (model) {
      this.$('#rsvp').toggleClass('btn-primary btn-default')
      if (model.get('rsvpstatus') === 'yes') {
        this.$('#rsvp').attr('value', 'Going')
      } else {
        this.$('#rsvp').attr('value', 'RSVP')
      }
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
