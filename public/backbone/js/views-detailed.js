/* globals Backbone, $, _, moment */

var GUI = (function () {
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
      var hasLinkedIn = false
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
            hasLinkedIn = true
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
      var $meetupsentence = $('<li>')
        .text(this.model.get('meetupsentence'))
        .addClass('meetupsentence')
      var $meetuptopics = $('<li>')
        .text(this.model.get('topics').slice(0, 4).join(', '))
        .attr('title', this.model.get('topics').join(', '))
        .addClass('meetuptopics')
      var $careergoals = $('<li>')
        .text(this.model.get('careergols') || '')
        .addClass('careergoals')
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
      $talkingpoints.append($meetupsentence).append($meetuptopics).append($careergoals)
      $cardmid.append($name).append($positioncompany).append($socials).append($talkingpoints)
      $cardright.append($messagelink)
      if (!hasLinkedIn) {
        var $linkedinsearch = $('<a>').text('Search').append($('<span class="linkedinicon">')).addClass('linkedinsearch')
        $cardright.append($linkedinsearch)
      }
      $card.append($cardleft).append($cardmid).append($cardright)
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

  function guiConstructor (searchResults, container) {
    var dashboardView = new EventDetailedView({
      collection: searchResults,
      container: $(container)
    })
  }

  return guiConstructor
}())
