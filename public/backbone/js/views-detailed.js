/* globals Backbone, $, _, moment */

var RsvpGUI = (function () {
  var EventRsvpView = Backbone.View.extend({
    tagName: 'div',
    className: 'event-attendees',
    render: function () {
      var self = this
      var $photo = $('<img>')
        .attr({
          alt: 'Profile photo of ' + this.model.get(''),
          src: this.model.get('imageurl') || 'https://static1.squarespace.com/static/50e70b75e4b0d5ee8b74860b/t/515602bfe4b0fc0d94666eb5/1364591296832/profile+blank.jpg'
        })
        .addClass('photo')
      var $name = $('<h3>')
        .text(this.model.get('name'))
        .addClass('name')
      var position = this.model.get('position') ? this.model.get('position') + ' at ' : ''
      var company = this.model.get('company') || ''
      var $positioncompany = $('<h5>')
        .text(position + company)
        .addClass('positioncompany')
      var $socials = $('<div>')
        .addClass('socialmedialinks')
      this.model.get('socialmedialinks').forEach(function (e) {
        switch (e.socialmediauid) {
          case 1:
            var $facebook = $('<a>')
              .attr('href', e.mediaprofileurl)
            var $facebookicon = $('<span>')
              .addClass('facebookicon')
            $facebook.append($facebookicon).appendTo($socials)
            break
          case 2:
            var $twitter = $('<a>')
              .attr('href', e.mediaprofileurl)
            var $twittericon = $('<span>')
              .addClass('twittericon')
            $twitter.append($twittericon).appendTo($socials)
            break
          case 3:
            var $linkedin = $('<a>')
              .attr('href', e.mediaprofileurl)
            var $linkedinicon = $('<span>')
              .addClass('linkedinicon')
            $linkedin.append($linkedinicon).appendTo($socials)
            break
          case 4:
            var $flickr = $('<a>')
              .attr('href', e.mediaprofileurl)
            var $flickricon = $('<span>')
              .addClass('flickricon')
            $flickr.append($flickricon).appendTo($socials)
            break
          case 5:
            var $tumblr = $('<a>')
              .attr('href', e.mediaprofileurl)
            var $tumblricon = $('<span>')
              .addClass('tumblricon')
            $tumblr.append($tumblricon).appendTo($socials)
            break
          default:
            console.error('Unknown social media outlet')
        }
      })
      var $talkingpoints = $('<ul>')
        .addClass('talkingpoints')
        .append($('<h5>').text('Talking points'))
      if (this.model.get('meetupsentence')) {
        var $meetupsentence = $('<li>')
          .text(this.model.get('meetupsentence'))
          .addClass('meetupsentence')
        $talkingpoints.append($meetupsentence)
      }
      if (this.model.get('topics')) {
        var $meetuptopics = $('<li>')
          .text(this.model.get('topics').slice(0, 4).join(', '))
          .attr('title', this.model.get('topics').join(', '))
          .addClass('meetuptopics')
        $talkingpoints.append($meetuptopics)
      }
      if (this.model.get('careergoals')) {
        var $careergoals = $('<li>')
          .text(this.model.get('careergoals') || '')
          .addClass('careergoals')
        $talkingpoints.append($careergoals)
      }
      if (!this.model.get('meetupsentence') && !this.model.get('topics')[0] && !this.model.get('careergoals')) {
        var $empty = $('<li>')
          .text("Sorry, we didn't find anything on Meetup.com. Try something random.")
        $talkingpoints.append($empty)
      }
      var $messagelink = $('<a>')
        .text('Message ')
        .append($('<span class="glyphicon glyphicon-envelope">'))
        .addClass('messagelink')
        .attr('href', 'https://secure.meetup.com/messages/?new_convo=true&member_id=' + this.model.get('memberid') + '&name=' + this.model.get('name'))
      var $card = $('<div>')
        .addClass('row attendee')
      var $cardleft = $('<div>')
        .addClass('col-md-2 col-md-offset-1')
      var $cardmid = $('<div>')
        .addClass('col-md-6')
      var $cardright = $('<div>')
        .addClass('col-md-3')
      $cardleft.append($photo)
      $cardmid.append($name).append($positioncompany).append($socials).append($talkingpoints)
      $cardright.append($messagelink)
      $card.append($cardleft).append($cardmid).append($cardright)
      var matchsearchuid = this.model.get('searchuid')
      var allsearches = this.model.get('companies')
      var allnames = _.pluck(this.model.get('companies'), 'searchcompany')
      console.log('allsearches: ', allsearches)
      console.log('allnames: ', allnames)
      console.log('sruid: ', matchsearchuid)
      allsearches.forEach(function (searchuid, index) {
        if (matchsearchuid === searchuid.uid) {
          console.log('match!')
          if (searchuid.type === 'temp') {
            $card.addClass('colortemp')
            $messagelink.addClass('colortemp')
          } else {
            $card.addClass('color' + (index + 1))
            $messagelink.addClass('color' + (index + 1))
            $positioncompany.text(allnames[index])
          }
        }
      })
      $('.attendee a').attr('target', '_blank')
      this.$el.append($card)
      this.container.append(this.$el)
    },
    initialize: function (opts) {
      _.extend(this, opts) // if (opts) {this.container = opts.container}
      this.render()
    }
  })

  var EventDetailedView = Backbone.View.extend({
    tagName: 'div',
    id: 'event-detailed',
    render: function () {
      this.container.append(this.$el)
      console.log('EventDetailedView rendered')
    },
    initialize: function (opts) {
      _.extend(this, opts) // if (opts) {this.container = opts.container}
      this.render()
      var self = this
      this.collection.forEach(function (element, index, array) {
        var searchResult = new EventRsvpView({
          model: element,
          container: self.$el
        })
      })
      this.listenTo(this.collection, 'add', this.addEventRsvpView)
    },
    events: {
      //
    },
    addEventRsvpView: function (model) {
      var searchResult = new EventRsvpView({
        model: model,
        container: this.$el
      })
    }
  })

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
      var $title = $('<a>').attr('href', '/eventrsvps/' + this.model.get('eventid'))
      var $titletext = $('<h3 class="title">').text(this.model.get('title'))
      $title.append($titletext)
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
    id: 'single-result',
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

  function guiConstructor (searchResults, singleEvent, container) {
    var singleEventView = new DashboardView({
      collection: singleEvent,
      container: $('.backbone-event')
    })
    var eventDetailedView = new EventDetailedView({
      collection: searchResults,
      container: $('.backbone-rsvps')
    })
  }

  return guiConstructor
}())
