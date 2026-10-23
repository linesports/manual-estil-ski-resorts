(function (root) {
  'use strict';

  // Context photographs only. Evidence images keep their original references.
  const defaultSizes = '(min-width: 1700px) 76vw, 79vw';

  function prepare(scene) {
    const photo = scene?.photo || {};
    return {
      src: photo.src || scene?.image || '',
      srcset: photo.srcset || '',
      avifSrcset: photo.avifSrcset || '',
      sizes: photo.sizes || defaultSizes,
      width: Number(photo.width) || null,
      height: Number(photo.height) || null,
      position: scene?.position || photo.position || '50% 37%',
      displayWidth: Number(photo.displayWidth) || null,
      restored: photo.processing === 'SwinIR lightweight_sr x4'
    };
  }

  function apply(image, scene) {
    const candidate = prepare(scene);
    if (!image || !candidate.src) return candidate;

    let picture = image.parentElement?.tagName === 'PICTURE' ? image.parentElement : null;
    if (!picture && candidate.avifSrcset && image.parentNode) {
      picture = image.ownerDocument.createElement('picture');
      picture.className = 'scene-picture';
      image.parentNode.insertBefore(picture, image);
      picture.append(image);
    }
    if (picture) {
      picture.querySelectorAll('source[data-scene-source]').forEach(source => source.remove());
      if (candidate.avifSrcset) {
        const source = image.ownerDocument.createElement('source');
        source.dataset.sceneSource = 'desktop-avif';
        source.type = 'image/avif';
        source.sizes = candidate.sizes;
        source.srcset = candidate.avifSrcset;
        picture.insertBefore(source, image);
      }
    }

    if (candidate.width && candidate.height) {
      image.width = candidate.width;
      image.height = candidate.height;
    } else {
      image.removeAttribute('width');
      image.removeAttribute('height');
    }
    if (candidate.srcset) {
      image.sizes = candidate.sizes;
      image.srcset = candidate.srcset;
    } else {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
    image.decoding = 'async';
    image.fetchPriority = 'high';
    image.style.objectPosition = candidate.position;
    image.dataset.photoQuality = candidate.restored ? 'restored' : 'original';
    image.dataset.photoLimited = candidate.displayWidth ? 'true' : 'false';
    if (picture) {
      picture.dataset.photoLimited = image.dataset.photoLimited;
      picture.style.setProperty('--scene-native-display-width', candidate.displayWidth ? candidate.displayWidth + 'px' : '100%');
    }
    image.src = candidate.src;
    return candidate;
  }

  root.OLAF_SCENE_PHOTO = { prepare, apply };
})(typeof window !== 'undefined' ? window : globalThis);
