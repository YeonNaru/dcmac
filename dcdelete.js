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
	"Ether",
	"올트리오",
	"셀리아",
	"듀나단",
	"대천사아쿠아",
	"아히나",
	"아이카츠무기",
	"멍청한카스미"
]; 

// 글 알림 ID (반고닉용)
var uids = [
	"redivehole"
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
		var data_ip = $(list[i]).attr('data-ip') || false;
		var uid = $(list[i]).attr('data-uid');
		if (data_ip) {
			writer += (" ("+data_ip+")");
		}

		if (writers.includes(writer) || uids.includes(uid)) {
			if(!memory.includes(num)) {
				memory.push(num);
				var iconURL = $(list[i]).find(".writer_nikcon").children("img").attr("src") || "";
				if (!iconURL.includes("fix") && iconURL != "") {
					writer += (" ("+uid+")");
				}
				var gall_data = $(list[i]).parent().find('.gall_date').attr('title');
				var embedData = {
					"title": tit,
					"url": "https://gall.dcinside.com"+$(list[i]).parent().children('.gall_tit').children('a').attr('href'),
					"color": 13742847,
					"author": {
						"name": writer,
						"url": "https://gallog.dcinside.com/"+uid,
						"icon_url": iconURL
					},
					"footer": {
						"text": gall_data
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
		discord_message("'"+tit+"' 삭제 완료 ("+writer+")");
		$('.gall_list').load(location.href+' .gall_list');
      },
      error : function(data) {
		discord_message("'"+tit+"' 삭제 실패 ("+writer+")");
		$('.gall_list').load(location.href+' .gall_list');
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
		discord_message("'"+tit+"' 삭제&차단 완료 ("+writer+")");
		$('.gall_list').load(location.href+' .gall_list');
      },
      error : function(data) {
		discord_message("'"+tit+"' 삭제 실패 ("+writer+")");
		$('.gall_list').load(location.href+' .gall_list');
      }
	});
}

function discord_message(message) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://discord.com/api/webhooks/1043800408230998026/ifaCB1Qbu1ocF5Zkz0JtCPlJFHQaqg6DSsX6_i1pUziD_HeftBhWnPTjaUVpUPO7XFdq', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        'content': message,
        'username':'시진핑',
        'avatar_url': 'https://redive.estertion.win/icon/unit/123031.webp',
    }));
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