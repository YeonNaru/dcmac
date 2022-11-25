# -*- coding: utf-8 -*-
import discord, asyncio, math, os, re, json, openai, urllib, requests
from datetime import datetime, timedelta
from discord.ext import commands, tasks
from discord.ui import Button, View, TextInput, Modal
from discord import ButtonStyle
from urllib.request import urlopen, Request
from func import *
from dc import *



#전역변수
token = 'OTY1NDkwNTk0OTEyODAwNzg4.Ylz9Lw.2AMRY1QWFR43_21rHDbCHVu0YQE'

class Bot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        super().__init__(command_prefix = "=", intents = intents)

    async def setup_hook(self):
        await self.tree.sync()
        v = 4
        print(f"봇이 작동합니다. Ver. {v}")
bot = Bot()
@bot.event
async def on_ready():
    global dataChannel
    await bot.change_presence(activity=discord.Game(name="/명령어"))
    await loadLives()
    await dc_mac()
    await loop_loadLives.start()
    


@tasks.loop(minutes=30)
async def loop_loadLives():
    global youtubeChannels
    global memory
    youtubeChannels.load()
    if len(youtubeChannels.lives) > 0:
        now = datetime.datetime.now()
        data = {
            'name': 'hololive ホロライブ - VTuber Group',
            'icon': 'https://yt3.ggpht.com/ytc/AMLnZu-FamPA8ofQShmCKY6njRuT9zfTPeY1399Y9yUs1w=s88-c-k-c0x00ffffff-no-rj',
            'content': f"\n========== Updated at {now.strtime('%H:%M')} ==========\n"
        }
        youtubeChannels.send(data)
    for data in youtubeChannels.lives.values():
        memory.append(data['url'])
        youtubeChannels.send(data)
    print(">>> loop")

@loop_loadLives.before_loop
async def before_loop_loadLives():
    await bot.wait_until_ready()
    now = datetime.datetime.now()
    if now.minute < 35:
        hour = now.hour
        minute = 35
    else:
        hour = now.hour + 1
        minute = 5
    future = datetime.datetime(now.year, now.month, now.day, hour, minute)
    if now.hour >= hour and now.minute > minute:
        future += timedelta(minutes=30)
    await asyncio.sleep((future-now).seconds)

async def loadLives():
    global youtubeChannels
    global memory
    youtubeChannels.getThread()

    memory = []
    async for message in youtubeChannels.thread.history(limit=100):
        try:
            memory.append(message.embeds[0].to_dict()['url'])
        except:
            pass



#이모티콘 확대
@bot.event
async def on_message(message):
    text = message.content
    if len(text)<1:
        return
    if re.match(r'^<.?:[^:]*:\d*>$', text) is not None:
        emoji_id = text.split(":")[2].replace(">", "")
        extension = ".png"
        if "<a:" in text:
            extension = ".gif"
        emoji_url = "https://cdn.discordapp.com/emojis/"+emoji_id+extension
        member = message.author
        embed = discord.Embed(title="", description="", color=member.color.value)
        embed.set_image(url=emoji_url)
        embed.set_author(name=member.display_name, icon_url=member.display_avatar.url)
        await message.delete()
        await message.channel.send(embed=embed) 
    elif text[0:4] == "호이님 ":
        if text[-1] == "?":
            send = ai(text[4:])
            await message.channel.send(send) 
        else:
            await message.channel.send("질문은 물음표(?)를 붙여주세요.") 
    elif text[0:4] == "호이야 ":
        send = ai_chat(text[4:])
        await message.channel.send(send)



#명령어
@bot.hybrid_command(name = "명령어", description="호이호이 명령어", with_app_command = True)
async def 명령어(ctx: commands.Context):
    embed = setFields(discord.Embed(title="호이호이 명령어", description="", color=botColor().value), False)
    embed.add({
        "/초대": "봇을 서버로 초대할 수 있는 링크 생성",
        "/클배": "클배 관련 명령어 조회",
        "/아레나 + 방덱": "방덱으로 족보 검색 (부분검색 지원)",
        "/추가": "새로운 아레나 족보 추가",
        "/사진 + 이름": "저장된 사진 불러오기",
        "/사진추가 + 이름": "명령어의 위에 있는 사진 추가",
        "/사진삭제 + 이름": "저장된 사진 삭제",
        "/콘추가 + 이름(영어, 숫자)": "명령어의 위에 있는 사진을 이모티콘으로 추가",
        "/스티커": "명령어의 위에 있는 스티커의 이미지 추출",
        "/역할 + @역할": "역할에 포함된 멤버 확인",
        "/아바타 + @멤버": "멤버의 아바타 확인",
        "/배너 + @멤버": "멤버의 배너 확인"
    })
    await ctx.reply(embed=embed.embed)

@bot.hybrid_command(name = "클배", description="클배 명령어", with_app_command = True)
async def 클배(ctx: commands.Context):
    embed = setFields(discord.Embed(title="클배 관련 명령어", description="", color=botColor().value), False)
    embed.add({
        "/타수": "타수 현황 조회",
        "/생타 + 닉네임": "-1타 (격파는 [/격파] 사용)",
        "/격파 + 닉네임": "-1타 +1이월 (이월타 격파는 [/이월] 사용)",
        "/이월 + 닉네임": "-1이월",
        "/카찬 + 닉네임": "카찬 사용 기록",
        "/타수리셋 + ㅇㅇ": "타수 및 카찬 리셋",
        "/타수수정 + 닉네임 + 생타 + 이월": "기록된 타수를 직접 수정",
        "/계정등록 + 닉네임": "클랜원 목록에 계정 추가",
        "/계정삭제 + 닉네임": "클랙원 목록에서 계정 제거",
        "/딜통 + 체력 + 선제딜 + 후속딜 + 종료시간(선택)": "딜통 이월 시간 계산"
    })
    await ctx.reply(embed=embed.embed)



