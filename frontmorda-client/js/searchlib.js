var liveurl = "http://192.168.123.115/test?q=",
	searchurl = "http://192.168.123.115/test3?q=";

var Search = {
	liveSearch : function(str){
		if (str.length==0){ 
			$(".searchresult").css({"display":"none"});
			return;
		}
		$.ajax({
			// dataType: "JSON",
			type: "get",
			url: liveurl+str,
			
			error : function(){
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data){
				// console.log(data.test);
				$(".searchresult_ul").empty();
				// $(".content").empty();
				$(".searchresult").css({"display": "block"});
				$.each(data, function(i,val){
					var listItem = "<li>"+val+"<b>"+i+"</b></li>"
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
			// data: str,
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
	// alert(content);
})