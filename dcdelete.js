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

var keyword = []; 
var keyword2 = [];
var ban = {};
var writers = []; 
var uids = [];
var ips = [];
var bugers = [];
var memory = [];

for (val of $('.gall_num')) {
	memory.push($(val).text());
}

var sec = 5; // 글삭 쿨타임

console.log("<delete mac v1>");

loadData();
setInterval(() => autoDel(),1000*sec);

function loadData() {
	fetch('https://raw.githubusercontent.com/YeonNaru/dcmac/main/config.json').then(res => res.json())
	.then((out) => {
		keyword = out["글삭"];
		keyword2 = out["알림키워드"];
		ban = out["밴"];
		bugers = out["버거지"];
		writers = out["알림"];
		uids = out["알림ID"];
		ips = out["알림IP"];
	}).catch(err => { throw err });
}

function autoDel() {
	$('.gall_list').load(location.href+' .gall_list');
	  
	for (list of $('.gall_writer')) {
	    var writer = $(list).attr('data-nick');
	    var tit = $($(list).parent().children('.gall_tit').children('a')[0]).text();
		var num = $(list).parent().children('.gall_num').text();
		var data_ip = $(list).attr('data-ip') || false;
		var uid = $(list).attr('data-uid');
		if (data_ip) {
			writer += (" ("+data_ip+")");
		}

		var ch_keyword = ch_word(keyword, tit);
		var ch_keyword2 = ch_word(keyword2, tit);
		var ch_bugers = ch_word(bugers, tit);
		var ch_ban = ch_word(Object.keys(ban), tit);

		var ch_writers = writers.includes(writer)
		var ch_uids = uids.includes(uid)
		var ch_ips = ips.includes(data_ip)

		if (!memory.includes(num)) {
			memory.push(num);
			if (ors([ch_keyword, ch_keyword2, ch_bugers, ch_ban, ch_writers, ch_uids,  ch_ips])) {
				var dataNo = $(list).parent()[0].getAttribute('data-no');
				var iconURL = $(list).find(".writer_nikcon").children("img")?.attr("src") || "";
				iconURL = changeImage(iconURL);
				if (!iconURL.includes("fix") && iconURL != "") {
					writer += (" ("+uid+")");
				}
				var gall_data = $(list).parent().find('.gall_date').attr('title');
				var embedData = {
					"title": tit,
					"description": "",
					"url": "https://gall.dcinside.com"+$(list).parent().children('.gall_tit').children('a').attr('href'),
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

				if(ch_ban) {
					embedData["description"] = "["+ch_ban+"] 사유: "+ban[ch_ban][1]+"기간: "+ban[ch_ban][0]+"시간";
					discord_embed(embedData,'차단 알림봇');
					banNum(dataNo, writer, tit, ban[ch_ban][0], ban[ch_ban][1], embedData);
				}
				else if (data_ip == '104.28') {
					embedData["description"] = "[VPN 차단] 104.28";
					discord_embed(embedData, '차단 알림봇');
					banNum(dataNo, writer, tit, 720, 'VPN 차단', embedData);
				}
				else if (ch_keyword) {
					embedData["description"] = "[글삭] " + ch_keyword;
					discord_embed(embedData, '글삭 알림봇');
					delNum(dataNo, tit, writer, embedData);
				}
				else if (ch_keyword2) {
					embedData["description"] = "[키워드] "+ch_keyword2;
					discord_embed(embedData,'키워드 알림봇');
				}
				else if (ch_bugers) {
					embedData["description"] = "[버거지 키워드] "+ch_bugers;
					discord_thread(embedData, '버거지 알림봇', '1044994571496591442');
				}
				else {
					discord_embed(embedData, '유저 알림봇');
				}
			}
		}
	}
}

function ch_word(words, text) {
	var check = false;
	for (word of words) {
		if (text.includes(word)) {
			check = word;
		}
	}
	return check;
}

function ors(array) {
	for (val of array) {
		if (val) {
			return true;
		}
	}
	return false;
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

function discord_embed(embedData, name) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", 'https://discord.com/api/webhooks/1044621451564691476/CkbVGUnriZUAVKYerO6-wy_vH4zJiaJGzWDSvo1uscFsOXBYYF2xCE04UyrVHqv-uoXr', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		'username':name,
		'avatar_url': 'https://github.com/YeonNaru/dcmac/blob/main/icons/misora.png?raw=true',
		'embeds': [embedData]
	}));
}

function discord_thread(embedData, name, threadID) {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", 'https://discord.com/api/webhooks/1044621451564691476/CkbVGUnriZUAVKYerO6-wy_vH4zJiaJGzWDSvo1uscFsOXBYYF2xCE04UyrVHqv-uoXr?thread_id='+threadID, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({
		'username':name,
		'avatar_url': 'https://github.com/YeonNaru/dcmac/blob/main/icons/misora.png?raw=true',
		'embeds': [embedData]
	}));
}

function changeImage(url) {
	if (!url) { return ""; }
	var urlSplit = url.split("/");
	var fileName = urlSplit[urlSplit.length-1];
	return "https://github.com/YeonNaru/dcmac/blob/main/icons/"+fileName+"?raw=true";
}