#서버
@bot.hybrid_command(name = "핑", description="응담 속도 확인", with_app_command = True)
async def 핑(ctx: commands.Context):
    latency = f"{int(round(bot.latency*1000, 0))}ms"
    embed=discord.Embed(title="", description="")
    embed.set_author(name=latency, icon_url="https://cdn.discordapp.com/emojis/1037335196791476224.gif")
    await ctx.reply(embed=embed)

@bot.hybrid_command(name = "초대", description="초대 링크 생성", with_app_command = True)
async def 초대(ctx: commands.Context):
    link = "https://discord.com/api/oauth2/authorize?client_id=965490594912800788&permissions=534723950656&scope=bot%20applications.commands"
    embed = discord.Embed(title="이 봇을 서버에 초대하기", color=botColor().value, url=link)
    await ctx.reply(embed=embed)

@bot.hybrid_command(name = "라이브", description="홀로라이브 알림봇 갱신", with_app_command = True)
async def 라이브(ctx: commands.Context):
    await ctx.defer()
    await loop_loadLives()
    await ctx.reply("홀로라이브 알림봇 갱신 완료")

#멤버
@bot.hybrid_command(name = "아바타", description="유저의 아바타 확인", with_app_command = True)
async def 아바타(ctx: commands.Context, 유저: discord.Member):
    embed = discord.Embed(title="", description="", color=유저.color.value)
    embed.set_image(url=유저.display_avatar.url)
    embed.set_author(name=f"{유저.display_name}#{유저.discriminator}님의 아바타입니다.", icon_url=유저.display_avatar.url, url=유저.display_avatar.url)
    await ctx.reply(embed=embed)

@bot.hybrid_command(name = "배너", description="유저의 배너 확인", with_app_command = True)
async def 배너(ctx: commands.Context, 유저: discord.Member):
    userData = await bot.http.request(discord.http.Route("GET", "/users/{uid}", uid=유저.id))
    banner_id = userData["banner"]
    if banner_id:
        if "a_" in banner_id:
            banner_id += ".gif"
        else:
            banner_id += ".png"
        banner_url = "https://cdn.discordapp.com/banners/"+str(유저.id)+"/"+str(banner_id)+"?size=4096"
        embed = discord.Embed(title="", description="", color=유저.color.value)
        embed.set_image(url=banner_url)
        embed.set_author(name=f"{유저.display_name}#{유저.discriminator}님의 배너입니다.", icon_url=유저.display_avatar.url, url=banner_url)
        await ctx.reply(embed=embed)
    else:
        await ctx.reply("배너가 없습니다.")

@bot.hybrid_command(name = "역할", description="역할 멤버 조회", with_app_command = True)
async def 역할(ctx: commands.Context, 역할: discord.Role):
    members = 역할.members
    memberList = "\n".join(member.display_name for member in members)
    embed = discord.Embed(title=역할.name, description=memberList[:-1], color=botColor().value)
    await ctx.reply(embed=embed)



#스티커, 이모티콘, 사진
@bot.hybrid_command(name = "스티커", description="스티커의 url 추출", with_app_command = True)
async def 스티커(ctx: commands.Context):
    await ctx.defer()
    channel = ctx.message.channel
    async for message in channel.history(limit=2):
        if (len(message.stickers) == 1):
            await message.reply(message.stickers[0].url)
            await ctx.reply("스티커 이미지 추출 완료.")
            return
    await ctx.reply("스티커를 찾을 수 없습니다.")

@bot.hybrid_command(name = "콘추가", description="이모티콘 추가", with_app_command = True)
async def 콘추가(ctx: commands.Context, 이름: str):
    await ctx.defer()
    channel = ctx.message.channel
    url = ""

    async for message in channel.history(limit=3):
        if len(message.attachments)==0:
            if "http" in message.content:
                url = message.content
                break
        else:
            url = message.attachments[0].url
            break
         
    if url == "":
        await ctx.reply("이미지를 찾을 수 없습니다.")
        return
    else:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        emoji = await message.guild.create_custom_emoji(name = 이름, image = urlopen(req).read())
        await ctx.reply("이모티콘 등록 완료.")
        await message.reply(emoji)

@콘추가.error
async def 콘추가_error(ctx: commands.Context, error):
    text = ""
    if "error code: 50138" in str(error):
        text = "이미지 크기 초과 (최대: 256KB)"
    elif "error code: 50035" in str(error):
        text = "이름 형식 오류 (영어, 숫자만 가능)"
    else:
        text = str(error)
    await ctx.reply(text)
        
@bot.hybrid_command(name = "사진추가", description="바로 위 메시지의 사진을 추가", with_app_command = True)
async def 사진추가(ctx: commands.Context, 이름: str, 메시지: int=0):
    await ctx.defer()
    images = Images()
    await images.load()

    channel = ctx.message.channel
    image_url = ""
    result = -1

    history = []

    async for message in channel.history(limit=3):
        if 메시지 != 0:
            message = await channel.fetch_message(메시지)
        
        if len(message.attachments)==0:
            if "http" in message.content:
                image_url = message.content
                break
        else:
            image_url = message.attachments[0].url
            break

    if image_url != "":
        if 이름 not in images.json['images']:
            await images.channel.send(이름+" 추가")
            images.add(이름, image_url)
            await images.save()
            result = 1
        else:
            result = 0
         
    if result == 0:
        send_message = f"[{이름}] 중복된 이름입니다."
    elif result == -1:
        send_message = f"[{이름}] 사진을 찾을 수 없습니다."
    else:
        send_message = f"[{이름}] 사진이 저장되었습니다."

    await ctx.reply(send_message)

