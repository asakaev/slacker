$(document).ready(function() {
    focusOn("searchText");
});
function focusOn(elem) {
	if (!("autofocus" in $(elem))) {
      $(elem).focus();
    }
}
function toggleLogo(){
	if ($('.logo-big').css('display') == "none")
	{
		$('.logo-big').css({"display":"block"});
		$('.logo-small').css({"display":"none"});
	}
	if ($('.logo-big').css('display') == "block")
	{
		$('.logo-big').css({"display":"none"});
		$('.logo-small').css({"display":"block"});
	}	
}
function changeState(numOfState){
	if(numOfState == 0){

	}
	if(numOfState == 1){
		$('.logo-big').css("display", "none");
		$('#search').css({'width': '50%',
		'position': 'fixed',
		'top': '5%', 'margin-top':'0'})
		$(".searchresult").css({"display":"none"});
		$("content").css({"display":"none"});
		$(".content_ul").empty();
	}
}