/* globals $, EventRsvpCollection, GUI */

var sample = [
  {
    // fields from events table
    memberid: 188525180,
    usertypeid: 1,
    name: 'Mitch',
    company: 'Tesla',
    position: 'Lead Engineer',
    meetupprofileurl: 'http://www.meetup.com/members/188525180',
    imageurl: 'http://photos2.meetupstatic.com/photos/member/2/0/3/d/member_246968253.jpeg',
    meetupsentence: "I'm a student at Portland Code School, interested in the tech community in Portland, especially Urban Airship, Jama and Mozilla.",
    careergoals: '',
    socialmedialinks: [
      {
        uid: 941,
        memberid: 188525180,
        socialmediauid: 2,
        mediaprofileurl: 'http://twitter.com/mitchlillie'
      }
    ],
    topics: ['Web Design', 'Computer Programming', 'Reddit', 'Mozilla', 'Open Source', 'Js'],
    // Current member search companies
    companies: ['eBay', 'Quick Left', 'Urban Airship']
  },
  {
    // fields from events table
    memberid: 382732838,
    usertypeid: 3,
    name: 'Jeff',
    company: 'Mozilla',
    position: 'Lead Engineer',
    meetupprofileurl: 'http://www.meetup.com/members/188525180',
    imageurl: 'http://photos2.meetupstatic.com/photos/member/2/0/3/d/member_246968253.jpeg',
    meetupsentence: "I'm a student at Portland Code School, interested in the tech community in Portland, especially Urban Airship, Jama and Mozilla.",
    careergoals: '',
    socialmedialinks: [
      {
        uid: 940,
        memberid: 188525180,
        socialmediauid: 3,
        mediaprofileurl: 'https://www.linkedin.com/in/mitchlillie'
      },
      {
        uid: 941,
        memberid: 188525180,
        socialmediauid: 2,
        mediaprofileurl: 'http://twitter.com/mitchlillie'
      }
    ],
    topics: ['Web Design', 'Computer Programming', 'Reddit', 'Mozilla', 'Open Source', 'Js'],
    // Current member search companies
    companies: ['eBay', 'Quick Left', 'Urban Airship']
  }
]

$(function () {
  console.log('ready!')
  var eventDetails = window.eventDetails = new EventRsvpCollection()
  var dashboard = new GUI(eventDetails, '.backbone')
  // $('#companysearch').submit(function (e) {
  //   $('.preloader').fadeIn(300)
  //   var url = window.location.origin + '/company/' + $('#companysearchval').val().replace(/ /g, '+')
  //   console.log('url: ', url)
  //   // $.ajax(url)
  //   window.location.assign(url)
  //   e.preventDefault()
  //   // custom handling here
  // })
})