@bot.hybrid_command(name = "사진삭제", description="검색한 사진을 삭제", with_app_command = True)
@commands.has_permissions(administrator = True)
async def 사진삭제(ctx: commands.Context, 이름: str):
    await ctx.defer()
    images = Images()
    await images.load()

    send_message = ""
    result = -1

    if 이름 in images.json['images']:
        await images.channel.send(f"{이름} 삭제")
        images.delete(이름)
        await images.save()
    else:
        result = 0

    if result == 0:
        send_message =  f"[{이름}] 저장된 사진이 없습니다."
    else:
        send_message =  f"[{이름}] 사진을 삭제했습니다."

    await ctx.reply(send_message)

@사진삭제.error
async def 사진삭제_error(ctx: commands.Context, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.reply("삭제 권한이 없습니다.")

@bot.hybrid_command(name = "사진", description="저장된 사진 불러오기", with_app_command = True)
async def 사진(ctx: commands.Context, 이름: str):
    await ctx.defer()
    images = Images()
    await images.load()
    
    send_message = ""

    result = data_image(이름, images.json)

    if "embed" in str(type(result)):
        await ctx.reply(embed=result)
        return

    if result == 0:
        send_message =  f"[{이름}] 저장된 사진이 없습니다."
    elif result[0][:4] != "http":
        await ctx.reply(f"[오류] {result[0]}")
    else:
        text = ""
        if result[1] != "":
            text = f"랜덤: {result[1]}"
        member = ctx.message.author
        embed = discord.Embed(title="", description=text, color=member.color.value)
        embed.set_image(url=result[0])
        embed.set_author(name=member.display_name, icon_url=member.display_avatar.url)
        await ctx.reply(embed=embed)
        return

    await ctx.reply(send_message)

@사진.error
async def 사진_error(ctx: commands.Context, error):
    text = str(error)
    await ctx.reply(text)

@bot.hybrid_command(name = "스포", description="저장된 사진 불러오기(스포일러)", with_app_command = True)
async def 스포(ctx: commands.Context, 이름: str):
    await ctx.defer()
    images = Images()
    await images.load()
    
    send_message = ""

    result = data_image(이름, images.json)

    if result == 0:
        send_message =  f"[{이름}] 저장된 사진이 없습니다."
        await ctx.reply(send_message)
    else:
        text = ""
        if result[1] != "":
            text = f"랜덤: ||{result[1]}||"
        req = Request(result[0], headers={"User-Agent": "Mozilla/5.0"})
        temp = urlopen(req).read()
        urlSplit = result[0].split("/")
        filename = urlSplit[len(urlSplit)-1].split("?")[0]

        if "." not in result[0]:
            filename += "jpg"
        with open(filename, mode="wb") as f:
            f.write(temp)
            f.close()
            boostCount = ctx.guild.premium_subscription_count
            limitSize = 8
            if boostCount >= 7:
                limitSize = 50
                if boostCount >= 14:
                    limitSize = 100
            if os.path.getsize(filename) > limitSize*1024*1024:
                await ctx.reply(f"이미지 파일의 사이즈가 서버 제한을 초과했습니다.\n(이 서버의 파일 사이즈 제한: {limitSize*1024}Kb)")
            else:
                await ctx.reply(content=text,file=discord.File(fp=filename, spoiler=True))

        os.remove(filename)

@스포.error
async def 스포_error(ctx: commands.Context, error):
    text = ""
    if "error code: 40005" in str(error):
        text = "(실패) 이미지의 용량이 너무 큼"
    else:
        text = str(error)
    await ctx.reply(text)



#아레나
@bot.hybrid_command(name = "아레나", description="아레나 족보 검색", with_app_command = True)
async def 아레나(ctx: commands.Context, 방덱: str):

    button1 = Button(label="<<", style=ButtonStyle.primary)
    button2 = Button(label=">>", style=ButtonStyle.primary)
    button3 = Button(label="승리", style=ButtonStyle.success)
    button4 = Button(label="패배", style=ButtonStyle.danger)
    button5 = Button(label="수정", style=ButtonStyle.gray)
    button6 = Button(label="종료", style=ButtonStyle.gray)

    async def button1_callback(interaction: discord.Interaction):
        nonlocal count
        nonlocal 번호
        count = count - 1
        if count < 2:
            count = 1
        embed = load(방덱, count, DB)
        번호 = embed.description
        await message.edit(embed=embed)
        await interaction.response.defer()

    async def button2_callback(interaction: discord.Interaction):
        nonlocal count
        nonlocal 번호
        count = count + 1
        embed = load(방덱, count, DB)
        번호 = embed.description
        await message.edit(embed=embed)
        await interaction.response.defer()

    async def button3_callback(interaction: discord.Interaction):
        await interaction.response.defer()
        nonlocal DB
        embed = loading(방덱, count, DB)
        await message.edit(embed=embed)
        record(번호.strip('#'), 1, 0)
        DB = loadSheet()
        embed = reload(방덱, 번호.strip('#'), DB)
        await message.edit(embed=embed)
        
    async def button4_callback(interaction: discord.Interaction):
        await interaction.response.defer()
        nonlocal DB
        embed = loading(방덱, count, DB)
        await message.edit(embed=embed)
        record(번호.strip('#'), 0, 1)
        DB = loadSheet()
        embed = reload(방덱, 번호.strip('#'), DB)
        await message.edit(embed=embed)
        
    async def button5_callback(interaction: discord.Interaction):
        nonlocal DB
        result = read(방덱, count, DB)
        embed = discord.Embed(title=방덱, description="수정 중...", color=0xFFFFFF)
        await message.edit(embed=embed, view=None)
        modal = Arena_edit()
        modal.message(message)
        modal.set(result)
        modal.view(view)
        modal.ctx(ctx)
        modal.number(번호.strip('#'))
        await interaction.response.send_modal(modal)

    async def button6_callback(interaction: discord.Interaction):
        await interaction.response.defer()
        await message.edit(view=None)
            
    await ctx.defer()

    DB = loadSheet()
    embed = load(방덱, 1, DB)
    count = 1

    번호 = embed.description

    button1.callback = button1_callback
    button2.callback = button2_callback
    button3.callback = button3_callback
    button4.callback = button4_callback
    button5.callback = button5_callback
    button6.callback = button6_callback
    view = View()
    view.add_item(button1)
    view.add_item(button2)
    view.add_item(button3)
    view.add_item(button4)
    view.add_item(button5)
    view.add_item(button6)

    message = await ctx.reply(embed=embed, view=view)
    await asyncio.sleep(300)
    await message.edit(view=None)

class Arena_edit(Modal, title='아레나 족보 수정'):
    b = TextInput(label="공덱", min_length=5, max_length=5, default="-")
    c = TextInput(label="작성자", default="-")
    d = TextInput(label="승", default="0")
    e = TextInput(label="패", default="0")
    f = TextInput(label="메모", style=discord.TextStyle.paragraph, default="-")
    def set(self, data):
        self.title = f"아레나 족보 수정 [{data[0]}]"
        #self.a = TextInput(label="방덱", min_length=5, max_length=5, default=data[0])
        self.b.default = data[1]
        self.c.default = data[2]
        self.d.default = data[3]
        self.e.default = data[4]
        if data[4] is None:
            self.e.default = "0"
        self.f.default = data[6]
        self.arenaData = data

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer()

        #방덱 = self.a.value
        방덱 = self.arenaData[0]
        공덱 = self.b.value
        작성자 = self.c.value
        승 = self.d.value
        패 = self.e.value
        메모 = self.f.value
        번호 = self.num

        editArena(번호, 공덱, 작성자, 메모, 승, 패)
        DB = loadSheet()
        embed = reload(방덱, 번호.strip('#'), DB)
        await self.message.edit(embed=embed)
        await self.ctx.reply("족보가 수정되었습니다.")

    def ctx(self, ctx: commands.Context):
        self.ctx = ctx

    def message(self, message):
        self.message = message

    def view(self, view):
        self.view = view

    def number(self, num):
        self.num = num

class Arena(Modal, title='아레나 족보 추가'):
    a = TextInput(label="방덱", min_length=5, max_length=5)
    b = TextInput(label="공덱", min_length=5, max_length=5)
    c = TextInput(label="작성자")
    d = TextInput(label="메모", style=discord.TextStyle.paragraph, default="-")

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer()

        방덱 = self.a.value
        공덱 = self.b.value
        작성자 = self.c.value
        메모 = self.d.value

        gc1 = gc.open("아레나 DB").worksheet("아레나DB")
    
        lastRow = lastCheck(gc1)
    
        updateCells(lastRow, 방덱, 공덱, 작성자, gc1)
        updateCell("U", lastRow, 메모, gc1)
    
        link = "https://docs.google.com/spreadsheets/d/1xfvQaTXf4a0B3gfpaWIUW_mmySsdeRX_t6n6uYVgWYY/edit#gid=1118958755&range=A"
        if 메모 == "":
            메모 = "-"
        embed = discord.Embed(title=방덱, description="#"+lastRow, color=botColor().value, url=link+str(lastRow))
        embed.add_field(name="공덱", value=공덱, inline=True)
        embed.add_field(name="작성자", value=작성자, inline=True)
        embed.add_field(name="전적", value="1승 0패 (100%)", inline=True)
        embed.add_field(name="메모", value=메모, inline=True)
        embed.set_footer(text="족보 추가됨.")

        await self.ctx.reply(embed=embed)

    def ctx(self, ctx: commands.Context):
        self.ctx = ctx

@bot.hybrid_command(name = "추가", description="아레나 족보 추가", with_app_command = True)
async def 추가(ctx: commands.Context):
    modal = Arena()
    modal.ctx(ctx)
    await ctx.interaction.response.send_modal(modal)



#기타
@bot.hybrid_command(name = "선택", description="선택지 중 하나를 무작위로 선택. (A,B,C...)", with_app_command = True)
async def 선택(ctx: commands.Context, 선택지: str):
    if "," not in 선택지:
        await ctx.reply("선택지를 두 개 이상 넣어주세요. (A,B...)")
        return
    keys = 선택지.split(",")
    result = random.choice(keys)
    선택지 = 선택지.replace(",", ", ")
    embed = discord.Embed(title=f"결과: {result}", description=f"선택지: {선택지}", color=botColor().value)
    await ctx.reply(embed=embed)

@bot.hybrid_command(name = "딜통", description="딜통 이월시간 계산", with_app_command = True)
async def 딜통(ctx: commands.Context, 체력: int, 선제딜량: int, 후속딜량: int, 종료시간: int=0):
    await ctx.defer()
    sec = math.ceil(110-(90-종료시간)*((체력-선제딜량)/후속딜량))
    선제풀 = math.ceil(((종료시간-90)*체력+20*후속딜량)/(종료시간-90))
    후속풀 = math.ceil(((종료시간-90)*선제딜량+(90-종료시간)*체력)/20)
    if sec > 90:
        sec = 90
    elif sec < 0:
        sec = 0

    embed = discord.Embed(title="이월 시간 계산기")
    embed.add_field(name="보스 체력", value=체력, inline=False)
    embed.add_field(name="선제 딜량", value=선제딜량, inline=True)
    embed.add_field(name="후속 딜량", value=후속딜량, inline=True)
    embed.add_field(name="이월 시간", value=sec, inline=True)
    embed.add_field(name="풀이월 요구 딜량", value=f"선제: {선제풀}　후속: {후속풀}", inline=True)

    await ctx.reply(embed=embed)

@bot.hybrid_command(name = "타수", description="클랜원 잔여 타수 확인", with_app_command = True)
async def 타수(ctx: commands.Context):
    await ctx.defer()
    members = Members()
    await members.load()
    tasu = [0, 0]
    memberList = ""
    endMembers = []

    for member in sorted(members.json.keys()):
        value = members.json[member]
        tasu[0] += value[0]
        tasu[1] += value[1]

        if value[0] or value[1]:
            memberList += f"**{member}** : {value[0]}타 {value[1]}이월"
            if value[2]:
                memberList += ":exclamation:\n"
            else:
                memberList += "\n"
        else:
            endMembers.append(member)

    endList = ", ".join(member for member in endMembers)
        
    embed1 = discord.Embed(title=f"남은 타수 {tasu[0]}타 {tasu[1]}이월", description=memberList, color=botColor().value)
    embed2 = discord.Embed(title=f"퇴근한 클랜원 [{len(endMembers)}명]", description=endList, color=botColor().value)
    await ctx.reply(embeds=[embed1, embed2])

@bot.hybrid_command(name = "카찬", description="카찬 사용", with_app_command = True)
async def 카찬(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        if members.json[닉네임][2]:
            await ctx.reply(f"[{닉네임}] 이미 카찬을 사용한 계정입니다.")
        else:
            members.set(닉네임, [0, 0, True])
            await members.save()
            await ctx.reply(f"[{닉네임}] 카찬을 사용했습니다.")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "계정등록", description="클랜원 계정 등록", with_app_command = True)
async def 계정등록(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 not in members.json:
        members.add(닉네임)
        await members.save()
        await ctx.reply(f"[{닉네임}] 계정을 등록했습니다.")
    else:
        await ctx.reply(f"[{닉네임}] 계정 등록 실패 (중복된 닉네임)")

@bot.hybrid_command(name = "계정삭제", description="클랜원 계정 제거", with_app_command = True)
async def 계정삭제(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        members.delete(닉네임)
        await members.save()
        await ctx.reply(f"[{닉네임}] 계정을 제거했습니다.")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "타수리셋", description="현재 기록된 타수 초기화", with_app_command = True)
async def 타수리셋(ctx: commands.Context, ㄹㅇ: str):
    await ctx.defer()
    if ㄹㅇ != "ㅇㅇ":
        await ctx.reply("'/타수리셋 ㅇㅇ' 입력")

    members = Members()
    await members.load()
    members.reset()
    await members.save()
    await ctx.reply("타수 초기화 완료")

@bot.hybrid_command(name = "타수수정", description="입력한 닉네임의 타수 수정", with_app_command = True)
async def 타수리셋(ctx: commands.Context, 닉네임: str, 생타: int, 이월: int):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        members.edit(닉네임, 생타, 이월)
        await members.save()
        await ctx.reply(f"[{닉네임}] 타수 수정 완료 ({members.json[닉네임][0]}타 {members.json[닉네임][1]}이월)")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "생타", description="사용한 타수 기록 (생타)", with_app_command = True)
async def 생타(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        if members.json[닉네임][0] > 0:
            members.set(닉네임, [-1, 0, False])
            await members.save()
            await ctx.reply(f"[{닉네임}] 생타 기록 완료 ({members.json[닉네임][0]}타 {members.json[닉네임][1]}이월)")
        else:
            await ctx.reply(f"[{닉네임}] 생타 기록 실패 (잔여 생타 없음)")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "격파", description="사용한 타수 기록 (격파)", with_app_command = True)
async def 격파(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        if members.json[닉네임][0] > 0:
            members.set(닉네임, [-1, 1, False])
            await members.save()
            await ctx.reply(f"[{닉네임}] 격파 기록 완료 ({members.json[닉네임][0]}타 {members.json[닉네임][1]}이월)")
        else:
            await ctx.reply(f"[{닉네임}] 격파 기록 실패 (잔여 생타 없음)")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "이월", description="사용한 타수 기록 (이월)", with_app_command = True)
async def 이월(ctx: commands.Context, 닉네임: str):
    await ctx.defer()
    members = Members()
    await members.load()

    if 닉네임 in members.json:
        if members.json[닉네임][1] > 0:
            members.set(닉네임, [0, -1, False])
            await members.save()
            await ctx.reply(f"[{닉네임}] 이월타 기록 완료 ({members.json[닉네임][0]}타 {members.json[닉네임][1]}이월)")
        else:
            await ctx.reply(f"[{닉네임}] 이월타 기록 실패 (잔여 이월 없음)")
    else:
        await ctx.reply(f"[{닉네임}] 존재하지 않는 계정입니다.")

@bot.hybrid_command(name = "천안문", description="천안문 (on 또는 off 입력)", with_app_command = True)
async def 천안문(ctx: commands.Context, 전원: str):
    await ctx.defer()
    if 전원 == "off":
        await dc_mac_close()
        await ctx.reply("매크로가 종료되었습니다.")
        return
    elif 전원 == "on":
        await dc_mac()
        await ctx.reply("매크로가 실행되었습니다.")
        return
    elif 전원 == "re":
        await dc_mac_close()
        await asyncio.sleep(2)
        await dc_mac()
        await ctx.reply("매크로가 재시작되었습니다.")
    else:
        await ctx.reply("올바른 입력이 아닙니다.")
        return

@bot.hybrid_command(name = "감시목록", description="시진핑이 감시중인 유저/키워드 목록", with_app_command = True)
async def 감시목록(ctx: commands.Context):
    await ctx.defer()
    json_url = "https://raw.githubusercontent.com/YeonNaru/dcmac/main/config.json"
    jsonData = json.loads(urlopen(Request(json_url, headers={"User-Agent": "Mozilla/5.0"})).read())
    embed = setFields(discord.Embed(title="시진핑의 감시 기록부", description="", color=botColor().value), False)
    embed.add({
        "유저 알림 대상": "\n".join(out for out in jsonData["알림"]) + "\n" + "\n".join(f"[ID] {out}" for out in jsonData["알림ID"]) + "\n" + "\n".join(f"[IP] {out}" for out in jsonData["알림IP"]),
        "념글 천안문 대상": "\n".join(out for out in jsonData["천안문"]),
        "알림 키워드": "\n".join(out for out in jsonData["알림키워드"]),
        "글삭 키워드": "\n".join(out for out in jsonData["글삭"]),
        "차단 키워드": "\n".join(f"{out}: {jsonData['밴'][out][0]}시간, {jsonData['밴'][out][1]}" for out in jsonData["밴"])
    })
    await ctx.reply(embed=embed.embed)

@bot.hybrid_command(name = "감시갱신", description="시진핑이 감시중인 유저/키워드 목록 갱신", with_app_command = True)
async def 감시갱신(ctx: commands.Context):
    await ctx.defer()
    await config_load()
    await ctx.reply("시진핑의 감시목록을 갱신했습니다.")


ai_prompt = 'I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer.\n\nQ: What is human life expectancy in the United States?\nA: Human life expectancy in the United States is 78 years.\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower was president of the United States in 1955.'
ai_chat_prompt = 'The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: Is karu skatefish?\nAI: As far as I can tell, karu skatefish is a type of fish.\nHuman: You did well.\nAI: Thank you, I try my best to be helpful.'

#함수
def getData(lastMessage):
    json_url = lastMessage.attachments[0].url
    data = json.loads(urlopen(Request(json_url, headers={"User-Agent": "Mozilla/5.0"})).read())
    return data
def ai(message):
    global ai_prompt
    openai.api_key = "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"

    restart_sequence = "\n\nQ: "
    text = trans(message, ["ko", "en"])
    ai_prompt += (restart_sequence+text)

    response = openai.Completion.create(
      model="text-davinci-002",
      prompt=ai_prompt,
      temperature=0.5,
      max_tokens=256,
      top_p=1,
      frequency_penalty=0,
      presence_penalty=0,
      stop=[" Q:", " A:"]
    )
    temp = response["choices"][0]["text"]
    if temp[0] == ".":
        temp = temp[1:]
    ai_prompt += response["choices"][0]["text"]
    print("===ai_prompt===")
    print(ai_prompt)
    send = temp.split("A:")[-1].strip()
    send = trans(send, ["en", "ko"])
    
    return send
def ai_chat(message):
    global ai_chat_prompt
    openai.api_key = "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"

    text = trans(message, ["ko", "en"])

    restart_sequence = "\nHuman: "

    ai_chat_prompt += (restart_sequence+text)

    response = openai.Completion.create(
      model="text-davinci-002",
      prompt=ai_chat_prompt,
      temperature=0.9,
      max_tokens=150,
      top_p=1,
      frequency_penalty=0,
      presence_penalty=0.6,
      stop=[" Human:", " AI:"]
    )
    temp = response["choices"][0]["text"]
    if temp[0] == ".":
        temp = temp[1:]
    ai_chat_prompt += response["choices"][0]["text"]
    print("===ai_chat_prompt===")
    print(ai_chat_prompt)
    send = temp.split("AI:")[-1].strip()
    send = trans(send, ["en", "ko"])

    return send
def trans(text: str, lang):
    global naver
    client_ids = naver.load()
    client_id = client_ids[0]
    client_secret = client_ids[1]
    encText = urllib.parse.quote(text)
    data = f"source={lang[0]}&target={lang[1]}&text={encText}"
    url = "https://openapi.naver.com/v1/papago/n2mt"
    request = urllib.request.Request(url)
    request.add_header("X-Naver-Client-Id", client_id)
    request.add_header("X-Naver-Client-Secret", client_secret)
    response = urllib.request.urlopen(request, data=data.encode("utf-8"))
    rescode = response.getcode()
    if rescode==200:
        response_body = response.read()
        result = json.loads(response_body.decode("utf-8"))
        return result["message"]["result"]["translatedText"]
    else:
        print("Error Code:"+rescode)
        return "실패"

#클래스
class setFields:
    def __init__(self, embed: discord.Embed, inline: bool):
        self.embed = embed
        self.inline = inline
    def add(self, fields):
        for key, val in fields.items():
            self.embed.add_field(name=key, value=val, inline=self.inline)
        return self.embed

class botColor:
    def __init__(self):
        self.value = 0xb9b4fe

class Members:
    def __init__(self):
        self.json = {}
        self.channel = bot.get_guild(965126903763718144).get_channel(1042333610243534899)
    async def load(self):
        lastMessage = await self.channel.fetch_message(self.channel.last_message_id)
        json_url = lastMessage.attachments[0].url
        self.json = json.loads(urlopen(Request(json_url, headers={"User-Agent": "Mozilla/5.0"})).read())
    async def save(self):
        f = open("members.json", "w+")
        f.write(str(json.dumps(self.json)))
        f.close()
        await self.channel.send(file=discord.File(r"members.json"))
        os.remove("members.json")
    def add(self, member: str):
        if member not in self.json:
            self.json[member] = [3, 0, False]
            return 1
        else:
            return 0
    def delete(self, member: str):
        if member in self.json:
            del self.json[member]
            return 1
        else:
            return 0
    def set(self, member: str, stat):
        stat[0] += self.json[member][0]
        stat[1] += self.json[member][1]
        if not stat[2]:
            stat[2] = self.json[member][2]
        if member in self.json:
            self.json[member] = stat
            return 1
        else:
            return 0
    def edit(self, member: str, full: int, half: int):
        self.json[member][0] = full
        self.json[member][1] = half
    def reset(self):
        for member, val in self.json.items():
            self.json[member] = [3, 0, False]

class Images:
    def __init__(self):
        self.json = {}
        self.channel = bot.get_guild(965126903763718144).get_channel(1041640214113833011)
    async def load(self):
        lastMessage = await self.channel.fetch_message(self.channel.last_message_id)
        json_url = lastMessage.attachments[0].url
        self.json = json.loads(urlopen(Request(json_url, headers={"User-Agent": "Mozilla/5.0"})).read())
    async def save(self):
        f = open("images.json", "w+")
        f.write(str(json.dumps(self.json)))
        f.close()
        await self.channel.send(file=discord.File(r"images.json"))
        os.remove("images.json")
    def add(self, name: str, url: str):
        if name not in self.json["images"]:
            self.json["images"][name] = url
            return 1
        else:
            return 0
    def delete(self, name: str):
        if name in self.json["images"]:
            del self.json["images"][name]
            return 1
        else:
            return 0

class Naver:
    def __init__(self):
        self.ids = [
            ["Gpxns_8FBlHv70SBzaaQ", "Qf1263n6tC"],
            ["xRBUxpSwmBXQEbAF0TGn", "KuZv3w_lNK"],
            ["tQ9m5BdvTkGAzC7Zzu6S", "R4j0TMTQNT"],
            ["rvBYd9Fptx3DPNsHJ9jh", "qM6xBmN34O"],
            ["usHwVbZ0OMgVtHEDp0V9", "RbMudM6DM0"],
            ["RaMR0ObsLPEyx3__JFb3", "5QYDpRD85J"],
            ["ydoVXDjYNSu_F6ErhOOK", "mcRsKbv0Ku"],
            ["7tWBmKRNw72pGYWYfkAp", "04PnwhndHy"],
            ["vuPrjRlE1vws0zirQ3Kc", "I9lse_cUiJ"],
            ["EhX0MOGC1ltYZ8OFccwb", "LrQwtPeEj0"]
        ]
        self.count = 0
    def load(self):
        self.count += 1
        if self.count > 9:
            self.count = 0
        return self.ids[self.count]

class YoutubeChannels:
    def __init__(self):
        self.APIkeys = [
            'AIzaSyBfadW7NLqZDg_hGV1UOm8eMQptjUSKSuk',
            'AIzaSyBzlsL0iSctv45XgWKDu7aKcc1odln3XHs',
            'AIzaSyBVe_W7FhecXMGEuH6xT0nIBORRh-sEUlE',
            'AIzaSyBJtxXldvPCLzMY0W5mB4-0ndKYw8UjB8g',
            'AIzaSyAx8NkjapsAz0hu39Cc8Vcas4TfTGso_so',
            'AIzaSyA0urRi7VsJPLcCoa7wYm4nfJHHWaZw8nc',
            'AIzaSyBYGV-f9nCWflgLcMFOzi1a7O91Y26C4k0',
            'AIzaSyCWSFJJA3_PUSNlnDqANGcSyzBn2WRFuLE',
            'AIzaSyBMkYmOl_Aplg6KLvlMBdJSGaOIBFRZKGU',
            'AIzaSyD7YIUocJfJKuNzExpgEWKTwHeDWmFWiOs',
            'AIzaSyBqskmqiRUvdERishv1Ja96ULCRL3b22cM',
            'AIzaSyC52Zao2A3cRRWfUh4rW1cDUjHNY3_LxgA'
        ]
        self.APIkey = 'AIzaSyBfadW7NLqZDg_hGV1UOm8eMQptjUSKSuk'
        self.channelAPI = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&id=[ID]&key=[APIkey]'
        self.liveAPI = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=[ID]&type=video&eventType=live&key=[APIkey]'
        self.ids = [
            'UCDqI2jOz0weumE8s7paEk6g', 
            'UC0TXe_LYZ4scaW2XMyi5_kw', 
            'UC-hM6YJuNYVAmUWxeIr9FeA', 
            'UC5CwaMl1eIgY8h02uZw7u8A', 
            'UCD8HOxPs4Xvsm8H0ZxXGiBw', 
            'UCFTLzh12_nrtzqBPsTCqenA', 
            'UC1CfXB_kRs3C-zaeTG3oGyg', 
            'UCdn5BQ06XqgXoAxIhbqw5Rg', 
            'UCQ0UDLQCjY0rmuxCDE38FGg', 
            'UC1opHUrw8rvnsadT-iGp7Cg', 
            'UCXTpFs_3PqI41qX2d9tL2Rw', 
            'UC7fk0CB07ly8oSl0aqKkqFg', 
            'UC1suqwovbL1kzsoaZgFZLKg', 
            'UCvzGlP9oQwU--Y0r9id_jnA', 
            'UCp-5t9SrOQwXMU7iIjQfARg', 
            'UCvaTdHTWBGv3MKj3KVqJVCw', 
            'UChAnqc_AY5_I3Px5dig3X1Q', 
            'UC1DCedRgGHBdm81E1llLhOQ', 
            'UCl_gCybOJRIgOXw6Qb4qJzQ', 
            'UCvInZx9h3jC2JzsIzoOebWg', 
            'UCdyqAaZDKHXg4Ahi7VENThQ', 
            'UCCzUftO8KOVkV4wQG1vkUvg', 
            'UCZlDXzGoo7d44bwdNObFacg', 
            'UCS9uQI-jC3DE0L4IpXyvr6w', 
            'UCqm3BQLlJfvkTsX_hvm0UmA', 
            'UC1uv2Oq6kNxgATlCiez59hw', 
            'UCa9Y57gfeY0Zro_noHRVrnw', 
            'UCFKOVgVbGmX65RxO3EtH3iw', 
            'UCAWSyEs_Io8MtpY3m-zqILA', 
            'UCUKD-uaobj9jiqB-VXt71mA', 
            'UCgZuwn-O7Szh9cAgHqJ6vjw', 
            'UCK9V2B22uJYu3N7eR_BT9QA', 
            'UCENwRMx5Yh42zWpzURebzTw', 
            'UCs9_O1tRPMQTHQ-N_L6FU2g', 
            'UC6eWCld0KwmyHFbAqK3V-Rw', 
            'UCIBY1ollUsauvVi4hW4cumw', 
            'UC_vMYWcDjmfdpH6r4TTn1MQ',
            'UCyLGcqYs7RsBb3L0SJfzGYA',
            'UCJFZiqLMntJufDCHc6bQixg'
        ]
        self.channels = {}
        self.lives = {}

    def getChannelsData(self, ID):
        while True:
            APIurl = self.channelAPI.replace('[ID]', ID).replace('[APIkey]', self.APIkey)
            print(f">>> set API URL [{APIurl}]")
            try:
                data = json.loads(urlopen(Request(APIurl, headers={"User-Agent": "Mozilla/5.0"})).read())
                break
            except:
                index = self.APIkeys.index(self.APIkey) + 1
                if index >= len(self.APIkeys):
                    index = 0
                self.APIkey = self.APIkeys[index]
                print(">>> API key Changed")

        snippet = data['items'][0]['snippet']
        if 'customUrl' in snippet:
            chURL = snippet['customUrl']
        else:
            chURL = f"channel/{ID}"
        self.channels[ID] = {
            'name': snippet['title'],
            'icon': snippet['thumbnails']['high']['url'],
            'url': f"https://www.youtube.com/{chURL}"
        }

    def load(self):
        for ID in self.ids:
            while True:
                APIurl = self.liveAPI.replace('[ID]', ID).replace('[APIkey]', self.APIkey)
                try:
                    data = json.loads(urlopen(Request(APIurl, headers={"User-Agent": "Mozilla/5.0"})).read())
                    break
                except:
                    index = self.APIkeys.index(self.APIkey) + 1
                    if index >= len(self.APIkeys):
                        index = 0
                    self.APIkey = self.APIkeys[index]
                    print(">>> API key Changed")

            totalResults = data['pageInfo']['totalResults']
            if totalResults == 0:
                if ID in self.lives:
                    del self.lives[ID]
                continue

            try:
                videoID = data['items'][0]['id']['videoId']
            except:
                videoID = data['items'][0]['id']

            if f"https://youtu.be/{videoID}" in memory:
                try:
                    del self.lives[ID]
                except:
                    pass
                continue

            if ID not in self.channels:
                self.getChannelsData(ID)

            snippet = data['items'][0]['snippet']

            self.lives[ID] = {
                'title': snippet['title'],
                'description': snippet['description'],
                'thumbnail': snippet['thumbnails']['high']['url'],
                'url': f"https://youtu.be/{videoID}",
                'date': UTCtoJST(snippet['publishedAt']),
                'name': self.channels[ID]['name'],
                'icon': self.channels[ID]['icon'],
                'channelURL': self.channels[ID]['url']
            }
        print('>>> lives_loaded')

    def getThread(self):
        self.thread = bot.get_guild(1006054065706369074).get_thread(1045348588890365952)

    def send(self, data):
        urls = [
            'https://discord.com/api/webhooks/1043800408230998026/ifaCB1Qbu1ocF5Zkz0JtCPlJFHQaqg6DSsX6_i1pUziD_HeftBhWnPTjaUVpUPO7XFdq?thread_id=1045348588890365952',
            'https://discord.com/api/webhooks/1045665554247192627/FMLTLvUveIpWg6O7TOCug2Vgd0bVrlLpEeTFLCTiidbEDM58apWcmc_5RmoWrCeWIq0q'
        ]
        json = {
		    'username': data['name'],
		    'avatar_url': data['icon'],
	    }
        if 'title' in data:
            json['embeds'] = [
                {
                    'title': data['title'],
                    'color': 16659508,
                    'description': data['description'],
                    'url': data['url'],
                    'author': {
                        'name': data['name'],
                        'url': data['channelURL'],
                        'icon_url': data['icon']
                    },
                    'thumbnail': {
                        'url': data['thumbnail']
                    },
                    'footer': {
                        'text': f"공개: {data['date']}"
                    }
                }
            ]
        if 'content' in data:
            json['content'] = data['content']

        for url in urls:
            print(requests.post(url, json=json))
        
youtubeChannels = YoutubeChannels()
naver = Naver()
bot.run(token)
