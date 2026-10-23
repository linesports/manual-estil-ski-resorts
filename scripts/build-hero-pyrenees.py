#!/usr/bin/env python3
"""Rebuild the nine official desktop context hero clips; requires ffmpeg, ffprobe and Pillow.
Sources and exact editorial intervals are intentionally explicit below.
See media/hero/pyrenees-manifest.json and the separately preserved source masters.
"""
from pathlib import Path
import subprocess,json,hashlib,concurrent.futures,datetime,io
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
MASTERS=ROOT.parent/'olaf-visual-v2/masters/pyrenees';OUTPUT=ROOT/'media/hero';QA=ROOT.parent/'olaf-visual-v2/pyrenees-qa';QA.mkdir(parents=True,exist_ok=True)
SOURCES={
 'cerleraramon':{'file':'cerleraramon-source.mp4','name':'Cerler','page':'https://www.aramon.com/cerler','url':'https://d32r4yxuun6zdf.cloudfront.net/estaticos/extras/fotos/contenidos/00/00/01/16/13//Web_Cerler_Horizontal-13102026.mp4','segments':[(0.12,7.5)],'poster':0.6},
 'javalambrearamon':{'file':'javalambrearamon-source.mp4','name':'Javalambre','page':'https://www.aramon.com/javalambre','url':'https://d32r4yxuun6zdf.cloudfront.net/estaticos/extras/fotos/contenidos/00/00/01/16/15//Web_Javalambre_Horizontal-13102026.mp4','segments':[(0.12,5.8),(12.0,14.5)],'poster':2.0},
 'formigalpanticosaaramon':{'file':'formigalpanticosaaramon-source.webm','name':'Formigal–Panticosa','page':'https://www.aramon.com/formigal-panticosa','url':'https://d32r4yxuun6zdf.cloudfront.net/estaticos/extras/fotos/contenidos/00/00/01/16/14//slider-formigal-15092026.webm','segments':[(0.12,10.0)],'poster':0.6},
 'grupoaramon':{'file':'grupoaramon-source.mp4','name':'Grup Aramón','page':'https://www.aramon.com/','url':'https://d32r4yxuun6zdf.cloudfront.net/estaticos/extras/fotos/contenidos/00/00/01/16/17//fondo-web_temporada2425_grupo_aramon.mp4','segments':[(0.12,7.2)],'poster':0.8,'note':'Group context montage from the official group homepage; not attributed to one specific resort.'},
 'masellapirineu':{'file':'masellapirineu-source.mp4','name':'Masella','page':'https://www.masella.com/','url':'https://www.youtube.com/watch?v=7FfyzXBW08Y','segments':[(9.2,18.8)],'poster':10.0,'crop':'1920:996:0:84','note':'Removed the original top black matte (84 native pixels); retained active-image resolution1920×996 without enlargement. Official channel linked from resort homepage.'},
 'sierranevadaestacion':{'file':'sierranevadaestacion-source.mp4','name':'Sierra Nevada','page':'https://sierranevada.es/es/','url':'https://www.youtube.com/watch?v=u3bZ2VEQsTM','segments':[(21.2,25.8),(30.8,34.8)],'poster':22.0,'crop':'1920:808:0:136','note':'Official winter2022/23 territorial film from the channel linked by the resort. Cropped original letterbox mattes, retaining1920×808 active picture without synthetic enlargement; no season/current-snow claim.'},
 'ordinoarcalis':{'file':'ordinoarcalis-source.mp4','name':'Ordino Arcalís','page':'https://www.ordinoarcalis.com/es','url':'https://www.youtube.com/watch?v=09iQuIkBTcw','segments':[(0.12,10.5)],'poster':0.8,'note':'Winter2025 official Indomables film; close-up portraits, restaurant scenes and campaign titles excluded.'},
 'palarinsalandorra':{'file':'palarinsalandorra-source.mp4','name':'Pal Arinsal','page':'https://www.palarinsal.com/es','url':'https://www.youtube.com/watch?v=lSqu8Dfc17g','segments':[(1.1,7.6),(13.0,15.3),(17.5,19.1)],'poster':18.0,'note':'Official winter2025 family campaign; restaurant/close-up portraits and closing titles excluded.'}
}
SOURCES['grandvalira']={'file':'grandvalira-campaign-source.mp4','name':'Grandvalira','page':'https://www.grandvalira.com/es/himno-invierno-infinito','url':'https://www.youtube.com/watch?v=GFebwC4fTjQ','segments':[(13.8,15.65),(18.0,19.6),(20.4,23.15),(27.2,28.72)],'poster':23.0,'crop':'1920:808:0:136','note':'Official2025/26 winter campaign, confirmed on the resort campaign page. Original black-and-white grade kept. Musician interiors, close-up faces and campaign titles excluded; native active picture1920×808 after removing letterbox mattes, no enlargement.'}
FADE=.24

