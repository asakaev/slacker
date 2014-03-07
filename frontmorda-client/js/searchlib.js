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
				$(".depresult_ul").empty();
				$(".divresult_ul").empty();
				$(".peopleresult_ul").empty();
				// console.log(data.test);
				$.each(data, function(type,val){
					$.each(val, function(i,key){
						// var listItem = "<li>"+key+"<b>"+i+"</b></li>"
						// $(".searchresult_ul").append(listItem);
						if (type == "deps"){
							depli = "<li><div class = \"rtitle\"><a href = \"?p="+type+"&id="+i+"\">"+key+"</a></div> <div class = \"rdescription\"> THIS IS <b>"+type+"</b>! </div> </li>"; 
							$(".depresult_ul").append(depli); 
						}
						if (type == "divs"){
							divli = "<li><div class = \"rtitle\"><a href = \"?p="+type+"&id="+i+"\">"+key+"</a></div> <div class = \"rdescription\"> THIS IS <b>"+type+"!</b> </div> </li>"; 
							$(".divresult_ul").append(divli);
						}
						if (type == "fio"){
							fioli = "<li><img src = '/pics/man.png'><a href = \"http://192.168.123.115/test2?q="+type+"&id="+i+"\">"+key+"</a></li>";
							$(".peopleresult_ul").append(fioli);
						}
						// console.log(key);
					})
				});
				$(".content").append(data);
			}
		})

	}
}
$("#search").on("click", function(){
	var request = $("#searchText").val();
	Search.simpleSearch(request);
})
$(".searchresult").on("click", ".searchresult_ul li",function(){
	var content = $(this).text();
	content = content.substring(0, content.length - 3);
	$("#searchText").val(content);
	$(".searchresult").css({"display":"none"});
	// alert(content);
})