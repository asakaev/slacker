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