def probe(p):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)

def filters(c):
 n=len(c['segments']);parts=[]
 crop=('crop='+c['crop']+',')if c.get('crop')else''
 if n>1:parts.append('[0:v]split='+str(n)+''.join('[s'+str(i)+']'for i in range(n)))
 for i,(start,end)in enumerate(c['segments']):parts.append(f'[{"s"+str(i)if n>1 else"0:v"}]trim=start={start}:end={end},setpts=PTS-STARTPTS,{crop}fps=25,setsar=1[p{i}]')
 elapsed=c['segments'][0][1]-c['segments'][0][0];last='p0'
 for i in range(1,n):
  name='x'+str(i);parts.append(f'[{last}][p{i}]xfade=transition=fade:duration={FADE}:offset={elapsed-FADE:.3f}[{name}]');last=name;elapsed+=c['segments'][i][1]-c['segments'][i][0]-FADE
 parts.append(f'[{last}]split=2[body][head]');parts.append(f'[body]trim=start={FADE},setpts=PTS-STARTPTS[main]');parts.append(f'[head]trim=duration={FADE},setpts=PTS-STARTPTS[start]');parts.append(f'[main][start]xfade=transition=fade:duration={FADE}:offset={elapsed-2*FADE:.3f},format=yuv420p[out]')
 return ';'.join(parts)

