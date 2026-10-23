import subprocess,json,concurrent.futures,hashlib,time,io
from PIL import Image
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description='Build OLAF desktop hero clips from preserved native source windows.')
parser.add_argument('--site-root',type=Path,required=True)
parser.add_argument('--masters',type=Path,required=True)
parser.add_argument('--reports',type=Path,required=True)
parser.add_argument('--station',action='append',help='Build selected station IDs; may be repeated')
args=parser.parse_args()
ROOT=args.site_root.resolve();M=args.masters.resolve();W=args.reports.resolve();W.mkdir(parents=True,exist_ok=True)
# Exact source time segments reviewed on native contact sheets. No synthesized frames or enlargement.
C={
'aspensnowmass':{'source':'aspensnowmass-source.mp4','segments':[(4.4,7.7),(12.4,18.6)],'page':'https://www.aspensnowmass.com/','video':'https://vimeo.com/1145980093','credit':'Aspen Snowmass','title':'Aspen Anthem 2025–26 · vídeo oficial de capçalera'},
'cerrocastor':{'source':'cerrocastor-source.mp4','segments':[(7.8,11.6),(14.8,18.7),(19.6,21.8)],'posterTime':15.3,'page':'https://www.cerrocastor.com/es_ar/home.html','video':'https://www.youtube.com/watch?v=bZtjLI2jrCw','credit':'Cerro Castor','title':'Cerro Castor · vídeo oficial'},
'hanazononiseko':{'source':'hanazononiseko-source.mp4','segments':[(.6,11.6)],'crop':[1920,816,0,132],'page':'https://hanazononiseko.com/en/blog/winter-movie-2024','video':'https://www.youtube.com/watch?v=KybKqT2_mFY','credit':'Hanazono Niseko Resort','title':'Where dreams come true · winter movie2024'},
'jacksonhole':{'source':'jacksonhole-source.mp4','segments':[(.0,3.8),(14.6,20.6)],'page':'https://www.jacksonhole.com/','video':'https://vimeo.com/1232865472','credit':'Jackson Hole Mountain Resort','title':'Jackson Hole · vídeo oficial de capçalera'},
'laax':{'source':'laax-source.mp4','segments':[(3.0,12.8)],'page':'https://www.laax.com/en','video':'https://www.youtube.com/watch?v=5czrHgCBTzg','credit':'LAAX','title':'I know a place | Winter in LAAX'},
'rusutsuresort_official':{'source':'rusutsuresort_official-source.mp4','segments':[(13.0,23.0)],'page':'https://rusutsu.com/en/','video':'https://www.youtube.com/watch?v=-BmK6_jI0dk','credit':'Rusutsu Resort','title':'Rusutsu Winter · vídeo oficial2026'},
'skiportillo':{'source':'skiportillo-mountain-source.mp4','segments':[(3.5,13.5)],'page':'https://skiportillo.com/en/home/','video':'https://www.youtube.com/watch?v=ucSGvuasIyo','credit':'Ski Portillo','title':'Ski Portillo Montaña'},
 'tignesofficiel':{'source':'tignesofficiel-source.mp4','segments':[(2.0,6.25),(9.6,15.6)],'crop':[1920,908,0,86],'page':'https://www.tignes.net/','video':'https://www.youtube.com/watch?v=D5bpJ7SRF5Q','credit':'Tignes','title':'Tignes2026–2027 :162jours de ski intense'},
'val_thorens':{'source':'val_thorens-source.mp4','segments':[(3.0,6.4),(11.8,13.6),(19.15,20.6),(21.8,23.6)],'crop':[1920,990,0,0],'page':'https://www.youtube.com/@ValThorens','video':'https://www.youtube.com/watch?v=nJKTlJz5nus','credit':'Val Thorens','title':'Live United Val Thorens'},
'valle_nevado':{'source':'valle_nevado-youtube-source.mp4','segments':[(.5,3.6),(12.4,14.7),(15.6,19.5),(22.0,24.6)],'page':'https://www.vallenevado.com/en/','video':'https://www.youtube.com/watch?v=rdWhg_w96Kk','credit':'Valle Nevado','title':'Las mejores vacaciones de invierno · vídeo oficial'},
'whistlerblackcomb':{'source':'whistlerblackcomb-source.mp4','segments':[(2.4,7.6),(22.0,27.0)],'page':'https://www.youtube.com/@WhistlerBlackcomb','video':'https://www.youtube.com/watch?v=pygD29AgqFA','credit':'Whistler Blackcomb','title':'HOME – The Whistler Blackcomb Movie · tràiler oficial'},
'zermattbergbahnen':{'source':'zermatt-winter-source.mp4','segments':[(11.0,20.8)],'page':'https://www.matterhornparadise.ch/en','video':'https://www.youtube.com/watch?v=BP9CodFnz5c','credit':'Zermatt Bergbahnen / Matterhorn Paradise','title':'Matterhorn Ski Paradise'}
}

