"""Run from the repository root after npm run build. Requires Python Playwright
and Chromium. Set CHROME to an executable to override Playwright's browser.
Test URLs are fulfilled from dist so the run is independent of a web server.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time,os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROME'),args=['--no-sandbox','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':800,'height':480}); errors=[];page.on('pageerror',lambda e:errors.append(str(e))); page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def serve(route):
  path=route.request.url.split('station.test/')[1].split('?')[0] or 'index.html';route.fulfill(path=str(Path('dist')/path))
 page.route('http://station.test/**',serve)
 page.add_init_script("""if(!localStorage.getItem('aftersignal-east-bank-v2-settings'))localStorage.setItem('aftersignal-east-bank-v2-settings',JSON.stringify({quality:'Low',volume:0,reduced:true,sensitivity:1,guide:true}));""")
 page.set_default_timeout(100000);page.goto('http://station.test/?profile');page.wait_for_function('window.stationProfile?.mode==="menu"')
 def click(id):page.locator('#'+id).dispatch_event('click')
 def label(name):page.locator('#panel-body').get_by_role('button',name=name,exact=True).dispatch_event('click')
 def shot(name):page.screenshot(path='docs/evidence/'+name+'.jpg',quality=88,timeout=90000)
 def stats():
  return page.evaluate("""async()=>{let a=[],last=performance.now();await new Promise(done=>{function frame(now){a.push(now-last);last=now;if(a.length<25)requestAnimationFrame(frame);else done()}requestAnimationFrame(frame)});a.shift();a.sort((x,y)=>x-y);return {sample:a.length,medianMs:a[Math.floor(a.length/2)],p95Ms:a[Math.floor(a.length*.95)],meanFPS:1000*a.length/a.reduce((x,y)=>x+y,0),readyMs:performance.getEntriesByName('station-ready')[0].startTime,heapBytes:performance.memory?.usedJSHeapSize,...stationProfile}}""")
 def walk(x,z):
  val=page.evaluate("""async ([x,z])=>{const held=new Set(),start=performance.now();function key(code,on){if(on===held.has(code))return;document.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));if(on)held.add(code);else held.delete(code)}return await new Promise((ok,fail)=>{function step(){const p=stationProfile,dx=x-p.x,dz=z-p.z,a=p.yaw;const side=dx*Math.cos(a)+dz*Math.sin(a),front=dx*Math.sin(a)-dz*Math.cos(a);if(Math.hypot(dx,dz)<.62||performance.now()-start>90000){for(const k of [...held])key(k,false);return ok({x:p.x,z:p.z,dist:Math.hypot(dx,dz)})}key('ShiftLeft',true);key('KeyW',front>.23);key('KeyS',front<-.23);key('KeyD',side>.23);key('KeyA',side<-.23);requestAnimationFrame(step)}step()})}""",[x,z]);print('walk',val,flush=True);assert val['dist']<.7,val
 def use():page.keyboard.press('e')
 report={'menu':stats()};print(report,flush=True)
 click('chapters');label('01 · The Awakening');click('next');click('skip');walk(-1,14);use();label('Log transmission')
 use();label('Copy to field book');walk(0,9);walk(-4,-4);walk(-8,-4.5);use();assert page.locator('#objective').inner_text()=='Restore the intake generator'
 use();label('Copy to field book');click('journal');assert 'Mara Sol' in page.locator('#panel-body').inner_text();label('Drink from flask');label('Station map');label('Field book');label('Close')
 click('pause');label('Main menu');assert page.locator('#continue').is_enabled();click('continue');walk(6,-5);walk(7,-6.7);use();label('Fit fuse and start pump');use()
 walk(5,4.3);use();label('70.8 MHz');assert 'Carrier noise' in page.locator('#feedback').inner_text();label('71.4 MHz')
 walk(1,5.2);walk(0,-4);walk(0,-12);walk(1,-18.2);use();label('Keep the evidence');report['yard']=stats();shot('mission-archive')
 walk(1,-11);walk(1,-3);walk(3.3,2.4);use();label('Reply to Neri');assert page.locator('#panel-title').inner_text()=='End of Day One';shot('ending');label('Return to station');click('pause');label('Main menu');page.reload();page.wait_for_function('window.stationProfile?.mode==="menu"');click('continue');assert 'complete' in page.locator('#objective').inner_text().lower()
 report['errors']=errors;Path('docs/evidence/software-profile.json').write_text(json.dumps(report,indent=2));print('PASS',report,flush=True);b.close()
