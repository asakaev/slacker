var liveurl = "/api?q=",
	searchurl = "/api?q=";

var Search = {
	liveSearch : function(str){
		$('.content_ul').empty();
		console.log('should b empty!');
		if (str.length==0){ 
			$(".searchresult").css({"display":"none"});
			return;
		}
		$.ajax({
			dataType: "JSON",
			type: "get",
			url: liveurl+str,
			error : function(){
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data){
				data = $.parseJSON(JSON.stringify(data));
				if(data == ""){
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
	simpleSearch : function(str){
		if (str.length==0){
			return;
		};
		changeState(1);
		$.ajax({
			dataType: "JSON",
			type: "get",
			url: liveurl+str,
			error : function(){
				$(".errorlog").empty();
				$(".errorlog").append("Server is not responding.");
				return;
			},
			success : function(data){

				data = $.parseJSON(JSON.stringify(data));
				if(data == ""){
					$(".searchresult").append("По вашему запросу ничего не найдено.");
					return;
				}
				$(".content_ul").empty();
				// $(".content").empty();
				$("content").css({"display": "block"});
				$.each(data, function(i,val){
					var listItem = "<li><div class = \"vacancy\"><a href = \"#\">"+val.vacancy+"</a></div><div class = \"description\">"+val.text+"</div></li>";
					$(".content_ul").append(listItem);
				})
				
			}
		})

	}
}
$("#search").on("click", function(){
	var request = $("#searchText").val();
	Search.simpleSearch(request);
})
$(".searchresult").on("click", ".searchresult_ul li", function(){
	var content = $(this).text(),
		pageurl = liveurl + content;
	$("#searchText").val(content);
	Search.simpleSearch(content);
	if(pageurl!=window.location){
        window.history.pushState({path:pageurl},'',pageurl);
    }
	


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
$('#searchText').on('input', function(){
	Search.liveSearch(this.value);

});
$('#searchText').on('keydown', function(e){
	if (e.keyCode == 13){
		e.preventDefault();
		Search.simpleSearch($('#searchText').val());
	}
});

// , ontextinput=''