def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)],text=True))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def encode(e):
 k,c=e;source=M/c['source'];p=probe(source);v=next(s for s in p['streams']if s['codec_type']=='video');assert v['width']>=1920 and v['height']>=1080,(k,v['width'],v['height']);out=ROOT/'media/hero';out.mkdir(exist_ok=True)
 crop=c.get('crop');targetHeight=crop[1] if crop else 1080;transform=f'crop={crop[0]}:{crop[1]}:{crop[2]}:{crop[3]}' if crop else 'scale=1920:1080:flags=lanczos'
 filters=[]
 for i,(start,end)in enumerate(c['segments']):filters.append(f'[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[s{i}]')
 filters.append(''.join(f'[s{i}]'for i in range(len(c['segments'])))+f'concat=n={len(c["segments"])}:v=1:a=0,{transform},fps=25,setsar=1,format=yuv420p[base]')
 duration=sum(b-a for a,b in c['segments']);fade=.24
 filters.append(f'[base]split=2[body][head];[body]trim=start={fade},setpts=PTS-STARTPTS[main];[head]trim=duration={fade},setpts=PTS-STARTPTS[first];[main][first]xfade=transition=fade:duration={fade}:offset={duration-2*fade:.3f},format=yuv420p[out]')
 files=[]
 for ext in ['webm','mp4']:
  path=out/f'{k}-1080.{ext}'
  cmd=['ffmpeg','-y','-loglevel','error','-filter_complex_threads','1','-threads','2','-i',str(source),'-filter_complex',';'.join(filters),'-map','[out]','-an','-map_metadata','-1','-threads','2']
  cmd+=['-c:v','libvpx-vp9','-crf','34','-b:v','1700k','-maxrate','2400k','-bufsize','4800k','-deadline','good','-cpu-used','4','-row-mt','1','-g','150']if ext=='webm'else['-c:v','libx264','-crf','24','-preset','medium','-maxrate','2500k','-bufsize','5M','-profile:v','high','-level','4.1','-movflags','+faststart','-g','50']

  reusable=False
  if path.exists() and path.stat().st_size>0:
   try:
    old=probe(path);reusable=next(s for s in old['streams'] if s['codec_type']=='video')['height']==targetHeight and abs(float(old['format']['duration'])-(duration-fade))<.15 and (ext=='mp4' or path.stat().st_size<3*1048576)
   except Exception:pass
  if not reusable:run(cmd+[str(path)])
  q=probe(path);st=next(s for s in q['streams']if s['codec_type']=='video');files.append({'path':'./media/hero/'+path.name,'bytes':path.stat().st_size,'sha256':sha(path),'width':st['width'],'height':st['height'],'duration':float(q['format']['duration']),'codec':st['codec_name'],'audio':False});run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'])
 poster=out/f'{k}-poster.webp'
 png=subprocess.check_output(['ffmpeg','-loglevel','error','-threads','2','-ss',str(c.get('posterTime',c['segments'][0][0]+.5)),'-i',str(source),'-frames:v','1','-vf',transform,'-f','image2pipe','-vcodec','png','-threads','1','pipe:1'])
 Image.open(io.BytesIO(png)).convert('RGB').save(poster,'WEBP',quality=84,method=5)
 result=dict(c,id=k,sourceDimensions=[v['width'],v['height']],sourceBytes=source.stat().st_size,sourceSHA256=sha(source),sourceWindowSeconds=[0,30],processing={'resize':('Native crop removes baked bars or captions; no enlargement' if crop else 'Native 1920x1080 or downsample; no enlargement'),'endToStartCrossfade':fade,'speedChanged':False,'motionInterpolation':False,'audio':'Decorative muted context; no audio track','generative':False},derivatives=files,poster={'path':'./media/hero/'+poster.name,'bytes':poster.stat().st_size,'sha256':sha(poster)})
 W.joinpath(k+'-encoded.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(k,'DONE',sum(f['bytes']for f in files),files[0]['duration'],flush=True);return result
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(2)as ex:results=list(ex.map(encode,[(k,c) for k,c in C.items() if not args.station or k in args.station]))
 W.joinpath('encoded-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
