var liveurl = "http://localhost:3000/myjson?callback=?&q=",
	searchurl = "http://localhost:3000/myjson?callback=?&q=";

var Search = {
	liveSearch : function(str){
		if (str.length==0){ 
			$(".searchresult").css({"display":"none"});
			return;
		}

		var path = "http://localhost:3000/bdjson?q=" + str + "&callback=?";
		$.getJSON(path, function(data) {
			$(".searchresult_ul").empty();
			// $(".content").empty();
			$(".searchresult").css({"display": "block"});
			$.each(data, function(i,val){
				console.log(data[i].name);
				var listItem = "<li>"+val+"<b>"+i+"</b></li>"
				$(".searchresult_ul").append(data[i].name + ' ');
			})
		});
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

})