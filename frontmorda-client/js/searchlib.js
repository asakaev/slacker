var liveurl = "http://dev.vf8.ru/api?q=",
	searchurl = "http://dev.vf8.ru/api?q=";

var Search = {
	liveSearch : function(str){
		if (str.length==0){ 
			$(".searchresult").css({"display":"none"});
			return;
		}
		$.ajax({
			dataType: "JSONP",
			type: "get",
			url: liveurl+str,
			error : function(){
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data){
				data = $.parseJSON(JSON.stringify(data));
				$(".searchresult_ul").empty();
				// $(".content").empty();
				$(".searchresult").css({"display": "block"});
				$.each(data, function(i,val){
					var listItem = "<li>"+val.name+"</li>";
					$(".searchresult_ul").append(listItem);
				})
				
			}
		})
	},
	simpleSearch : function(str){
		if (str.length==0){
			return;
		}
		$.ajax({
			dataType: "JSONP",
			type: "get",
			url: searchurl+str,
			error : function(){
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
			},
			success : function(data){
				$(".searchresult").css({"display":"none"});
				$(".content").append(data);
			}
		})

	}
}
$("#search").on("click", function(){
	var request = $("#searchText").val();
	Search.simpleSearch(request);
})
$(".searchresult").on("click", ".searchresult_ul li", function(){
	var content = $(this).text();
	content = content.substring(0, content.length - 3);
	$("#searchText").val(content);
	$(".searchresult").css({"display":"none"});

})