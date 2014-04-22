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
					var listItem = "<li>"+val.vacancy+"</li>";
					$(".searchresult_ul").append(listItem);
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
					var listItem = "<li><div class = \"vacancy\"><a href = \"#\">"+val.vacancy+"</a></div><div class = \"description\">"+val.text+"</div></li>";
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
	var content = $(this).text(),
		pageurl = liveurl + content;
	$("#searchText").val(content);
	Search.simpleSearch(content);
	History.pushState(null, null, pageurl);	
})

$('#searchText').on('input', function() {
	var query = $(this).val();
	Search.liveSearch(query);

});
$('#searchText').on('keydown', detectKeys );
