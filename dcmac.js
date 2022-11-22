// 념글 페이지 띄워놓으면 5초(기본)마다 새로고침 되면서 천안문 함

// 천안문 할 유저 닉네임
var name = [
	"프린세스페코린느",
	"대천사아쿠아",
	"Ether",
	"페롱"
]; 
var min = 50; // 통차 쿨타임 (분 단위)
var sec = 5; // 천안문 쿨타임 (초 단위)

var memory = [];

for (val of $('.gall_num')) {
	memory.push($(val).text());
}

discord_message("매크로가 실행되었습니다.")
cellularAvoid();
setInterval(() => autoCut(),1000*sec);
setInterval(() => cellularAvoid(),1000*60*min);

function autoCut() {
	$('.gall_list').load(location.href+' .gall_list');
	console.log('<page load>');

	var list = $('.gall_writer');
	for(var i=0; i<list.length; i++) {
	    var writer = $(list[i]).attr('data-nick');
		var tit = $($(list[i]).parent().children('.gall_tit').children('a')[0]).text();
		var num = $(list[i]).parent().children('.gall_num').text();
		var data-ip = $(list[i]).attr('data-ip') || false;
		if (data-ip) {
			writer += (" ("+data-ip+")");
		}

		if(!memory.includes(num)) {
			memory.push(num);
			var iconURL = $(list[i]).find(".writer_nikcon").children("img").attr("src") || "";
			var embedData = {
				"title": tit,
				"url": "https://gall.dcinside.com"+$(list[i]).parent().children('.gall_tit').children('a').attr('href'),
				"color": 13742847,
				"author": {
					"name": writer,
					"url": "https://gallog.dcinside.com/"+$(list[i]).attr('data-uid'),
					"icon_url": iconURL
				}
			};
			discord_embed(embedData);
		}
	    if(name.includes(writer)) {
	    	var dataNo = $(list[i]).parent()[0].getAttribute('data-no');
		if(tit.includes('`')) {continue;}
	    	update_recom_C('REL', dataNo, tit, writer);
	    	break;
	    }
	}
}

function update_recom_C(type, no, tit, nick) {
	var allVals = Array();
	allVals.push(no);

    $.ajax({
        type : "POST",
        url : "/ajax/"+ get_gall_type_name() +"_manager_board_ajax/set_recommend",
        data : {
        	ci_t : get_cookie('ci_c'),
        	id: $.getURLParam("id"),
        	nos : allVals,
        	_GALLTYPE_: _GALLERY_TYPE_,
        	mode: type
        },
		dataType : 'json',
        cache : false,
        async : false,
        success : function(ajaxData) {
			message = "'"+tit+"' 개념글 해제 완료 ("+nick+")";
        	console.log(message);
			discord_message(message);
        	$('.gall_list').load(location.href+' .gall_list');
        },
        error : function(ajaxData) {
           console.log('시스템 오류.');
        }
    });
}

function cellularAvoid(){
	$.ajax({
		type: "POST",
		url: "/ajax/managements_ajax/update_ipblock",
		data: { 'ci_t' : get_cookie('ci_c'), gallery_id : 'purikone_redive', _GALLTYPE_: "M", proxy_time : "2880", mobile_time : "60", proxy_use : 1, mobile_use : 1,img_block:"A",img_block_time:"",img_block_use:0	},
		dataType :	'json',
		//success : function() {discord_message('통피 차단 1시간 갱신.');},
		error : function() {discord_message('통피 차단 갱신 실패. (네트워크 오류)');}
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
		'username':'개념글 알림봇',
		'avatar_url': 'https://github.com/YeonNaru/dcmac/blob/main/misora.png?raw=true',
		'embeds': [embedData]
	}));
}
