// ��� ������ ��������� 5��(�⺻)���� ���ΰ�ħ �Ǹ鼭 õ�ȹ� ��

// õ�ȹ� �� ���� �г���
var name = [
	"�����������ڸ���",
	"��õ������",
	"Ether",
	"���"
]; 

var min = 50; // ���� ��Ÿ�� (�� ����)
var sec = 5; // õ�ȹ� ��Ÿ�� (�� ����)

discord_message("��ũ�ΰ� ����Ǿ����ϴ�.")
cellularAvoid();
setInterval(() => autoCut(),1000*sec);
setInterval(() => cellularAvoid(),1000*60*min);

function autoCut() {
	$('.gall_list').load(location.href+' .gall_list');
	console.log('<page load>');

	var list = $('.gall_writer');

	for(var i=0; i<list.length; i++) {
	    var writer = $(list[i]).attr('data-nick');
	    if(name.includes(writer)) {
	    	var dataNo = $(list[i]).parent()[0].getAttribute('data-no');
	    	var tit = $(list[i]).parent().children('.gall_tit').children('a').text();
		if(tit.includes('__')) {continue;}
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
			message = "'"+tit+"' ����� ���� �Ϸ� ("+nick+")";
        	console.log(message);
			discord_message(message);
        	$('.gall_list').load(location.href+' .gall_list');
        },
        error : function(ajaxData) {
           console.log('�ý��� ����.');
        }
    });
}

function cellularAvoid(){
	$.ajax({
		type: "POST",
		url: "/ajax/managements_ajax/update_ipblock",
		data: { 'ci_t' : get_cookie('ci_c'), gallery_id : 'purikone_redive', _GALLTYPE_: "M", proxy_time : "2880", mobile_time : "60", proxy_use : 1, mobile_use : 1,img_block:"A",img_block_time:"",img_block_use:0	},
		dataType :	'json',
		//success : function() {discord_message('���� ���� 1�ð� ����.');},
		error : function() {discord_message('���� ���� ���� ����. (��Ʈ��ũ ����)');}
	});
}

function discord_message(message) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", 'https://discord.com/api/webhooks/1043800408230998026/ifaCB1Qbu1ocF5Zkz0JtCPlJFHQaqg6DSsX6_i1pUziD_HeftBhWnPTjaUVpUPO7XFdq', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            'content': message,
            'username':'������',
            'avatar_url': 'https://redive.estertion.win/icon/unit/123031.webp',
        }));
    }
