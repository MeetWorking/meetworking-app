/* globals $, SearchResultCollection, GUI */

var sample = [
  {
    eventid: '225087542',
    groupid: '6063792',
    groupname: 'PDX Tech + Pong',
    title: 'October [BOOO!!!!] Pong at AltSource in SE Portland',
    description: 'A description',
    location: 'AppNexus',
    datetime: '10/28/2015 06:00:00 PM',
    status: 'upcoming',
    rsvps: 64,
    spotsleft: 16,
    meetworkers: 5,
    recruiters: 1,
    displaystatus: 'Recommended',
    searchuids: [
      {
        searchuid: 1,
        searchmemberid: 191451910,
        rsvpstatus: '',
        companymatch: 1,
        employeematch: 1,
        searchcompany: 'AppNexus',
        logourl: ''
      },
      {
        searchuid: 2,
        searchmemberid: 191451910,
        rsvpstatus: '',
        companymatch: 0,
        employeematch: 1,
        searchcompany: 'Urban Airship',
        logourl: ''
      }
    ]
  },
  {
    eventid: '225289207',
    groupid: '371269',
    groupname: 'Portland New and Not So New In Town',
    title: 'Masquerade Ball',
    description: 'B description',
    location: 'Oaks Park Dance Pavilion',
    datetime: '10/29/2015 07:00:00 PM',
    status: 'upcoming',
    rsvps: 139,
    spotsleft: null || '?',
    meetworkers: 4,
    recruiters: 2,
    displaystatus: 'Recommended',
    searchuids: [
      {
        searchuid: 3,
        searchmemberid: 191451910,
        rsvpstatus: '',
        companymatch: 0,
        employeematch: 1,
        searchcompany: 'New Relic',
        logourl: ''
      }
    ]
  },
  {
    eventid: 'qnlqblytpbhb',
    groupid: '6693792',
    groupname: 'PDXnode',
    title: 'PDXNode Presentation Night',
    description: 'C description',
    location: 'NEW Urban Airship offices',
    datetime: '10/30/2015 08:00:00 PM',
    status: 'upcoming',
    rsvps: 26,
    spotsleft: null || '?',
    meetworkers: 2,
    recruiters: 0,
    displaystatus: 'Recommended',
    searchuids: [
      {
        searchuid: 1,
        searchmemberid: 191451910,
        rsvpstatus: '',
        companymatch: 0,
        employeematch: 1,
        searchcompany: 'AppNexus',
        logourl: ''
      },
      {
        searchuid: 2,
        searchmemberid: 191451910,
        rsvpstatus: '',
        companymatch: 1,
        employeematch: 0,
        searchcompany: 'Urban Airship',
        logourl: ''
      }
    ]
  }
]

$(function () {
  console.log('ready!')
  var searchResults = new SearchResultCollection()
  var dashboard = new GUI(searchResults, '.backbone')
  function newGroupModal () {
    console.log('newGroupModal triggered')
    $('#newGroupModal').modal('show')
  }
})
