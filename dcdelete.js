// 5초(기본)마다 새로고침 되면서 글삭함
// 차단 기간 (수정 금지)
var hour = {
	"1시간": 1,
	"6시간": 6,
	"1일": 24,
	"7일": 168,
	"14일": 336,
	"30일": 720
};

// 글삭 키워드
var keyword = [
	"아리스가와",
	"오토메 갤",
	"오토메갤"
]; 

// 밴 키워드 : [차단기간, 차단사유]
var ban = {
	"치요코케이크":[hour["30일"], "닉언"],
	"대천사아쿠아":[hour["30일"], "닉언"],
	"아히나":[hour["30일"], "닉언"]
};

// 글 알림 닉네임
var writers = [
	"misora",
	"Ether"
]; 
var memory = [];

for (val of $('.gall_num')) {
	memory.push($(val).text());
}

var sec = 5; // 글삭 쿨타임

console.log("<delete mac>");

setInterval(() => autoDel(),1000*sec);

function autoDel() {
	$('.gall_list').load(location.href+' .gall_list');
	console.log('<page load>');
	
	var list = $('.gall_writer');
	  
	for(var i=0; i<list.length; i++) {
	    var writer = $(list[i]).attr('data-nick');
	    var tit = $($(list[i]).parent().children('.gall_tit').children('a')[0]).text();
		var num = $(list[i]).parent().children('.gall_num').text();

		if (writers.includes(writer)) {
			if(!memory.includes(num)) {
				memory.push(num);
				var embedData = {
					"title": tit,
					"url": "https://gall.dcinside.com"+$(list[i]).parent().children('.gall_tit').children('a').attr('href'),
					"color": 13742847,
					"author": {
						"name": writer,
						"url": "https://gallog.dcinside.com/"+$(list[i]).attr('data-uid'),
						"icon_url": "https://nstatic.dcinside.com/dc/w/images/fix_nik.gif"
					}
				};
				discord_embed(embedData);
			}
		}

	    for (key of keyword) {
	    	if(tit.includes(key)) {
	    		var dataNo = $(list[i]).parent()[0].getAttribute('data-no');
		    	delNum(dataNo, tit, writer);
		    	return;
	    	}
	    }
	    
	    for (key of Object.keys(ban)) {
	    	if(tit.includes(key)) {
	    		var dataNo = $(list[i]).parent()[0].getAttribute('data-no');
	    		banNum(dataNo, writer, tit, ban[key][0], ban[key][1]);
	    		break;
	    	}
	    }
	}
}

function delNum(no, tit, writer) {
  var allVals = Array();
  allVals.push(no);
  
  $.ajax({
      type : "POST",
      url : "/ajax/"+ get_gall_type_name() +"_manager_board_ajax/delete_list",
      data : { 'ci_t': get_cookie('ci_c'), 'id': $.getURLParam('id'), 'nos': allVals ,_GALLTYPE_: _GALLERY_TYPE_ },
  dataType : 'json',
      cache : false,
      async : false,
      success : function(ajaxData) {
    if(typeof(ajaxData.msg) != 'undefined' && ajaxData.msg) {
       //alert(ajaxData.msg);
    }

    if(ajaxData.result == "success") {
      console.log("'"+tit+"' 삭제 완료. ("+writer+")");
      $('.gall_list').load(location.href+' .gall_list');
    }
      },
      error : function(data) {
         console.log('시스템 오류.');
      }
  });
}

function banNum(no, writer, tit, avoid_hour, avoid_reason_txt) {
	var allVals = Array();
	allVals.push(no);
	
	var parent = null;
	var avoid_reason = 0;
	var del_chk = 1;

    $.ajax({
	    type : "POST",
	    url : "/ajax/"+ get_gall_type_name() +"_manager_board_ajax/update_avoid_list",
	    data : { ci_t : get_cookie('ci_c'), id: $.getURLParam('id'), nos : allVals, parent: parent, avoid_hour : avoid_hour, avoid_reason : avoid_reason, avoid_reason_txt : avoid_reason_txt, del_chk : del_chk ,_GALLTYPE_: _GALLERY_TYPE_ },
		dataType : 'json',
	    cache : false,
	    async : false,
	    success : function(ajaxData) {
	    	console.log("'"+tit+"' 삭제&차단 완료. ("+writer+")");
		    $('.gall_list').load(location.href+' .gall_list');
	    },
	    error : function(ajaxData) {
	       alert('시스템 오류로 작업이 중지되었습니다. 잠시 후 다시 이용해 주세요.');
	    }
	});
}

function discord_embed(embedData) {
	var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://discord.com/api/webhooks/1044621451564691476/CkbVGUnriZUAVKYerO6-wy_vH4zJiaJGzWDSvo1uscFsOXBYYF2xCE04UyrVHqv-uoXr', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		'username':'유저 알림봇',
		'avatar_url': 'https://github.com/YeonNaru/dcmac/blob/main/misora.png?raw=true',
		'embeds': [embedData]
	}));
}