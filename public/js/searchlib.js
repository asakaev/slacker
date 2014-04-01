var liveurl = "/api?q=",
	searchurl = "/api?q=";

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
				if(data == ""){return;}
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
	$("#searchText").val(content);
	$('.logo-big').css("display", "none");
	$('#search').css({'width': '50%',
	'position': 'fixed',
	'top': '5%', 'margin-top':'0'})
	$(".searchresult").css({"display":"none"});

})
// function autocomplete( textBoxId, containerDivId ) {
//     var ac = this;
//     this.textbox     = $(textBoxId);
//     this.ul         = $(containerDivId);
//     this.list        = this.ul.find('li');
//     this.pointer     = null;

//     this.textbox.onkeydown = function( e ) {
//         e = e || window.event;
//         switch( e.keyCode ) {
//             case 38: //up
//                 ac.selectDiv(-1);
//                 break;
//             case 40: //down
//                 ac.selectDiv(1);
//                 break;
//         }
//     }

//     this.selectDiv = function( inc ) {
//         if( this.pointer !== null && this.pointer+inc >= 0 && this.pointer+inc < this.list.length ) {
//             this.list[this.pointer].className = '';
//             this.pointer += inc;
//             this.list[this.pointer].className = 'active';
//             this.textbox.value = this.list[this.pointer].innerHTML;
//         }
//         if( this.pointer === null ) {
//             this.pointer = 0;
//             this.list[this.pointer].className = 'active';
//             this.textbox.value = this.list[this.pointer].innerHTML;
//         }
//     }
// } 
