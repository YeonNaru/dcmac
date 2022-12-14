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

var memory = [];

for (val of $('.gall_num')) {
	memory.push($(val).text());
}

var sec = 5; // 글삭 쿨타임
var sec_count = 0;

console.log("<delete mac v1>");

setInterval(() => loop(), 1000 * sec);

function loop() {
	try {
		autoDel();
	} catch (e) {
		discord.log('dcdelete_autoDel', e + '');
	}
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
		var ch_ban_id = false;
		if (uid) {
			ch_ban_id = ch_word(Object.keys(ban_id), uid);
        }
		var ch_ban_ip = Object.keys(ban_ip).includes(data_ip);

		var ch_writers = writers.includes(writer)
		var ch_uids = uids.includes(uid)
		var ch_ips = ips.includes(data_ip)

		if (!memory.includes(num)) {
			memory.push(num);
			if (ors([ch_keyword, ch_keyword2, ch_bugers, ch_ban, ch_writers, ch_uids, ch_ips, ch_ban_ip, ch_ban_id])) {
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
					embedData["description"] = "[" + ch_ban + "]\n사유: " + ban[ch_ban][1] + "\n기간: " + ban[ch_ban][0] + "시간";
					discord.misora('차단 알림봇', embedData);
					banNum(dataNo, writer, tit, ban[ch_ban][0], ban[ch_ban][1]);
				}
				else if (ch_ban_ip) {
					embedData["description"] = "[IP 차단]\nIP: " + data_ip + "\n사유: " + ban_ip[data_ip][1] + "\n기간: " + ban_ip[data_ip][0] + "시간";
					discord.misora('차단 알림봇', embedData);
					banNum(dataNo, writer, tit, ban_ip[data_ip][0], ban_ip[data_ip][1]);
				}
				else if (ch_ban_id) {
					embedData["description"] = "[ID 차단]\nID: " + ch_ban_id + "\n사유: " + ban_id[ch_ban_id][1] + "\n기간: " + ban_id[ch_ban_id][0] + "시간";
					discord.misora('차단 알림봇', embedData);
					banNum(dataNo, writer, tit, ban_id[ch_ban_id][0], ban_id[ch_ban_id][1]);
				}
				else if (ch_keyword) {
					embedData["description"] = "[글삭] " + ch_keyword;
					discord.misora('글삭 알림봇', embedData);
					delNum(dataNo, tit, writer);
				}
				else if (ch_keyword2) {
					embedData["description"] = "[키워드] "+ch_keyword2;
					discord.misora('키워드 알림봇', embedData);
				}
				else if (ch_bugers) {
					embedData["description"] = "[버거지 키워드] " + ch_bugers;
					discord.misora('버거지 알림봇', embedData, '1044994571496591442');
				}
				else {
					discord.misora('유저 알림봇', embedData);
				}
			}
		}
	}

	sec_count++;
	if (sec_count >= 12) {
		sec_count = 0;
		discord.log('dcdelete', '12회 루프 성공 (1분)');
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
		success: function (ajaxData) {
			discord.log('dcdelete', "'" + tit + "' 삭제 성공 (" + writer + ")");
			$('.gall_list').load(location.href+' .gall_list');
		},
		error : function(data) {
			discord.log('dcdelete', "'"+tit+"' 삭제 실패 ("+writer+")");
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
		success: function (ajaxData) {
			discord.log('dcdelete', "'" + tit + "' 차단 성공 (" + writer + ")");
			$('.gall_list').load(location.href+' .gall_list');
		 },
		error : function(data) {
			discord.log('dcdelete', "'" + tit + "' 차단 실패 (" + writer + ")");
			$('.gall_list').load(location.href+' .gall_list');
		}
	});
}

function changeImage(url) {
	if (!url) { return ""; }
	var urlSplit = url.split("/");
	var fileName = urlSplit[urlSplit.length-1];
	return "https://github.com/YeonNaru/dcmac/blob/main/icons/"+fileName+"?raw=true";
}