def build(kv):
 key,c=kv;p=MASTERS/c['file'];source=probe(p);sv=next(s for s in source['streams']if s['codec_type']=='video');assert sv['width']==1920
 stem=key+('-wide'if c.get('crop')else'-1080');flt=filters(c);derivatives=[]
 for ext in ['mp4','webm']:
  dest=OUTPUT/(stem+'.'+ext);cmd=['ffmpeg','-y','-loglevel','error','-filter_complex_threads','1','-i',str(p),'-filter_complex',flt,'-map','[out]','-an','-map_metadata','-1']
  if ext=='mp4':cmd+=['-c:v','libx264','-crf','24','-preset','medium','-maxrate','2500k','-bufsize','5000k','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart','-g','50','-threads','2']
  else:cmd+=['-c:v','libvpx-vp9','-crf','33','-b:v','2000k','-maxrate','2600k','-bufsize','5200k','-deadline','good','-cpu-used','4','-row-mt','1','-threads','2','-g','100','-pix_fmt','yuv420p']

  if not (RESUME and dest.exists()):run(cmd+[str(dest)])
  result=probe(dest);v=next(s for s in result['streams']if s['codec_type']=='video');run(['ffmpeg','-v','error','-i',str(dest),'-f','null','-'])
  derivatives.append({'path':'./media/hero/'+dest.name,'bytes':dest.stat().st_size,'sha256':sha(dest),'codec':v['codec_name'],'width':v['width'],'height':v['height'],'duration':float(result['format']['duration']),'audio':False,'fullDecode':'passed'})
 poster=OUTPUT/(key+'-poster.webp');vf=(('crop='+c['crop']+',')if c.get('crop')else'')+'format=yuv420p'
 png=subprocess.check_output(['ffmpeg','-v','error','-ss',str(c['poster']),'-i',str(p),'-frames:v','1','-vf',vf,'-c:v','png','-f','image2pipe','pipe:1']);Image.open(io.BytesIO(png)).save(poster,'WEBP',quality=86,method=5)
 record={'station':key,'publisher':c['name'],'sourcePage':c['page'],'sourceUrl':c['url'],'sourceFile':p.name,'sourceSHA256':sha(p),'sourceBytes':p.stat().st_size,'sourceWidth':sv['width'],'sourceHeight':sv['height'],'sourceDuration':float(source['format']['duration']),'segmentsSeconds':c['segments'],'crossfade':FADE,'wrapBlend':True,'crop':c.get('crop'),'generative':False,'enlargement':False,'contextOnly':True,'notes':c.get('note','Official homepage background video; hospitality scenes and close-up portraits excluded.'),'derivatives':derivatives,'poster':{'path':'./media/hero/'+poster.name,'bytes':poster.stat().st_size,'sha256':sha(poster)}}
 metadata=MASTERS/(p.stem+'.info.json')
 if metadata.exists():
  m=json.loads(metadata.read_text());record.update({'sourceTitle':m.get('title'),'published':m.get('upload_date'),'channelUrl':m.get('channel_url')})
 (QA/(key+'-manifest.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2));print('BUILT',key,round(sum(d['bytes']for d in derivatives)/1048576,2),'MiB',flush=True);return record


def write_registry(r):
 entries={}
 for x in r:
     d={z['codec']:z for z in x['derivatives']}
     with Image.open(ROOT/x['poster']['path'][2:]) as poster_image:
         x['poster'].update({'width':poster_image.width,'height':poster_image.height,'sourceTimestamp':SOURCES[x['station']]['poster']})
     entries[x['station']]={
       'webm':d['vp9']['path'],'mp4':d['h264']['path'],'poster':x['poster']['path'],
       'width':d['vp9']['width'],'height':d['vp9']['height'],'duration':d['vp9']['duration'],
       'position':'50% 50%','credit':f"Vídeo · {x['publisher']} · selecció de context",
       'sourceUrl':x['sourcePage'] if 'cloudfront.net' in x['sourceUrl'] else x['sourceUrl'],
       'contextOnly':True
     }
     x['sourceAcquisition']={'retainedFromSeconds':0,'retainedUntilSeconds':x['sourceDuration'],'nativeSourceTrack':True,'fullOriginalPreserved':'cloudfront.net' in x['sourceUrl'],'audioInSourceClip':any(s['codec_type']=='audio' for s in json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(MASTERS/x['sourceFile'])]))['streams'])}
     x['rights']='Publicació pública oficial del titular identificat. La metadada no aporta una llicència Creative Commons ni una autorització de redistribució; es manté la procedència i aquesta preview local no acredita cap cessió de drets.'
     x['review']={'visual':'Revisió de fotogrames amb temps exactes; s’exclouen carteles, músics, restaurants i retrats propers dels intervals seleccionats. Es preserva l’acció d’esquí i el paisatge real.','sourceIdentity':'URL de vídeo de portada oficial o canal de YouTube enllaçat des del portal oficial de cada estació. Javalambre prové expressament d’aramon.com/javalambre; no del redirect que porta a Valdelinares.','technical':'Full ffmpeg decode passed for both derivatives; HTTP and desktop browser results saved separately.'}
     if x['station']=='grandvalira':x['review']['length']='6,76 s seleccionats per evitar artistes i missatges de campanya; el blanc i negre és original.'
 api='/* Vídeos reals oficials de context territorial. Vegeu media/hero/pyrenees-manifest.json. */\n(function () {\n  window.OLAF_HERO_MEDIA = window.OLAF_HERO_MEDIA || {};\n  window.OLAF_HERO_MEDIA.stations = Object.assign(window.OLAF_HERO_MEDIA.stations || {}, '+json.dumps(entries,ensure_ascii=False,indent=2)+');\n})();\n'
 (ROOT/'hero-media-pyrenees.js').write_text(api)
 manifest={'version':1,'date':datetime.date.today().isoformat(),'scope':'Desktop-only context hero videos; separate from publication evidence. No generated footage, no AI upscaling, no added text or grading.','processing':{'fps':25,'crossfadeSeconds':.24,'endToStartBlend':True,'intermediate':'Direct trim/crossfade filter graph; no uncompressed intermediates.','webm':'VP9, CRF33, 2 Mbit target, 2.6 Mbit ceiling, yuv420p','mp4':'H.264 high profile, CRF24, 2.5 Mbit ceiling, yuv420p, faststart','poster':'WebP at native active-image dimensions, quality86','audio':'No audio in served context loops. YouTube native video-only stream retained as master.'},'stationCount':len(r),'serviceVideoBytes':sum(z['bytes']for x in r for z in x['derivatives']),'servicePosterBytes':sum(x['poster']['bytes']for x in r),'sourceBytes':sum(x['sourceBytes']for x in r),'stations':r}
 text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
 (ROOT/'media/hero/pyrenees-manifest.json').write_text(text)
 (MASTERS/'pyrenees-provenance.json').write_text(text)
 (QA/'final-manifest.json').write_text(text)

if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--masters', type=Path, default=MASTERS)
 ap.add_argument('--qa', type=Path, default=QA)
 ap.add_argument('--resume', action='store_true', help='Reuse existing derivative files; only safe when configuration is unchanged.')
 args=ap.parse_args(); MASTERS=args.masters; QA=args.qa; QA.mkdir(parents=True, exist_ok=True); OUTPUT.mkdir(parents=True, exist_ok=True); RESUME=args.resume
 with concurrent.futures.ThreadPoolExecutor(2)as pool:records=list(pool.map(build,SOURCES.items()))
 (QA/'lot-progress.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
 write_registry(records)
