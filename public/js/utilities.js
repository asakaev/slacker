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
		$('.logo-big').css({"display" : "block"});
		$('#search').css({'width': '50%', 'position':'relative', 'margin':'0 auto', 'top':'50%'});
		$(".searchresult").css({"display":"none"});
		$("#content").css({"display":"none"});
		$(".content_ul").empty();
		$("#header").css({"background-color": "#FFF"});
	}
	if(numOfState == 1){
		$('.logo-big').css("display", "none");
		$('#search').css({'width': '50%',
		'position': 'absolute',
		'top': '14px', 'margin-top':'0', 'margin-left':'14px'})
		$(".searchresult").css({"display":"none"});
		$("#content").css({"display":"block"});
		$("#header").css({"background-color": "#F0F0F0"});
		$(".content_ul").empty();
	}
}
function detectKeys(e) {
	var curr = $('.searchresult_ul').find('li.selected').first();

	// e.preventDefault();
	if (e.which == 38) {
		if(curr.text().length == 0){
			curr = $('.searchresult_ul').find('li').last();
		} else {
			curr.removeClass('selected');
			curr = curr.prev();
		}
		$('#searchText').value  = $('#searchText').value;
		console.log('fired');
    	$('#searchText').val(curr.text());
    	curr.toggleClass('selected');
    	//up - prev
    }
    else if (e.which == 40) {
    	if(curr.text().length == 0){
			curr = $('.searchresult_ul').find('li').first();
		} else {
			curr.removeClass('selected');
			curr = curr.next();
		}
    	$('#searchText').val(curr.text());		
    	curr.addClass('selected');
    	//down - next
    }
    else if (e.which == 13) {
		var q = $('#searchText').val();
		Search.simpleSearch(q);
		History.pushState(null, null, "search?=" + q);
		$('#searchText').blur();
    }
}
$(".searchresult").on("mouseenter", ".searchresult_ul li", function() {
 	$(this).addClass('selected');
})
$(".searchresult").on("mouseleave", ".searchresult_ul li", function() {
 	$(this).removeClass('selected');
})
History.Adapter.bind(window, 'statechange', function(){
	var State = History.getState(),
		newQuery = State.hash.substring(9, State.hash.length);
	$('#searchText').val(newQuery);
	if(newQuery!==''){
		Search.simpleSearch(newQuery);	
	} else {
		changeState(0);
	}
})


VK.init({
  apiId: 4323440
});
function authInfo(response) {
  if (response.session) {
    console.log('user: id'+response.session.mid);
  } else {
    console.log('not auth');
  }
}
VK.Auth.getLoginStatus(authInfo);