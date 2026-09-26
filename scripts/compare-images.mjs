// Pixel comparison of two PNG screenshots: share of pixels whose largest
// channel difference exceeds a threshold, plus the mean absolute difference.
import sharp from 'sharp';
const [a,b,threshold='16',diffOut]=process.argv.slice(2);
const load=async p=>sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const [x,y]=await Promise.all([load(a),load(b)]);
if(x.info.width!==y.info.width||x.info.height!==y.info.height)throw new Error('Tamanhos diferentes');
let over=0,sum=0;const n=x.info.width*x.info.height,diff=Buffer.alloc(n*4);
for(let i=0;i<n;i++){let m=0;for(let c=0;c<3;c++){const d=Math.abs(x.data[i*4+c]-y.data[i*4+c]);m=Math.max(m,d);sum+=d;}if(m>+threshold){over++;diff[i*4]=255;diff[i*4+3]=255;}else{const g=x.data[i*4+1]>>2;diff[i*4]=g;diff[i*4+1]=g;diff[i*4+2]=g;diff[i*4+3]=255;}}
if(diffOut)await sharp(diff,{raw:{width:x.info.width,height:x.info.height,channels:4}}).png().toFile(diffOut);
console.log(JSON.stringify({over,share:+(over/n*100).toFixed(3),meanAbs:+(sum/n/3).toFixed(3)}));
