var liveurl = "/api?q=",
  	searchurl = "/api?q=";

var Search = {
	liveSearch : function(str) {
		$('.content_ul').empty();
		if (str.length == 0) { 
			$(".searchresult").css({"display":"none"});
			return;
		}
		
		$.ajax({
			dataType: "JSON",
			type: "get",
			url: liveurl+str,
			error : function() {
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data) {
				data = $.parseJSON(JSON.stringify(data));
				if(data == "") {
					$(".searchresult").css({"display":"none"});
					$(".searchresult_ul").empty();
					return;
				}
				$(".searchresult_ul").empty();
				// $(".content").empty();
				$(".searchresult").css({"display": "block"});
				$.each(data, function(i,val){
					if(val.vacancy[i] == val.vacancy[i++]){
						console.log(val.vacancy + " has same results")
					}
					if(val.vacancy!==null){
						Start = val.vacancy.substring(0, $('#searchText').val().length);
						End = val.vacancy.substring($('#searchText').val().length, val.vacancy.length);
						if($('#searchText').val().toLowerCase() == Start.toLowerCase())
						{
						 	var listItem = "<li>"+Start+End.bold()+"</li>";
							$(".searchresult_ul").append(listItem);;
						}
					}
					
				})
				
			}
		})
		
	},
	simpleSearch : function(str) {
		if (str.length == 0) {
			return;
		};
		changeState(1);
		$.ajax({
			dataType: "JSON",
			type: "get",
			url: liveurl+str,
			error : function() {
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data) {

				data = $.parseJSON(JSON.stringify(data));
				if(data == "") {
					return;
				}
				$(".content_ul").empty();
				// $(".content").empty();
				$("content").css({"display": "block"});
				$.each(data, function(i,val) {
					var listItem = "<li><div class = \"vacancy\">"+val.vacancy+"</div><div class = \"description\"> Условия работы: "+val.text+"<br> Телефон: " + val.tel + "</div></li>";
					$(".content_ul").append(listItem);
				})
				
			}
		})

	}
}
$("#search").on("click", function() {
	var query = $(this).val();
	Search.simpleSearch(query);
})
$(".searchresult").on("click", ".searchresult_ul li", function() {
	var q = $(this).text(),
		//pageurl = liveurl + "#" + content;
	pageurl = '?search=' + q;
	$("#searchText").val(q);
	Search.simpleSearch(q);
	History.pushState(null, null, pageurl);	
})

$('#searchText').on('input', function() {
	var query = $(this).val();
	Search.liveSearch(query); //runs the ajax request

});
$('#searchText').on('keydown', detectKeys );