/* globals $ */

$(document).ready(function () {
  // preloader
  $('.preloader').hide()
  $('#login').click(function () {
    $('.preloader').fadeIn(300)
  })
  // $(window).load(function () {
  //   $('.preloader').delay(400).fadeOut(500)
  // })
})
