#!/usr/bin/env python3
"""Build OLAF's desktop context hero from a separately preserved official master."""
import argparse,concurrent.futures,hashlib,json,subprocess
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SEGMENTS=[(24.0,25.40),(18.0,19.50),(35.96,38.76),(44.96,48.56),(52.0,54.60),(56.32,58.44),(21.72,24.0)]
FPS=25;FADE=.24

def run(args):subprocess.run(args,check=True)
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],text=True))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source',type=Path,required=True);ap.add_argument('--masters',type=Path,required=True);ap.add_argument('--work',type=Path,required=True);a=ap.parse_args();a.work.mkdir(parents=True,exist_ok=True);a.masters.mkdir(parents=True,exist_ok=True);output=ROOT/'media/hero';output.mkdir(parents=True,exist_ok=True)
 source_probe=probe(a.source);v=next(s for s in source_probe['streams']if s['codec_type']=='video');assert(v['width'],v['height'])==(3840,2160),'Use the selected native4K source, not a thumbnail or upscaled clip.'
 def extract(entry):
  i,(start,end)=entry;p=a.work/f'hero-part-{i}.mkv';run(['ffmpeg','-y','-loglevel','error','-ss',str(start),'-i',str(a.source),'-t',str(round(end-start,3)),'-an','-vf','scale=1920:1080:flags=lanczos,fps=25,setsar=1','-c:v','ffv1','-level','3','-g','1','-pix_fmt','yuv420p','-threads','2',str(p)]);return p
 with concurrent.futures.ThreadPoolExecutor(2)as pool:parts=list(pool.map(extract,enumerate(SEGMENTS)))
 filters=[];elapsed=SEGMENTS[0][1]-SEGMENTS[0][0];last='0:v'
 for i in range(1,len(parts)):
  new=f'fade{i}';filters.append(f'[{last}][{i}:v]xfade=transition=fade:duration={FADE}:offset={elapsed-FADE:.3f}[{new}]');elapsed+=SEGMENTS[i][1]-SEGMENTS[i][0]-FADE;last=new
 base=a.work/'hero-linear.mkv';inputs=[item for p in parts for item in ['-i',str(p)]];run(['ffmpeg','-y','-loglevel','error','-filter_complex_threads','2',*inputs,'-filter_complex',';'.join(filters),'-map',f'[{last}]','-an','-c:v','ffv1','-level','3','-g','1','-pix_fmt','yuv420p','-threads','2',str(base)])
 # Blend the last240ms into the first240ms and start after that overlap.
 duration=float(probe(base)['format']['duration']);loop=a.work/'hero-loop.mkv';wrap=f'[0:v]split=2[body][head];[body]trim=start={FADE},setpts=PTS-STARTPTS[main];[head]trim=duration={FADE},setpts=PTS-STARTPTS[start];[main][start]xfade=transition=fade:duration={FADE}:offset={duration-2*FADE:.3f},format=yuv420p[out]'
 run(['ffmpeg','-y','-loglevel','error','-filter_complex_threads','2','-i',str(base),'-filter_complex',wrap,'-map','[out]','-an','-c:v','ffv1','-level','3','-g','1','-pix_fmt','yuv420p','-threads','2',str(loop)])
 def encode(extension):
  p=output/('baqueira-beret-1080.'+extension);args=['ffmpeg','-y','-loglevel','error','-i',str(loop),'-an','-map_metadata','-1']
  if extension=='webm':args+=['-c:v','libvpx-vp9','-crf','33','-b:v','0','-deadline','good','-cpu-used','2','-row-mt','1','-tile-columns','2','-threads','4','-g','150','-pix_fmt','yuv420p']
  else:args+=['-c:v','libx264','-crf','23','-preset','slow','-maxrate','3M','-bufsize','6M','-profile:v','high','-level','4.1','-movflags','+faststart','-threads','4','-g','50','-pix_fmt','yuv420p']
  run(args+[str(p)]);return p
 with concurrent.futures.ThreadPoolExecutor(2)as pool:encoded=list(pool.map(encode,['webm','mp4']))
 poster_png=a.masters/'baqueira-hero-poster-native-4k.png';run(['ffmpeg','-y','-loglevel','error','-ss',str(SEGMENTS[0][0]+FADE),'-i',str(a.source),'-frames:v','1',str(poster_png)])
 image=Image.open(poster_png).convert('RGB');image=image.resize((1920,1080),Image.Resampling.LANCZOS)
 poster=output/'baqueira-beret-poster.webp';image.save(poster,quality=90,method=6);image.save(output/'baqueira-beret-poster.avif',quality=65,speed=6)
 derivatives=[]
 for p in encoded:
  data=probe(p);stream=next(s for s in data['streams']if s['codec_type']=='video');assert(stream['width'],stream['height'])==(1920,1080);assert not any(s['codec_type']=='audio'for s in data['streams']);derivatives.append({'path':'./media/hero/'+p.name,'bytes':p.stat().st_size,'sha256':sha(p),'codec':stream['codec_name'],'pixelFormat':stream['pix_fmt'],'width':stream['width'],'height':stream['height'],'duration':float(data['format']['duration']),'frameRate':stream['r_frame_rate'],'audio':False})
 final_duration=derivatives[0]['duration'];entry={'webm':'./media/hero/baqueira-beret-1080.webm','mp4':'./media/hero/baqueira-beret-1080.mp4','poster':'./media/hero/baqueira-beret-poster.webp','posterAvif':'./media/hero/baqueira-beret-poster.avif','width':1920,'height':1080,'duration':final_duration,'position':'50% 50%','credit':'Vídeo · Baqueira Beret · Made in Baqueira (2026) · selecció de context','sourceUrl':'https://www.youtube.com/watch?v=9nWbOswvwIc','contextOnly':True}
 (ROOT/'hero-media.js').write_text('window.OLAF_HERO_MEDIA = '+json.dumps({'stations':{'baqueira_beret':entry}},ensure_ascii=False,indent=2)+';\n')
 manifest={'scope':'Desktop only; context hero, separate from publication evidence','source':{'path':a.source.name,'sha256':sha(a.source),'width':3840,'height':2160,'duration':float(source_probe['format']['duration']),'videoCodec':v['codec_name'],'publisher':'Baqueira Beret','sourceUrl':entry['sourceUrl'],'channelUrl':'https://www.youtube.com/channel/UCbIS66MjEoRw9gILxNLZVTw','published':'2026-10-15','title':'MADE IN BAQUEIRA – Trailer Temporada62 – Baqueira Beret','copyrightStatus':'Official public publication by Baqueira Beret; no Creative Commons or reuse license supplied in source metadata. Rights remain with the source rightsholders. This local preview does not establish a redistribution grant.'},'processing':{'segmentsSeconds':SEGMENTS,'outputFrameRate':FPS,'outputSize':[1920,1080],'scale':'Lanczos reduction from native3840×2160; no enlargement','crossfadeSeconds':FADE,'endToStartBlend':True,'audio':'Muted hero; original video-only source track preserved. No audio track in service variants.','generativeSynthesis':False,'motionInterpolation':False,'overlaysAdded':False,'gradeAdded':False,'cropAdded':False,'intermediate':'Lossless FFV1'},'derivatives':derivatives,'poster':{'path':entry['poster'],'width':1920,'height':1080,'sourceTimestamp':SEGMENTS[0][0]+FADE,'nativeMaster':poster_png.name,'nativeSize':[3840,2160]},'review':{'selectedSourceFrames':'Reviewed contact sheets with exact source timestamps; title cards and close-up character scenes excluded.','remaining':'Rendered service variants and browser playback checked separately.'}}
 text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n';(output/'manifest.json').write_text(text);(a.masters/'hero-provenance.json').write_text(text);print(json.dumps({'duration':final_duration,'variants':[{k:d[k]for k in ['path','bytes','codec']}for d in derivatives]},indent=2))
if __name__=='__main__':main()
