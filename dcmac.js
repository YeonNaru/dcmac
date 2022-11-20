from selenium import webdriver
import time
import os
from urllib.request import urlopen, Request

chrome_options = webdriver.ChromeOptions()
chrome_options.binary_location = os.environ.get("GOOGLE_CHROME_BIN")
chrome_options.add_argument("--headless") # 창을 띄우지 않음
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--no-sandbox") # 샌드박스 보안 비활성화
driver = webdriver.Chrome(executable_path=os.environ.get("CHROMEDRIVER_PATH"), chrome_options=chrome_options)
mac_toggle = False

async def dc_mac():
	global driver
	global chrome_options
	global mac_toggle
	print(">>> driver set...")
	mac_toggle = True
	driver = webdriver.Chrome(executable_path=os.environ.get("CHROMEDRIVER_PATH"), chrome_options=chrome_options)
	print(">>> driver start")
	url="https://gall.dcinside.com/mgallery/board/lists?id=purikone_redive&exception_mode=recommend"

	user_id="redivehole"
	pw="mimori1004!"

	driver.get(url)

	driver.find_element_by_xpath('//*[@id="top"]/header/div/div[2]/ul/li[9]/a').click()
	driver.find_element_by_name('user_id').send_keys(user_id)
	driver.find_element_by_name('pw').send_keys(pw)
	driver.find_element_by_xpath('//*[@id="container"]/div/article/section/div/div[1]/div/form/fieldset/button').click()

	req = Request('https://raw.githubusercontent.com/YeonNaru/dcmac/main/dcmac.js', headers={"User-Agent": "Mozilla/5.0"})
	script = urlopen(req).read().decode('utf-8')
	print(">>> load script")
	driver.execute_script(script)
	print(">>> inject script")

def dc_mac_close():
	global driver
	global mac_toggle
	mac_toggle = False
	driver.quit()
