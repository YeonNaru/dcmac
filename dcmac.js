// 념글 페이지 띄워놓으면 5초(기본)마다 새로고침 되면서 천안문 함
var name = []; 
var memory = [];

var exSub = ["AD", "설문", "공지"];
for (val of $('.gall_num')) {
	var subject = $(val).parent().children(".gall_subject").text();
	if (!exSub.includes(subject)) {
		memory.push($(val).text());
	}
}

var min = 50; // 통차 쿨타임 (분 단위)
var sec = 5; // 천안문 쿨타임 (초 단위)

discord_message("매크로가 작동중입니다.");

loadData();
cellularAvoid();
setInterval(() => autoCut(),1000*sec);
setInterval(() => cellularAvoid(),1000*60*min);

function loadData() {
	fetch('https://raw.githubusercontent.com/YeonNaru/dcmac/main/config.json').then(res => res.json())
	.then((out) => {
		name = out["천안문"];
	}).catch(err => { throw err });
}

function autoCut() {
	$('.gall_list').load(location.href+' .gall_list');
	console.log('<page load>');

	var list = $('.gall_writer');
	for (var i=0; i<list.length; i++) {
	    var writer = $(list[i]).attr('data-nick');
		var tit = $($(list[i]).parent().children('.gall_tit').children('a')[0]).text();
		var num = $(list[i]).parent().children('.gall_num').text();
		var data_ip = $(list[i]).attr('data-ip') || false;
		var uid = $(list[i]).attr('data-uid');
		if (data_ip) {
			writer += (" ("+data_ip+")");
		}

		if (!memory.includes(num)) {
			var subject = $(list[i]).parent().children(".gall_subject").text();
			if (exSub.includes(subject)) {
				continue;
			}
			if (Math.min.apply(null, memory) > num) {
				if (!name.includes(writer) || tit.includes('`')) {
					memory.push(num);
					continue;
				}
			}
			memory.push(num);
			var iconURL = $(list[i]).find(".writer_nikcon").children("img").attr("src") || "";
			iconURL = changeImage(iconURL);
			if (!iconURL.includes("fix") && iconURL != "") {
				writer += (" ("+uid+")");
			}
			var gall_data = $(list[i]).parent().find('.gall_date').attr('title');
			var embedData = {
				"title": "✪ "+tit,
				"description": "",
				"url": "https://gall.dcinside.com"+$(list[i]).parent().children('.gall_tit').children('a').attr('href'),
				"color": 16770048,
				"author": {
					"name": writer,
					"url": "https://gallog.dcinside.com/"+$(list[i]).attr('data-uid'),
					"icon_url": iconURL
				},
				"footer": {
					"text": gall_data
				}
			};
			if (name.includes(writer) && !tit.includes('`')) {
	    		var dataNo = $(list[i]).parent()[0].getAttribute('data-no');
	    		update_recom_C('REL', dataNo, tit, writer, embedData);
			}
			else {
				discord_embed(embedData);
			}
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
			embedData["description"] = "[매크로] 개념글 해제 완료"
			discord_embed(embedData);
        	$('.gall_list').load(location.href+' .gall_list');
        },
        error : function(ajaxData) {
			embedData["description"] = "[매크로] 개념글 해제 실패 (오류)"
			discord_embed(embedData);
        	$('.gall_list').load(location.href+' .gall_list');
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
		'avatar_url': 'https://github.com/YeonNaru/dcmac/blob/main/icons/star_big.png?raw=true',
		'embeds': [embedData]
	}));
}

function changeImage(url) {
	var urlSplit = url.split("/");
	var fileName = urlSplit[urlSplit.length-1];
	return "https://github.com/YeonNaru/dcmac/blob/main/icons/"+fileName+"?raw=true";
}