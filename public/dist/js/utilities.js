function focusOn(e){"autofocus"in $(e)||$(e).focus()}function toggleLogo(){"none"==$(".logo-big").css("display")&&($(".logo-big").css({display:"block"}),$(".logo-small").css({display:"none"})),"block"==$(".logo-big").css("display")&&($(".logo-big").css({display:"none"}),$(".logo-small").css({display:"block"}))}function changeState(e){0==e&&($(".logo-big").css({display:"block"}),$("#search").css({width:"50%",position:"relative",margin:"0 auto",top:"50%"}),$(".searchresult").css({display:"none"}),$("#content").css({display:"none"}),$(".content_ul").empty(),$("#header").css({"background-color":"#FFF"})),1==e&&($(".logo-big").css("display","none"),$("#search").css({width:"50%",position:"absolute",top:"14px","margin-top":"0","margin-left":"14px"}),$(".searchresult").css({display:"none"}),$("#content").css({display:"block"}),$("#header").css({"background-color":"#F0F0F0"}),$(".content_ul").empty())}function detectKeys(e){var s=$(".searchresult_ul").find("li.selected").first();if(38==e.which)0==s.text().length?s=$(".searchresult_ul").find("li").last():(s.removeClass("selected"),s=s.prev()),$("#searchText").value=$("#searchText").value,console.log("fired"),$("#searchText").val(s.text()),s.toggleClass("selected");else if(40==e.which)0==s.text().length?s=$(".searchresult_ul").find("li").first():(s.removeClass("selected"),s=s.next()),$("#searchText").val(s.text()),s.addClass("selected");else if(13==e.which){var t=$("#searchText").val();Search.simpleSearch(t),History.pushState(null,null,"search?="+t),$("#searchText").blur()}}function authInfo(e){console.log(e.session?"user: id"+e.session.mid:"not auth")}$(document).ready(function(){focusOn("searchText")}),$(".searchresult").on("mouseenter",".searchresult_ul li",function(){$(this).addClass("selected")}),$(".searchresult").on("mouseleave",".searchresult_ul li",function(){$(this).removeClass("selected")}),History.Adapter.bind(window,"statechange",function(){var e=History.getState(),s=e.hash.substring(9,e.hash.length);$("#searchText").val(s),""!==s?Search.simpleSearch(s):changeState(0)}),VK.init({apiId:4323440}),VK.Auth.getLoginStatus(authInfo);