// 념글 페이지 띄워놓으면 5초(기본)마다 새로고침 되면서 천안문 함
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
var sec_count = 0;

discord.log('dcmac', "매크로가 작동합니다.");

cellularAvoid();
setInterval(() => loop(autoCut), 1000 * sec);
setInterval(() => loop(cellularAvoid), 1000 * 60 * min);

function loop(f) {
    try {
        f();
    } catch (e) {
        discord.log('dcmac_autoCut', e + '');
    }
}

function autoCut() {
    $('.gall_list').load(location.href + ' .gall_list');

    for (list of $('.gall_writer')) {
        var writer = $(list).attr('data-nick');
        var tit = $($(list).parent().children('.gall_tit').children('a')[0]).text();
        var num = $(list).parent().children('.gall_num').text();
        var data_ip = $(list).attr('data-ip') || false;
        var uid = $(list).attr('data-uid');
        var checkName = writer;
        if (data_ip) {
            writer += (" (" + data_ip + ")");
        }

        if (!memory.includes(num)) {
            var subject = $(list).parent().children(".gall_subject").text();
            if (exSub.includes(subject)) {
                continue;
            }

            if (maxN(memory, memory.length - 10) > num) {
                if (!name.includes(writer) || tit.includes('`')) {
                    memory.push(num);
                    continue;
                }
                else if (maxN(memory, memory.length - 1) > num) {
                    memory.push(num);
                    continue;
                }
            }
            secMax = maxN(memory, 2);
            fiveMax = maxN(memory, 5);
            memory.push(num);
            var iconURL = $(list).find(".writer_nikcon").children("img")?.attr("src") || "";
            iconURL = changeImage(iconURL);
            if (!iconURL.includes("fix") && iconURL != "") {
                writer += (" (" + uid + ")");
            }
            var gall_data = $(list).parent().find('.gall_date').attr('title');
            var embedData = {
                "title": "✪ " + tit,
                "description": "",
                "url": "https://gall.dcinside.com" + $(list).parent().children('.gall_tit').children('a').attr('href'),
                "color": 16770048,
                "author": {
                    "name": writer,
                    "url": "https://gallog.dcinside.com/" + $(list).attr('data-uid'),
                    "icon_url": iconURL
                },
                "footer": {
                    "text": gall_data
                }
            };
            if (((name.includes(checkName) && secMax > num) && !tit.includes('`')) || (fiveMax > num && subject == "일반")) {
                var dataNo = $(list).parent()[0].getAttribute('data-no');
                update_recom_C('REL', dataNo, tit, writer, embedData);
                continue;
            }
            discord.star(embedData);
        }
    }

    sec_count++;
    if (sec_count >= 12) {
        sec_count = 0;
        discord.log('dcmac', '12회 루프 성공 (1분)');
    }
}

function update_recom_C(type, no, tit, nick, embedData) {
    var allVals = Array();
    allVals.push(no);

    $.ajax({
        type: "POST",
        url: "/ajax/" + get_gall_type_name() + "_manager_board_ajax/set_recommend",
        data: {
            ci_t: get_cookie('ci_c'),
            id: $.getURLParam("id"),
            nos: allVals,
            _GALLTYPE_: _GALLERY_TYPE_,
            mode: type
        },
        dataType: 'json',
        cache: false,
        async: false,
        success: function () {
            embedData["description"] = "[매크로] 개념글 해제 완료"
            discord.star(embedData);
            $('.gall_list').load(location.href + ' .gall_list');
        },
        error: function () {
            embedData["description"] = "[매크로] 개념글 해제 실패 (오류)"
            discord.star(embedData);
            $('.gall_list').load(location.href + ' .gall_list');
        }
    });
}

function cellularAvoid() {
    $.ajax({
        type: "POST",
        url: "/ajax/managements_ajax/update_ipblock",
        data: {
            'ci_t': get_cookie('ci_c'),
            gallery_id: 'purikone_redive',
            _GALLTYPE_: "M",
            proxy_time: "2880",
            mobile_time: "60",
            proxy_use: 1,
            mobile_use: 1,
            img_block: "A",
            img_block_time: "",
            img_block_use: 0
        },
        dataType: 'json',
        success: function () {
            discord.log('dcmac', '통피 차단 1시간 갱신.');
        },
        error: function () {
            discord.bot('통피 차단 갱신 실패. (오류)');
            discord.log('dcmac', '통피 차단 갱신 실패. (오류)');
        }
    });
}

function changeImage(url) {
    if (!url) {
        return "";
    }
    var urlSplit = url.split("/");
    var fileName = urlSplit[urlSplit.length - 1];
    return "https://github.com/YeonNaru/dcmac/blob/main/icons/" + fileName + "?raw=true";
}

function maxN(array, n) {
    array.sort((a, b) => {
        return b - a;
    });
    return array[n + 1];
}