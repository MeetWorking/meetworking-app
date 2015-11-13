/* globals $ */

$(document).ready(function () {
  // preloader
  $('.preloader').hide()
  $('#login, .btn-company, #profileupdate').click(function () {
    $('.preloader').fadeIn(300)
  })
  // $('.btn-company').click(function () {
  //   $('.preloader').fadeIn(300)
  // })
  // $('#profileupdate').click(function () {
  //   $('.preloader').fadeIn(300)
  // })
})
