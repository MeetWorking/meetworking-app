/* globals $ */

$(document).ready(function () {
  // preloader
  $('.preloader').hide()
  $('#login').click(function () {
    $('.preloader').fadeIn(300)
  })
  $('.btn-company').click(function () {
    $('.preloader').fadeIn(300)
  })
})
