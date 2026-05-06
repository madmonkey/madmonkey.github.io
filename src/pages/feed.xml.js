import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig, cleanSlug } from '../lib/config';

export async function GET(context) {
  const posts = (await getCollection('posts'))
    .filter(p => !p.data.draft && p.data.visibility !== 'private')
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const galleries = (await getCollection('galleries'))
    .filter((g) => !g.data?.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  // Build items from both posts and galleries
  const postItems = posts.map(post => {
    const imageUrl = post.data.image
      ? `${siteConfig.siteUrl}${typeof post.data.image === 'string' ? post.data.image : post.data.image.src}`
      : '';

    // Build custom photo namespace XML
    let customXml = '';

    if (imageUrl) {
      customXml += `<photo:image>${imageUrl}</photo:image>\n`;
      customXml += `<media:content url="${imageUrl}" medium="image" />\n`;
    }

    if (post.data.exif) {
      customXml += `<photo:exif>\n`;
      if (post.data.exif.camera) customXml += `  <photo:camera>${post.data.exif.camera}</photo:camera>\n`;
      if (post.data.exif.lens) customXml += `  <photo:lens>${post.data.exif.lens}</photo:lens>\n`;
      if (post.data.exif.focalLength) customXml += `  <photo:focalLength>${post.data.exif.focalLength}</photo:focalLength>\n`;
      if (post.data.exif.aperture) customXml += `  <photo:aperture>${post.data.exif.aperture}</photo:aperture>\n`;
      if (post.data.exif.shutterSpeed) customXml += `  <photo:shutterSpeed>${post.data.exif.shutterSpeed}</photo:shutterSpeed>\n`;
      if (post.data.exif.iso) customXml += `  <photo:iso>${post.data.exif.iso}</photo:iso>\n`;
      if (post.data.exif.dateTaken) customXml += `  <photo:dateTaken>${post.data.exif.dateTaken}</photo:dateTaken>\n`;
      customXml += `</photo:exif>\n`;
    }

    if (post.data.gallery?.length) {
      customXml += `<photo:gallery>\n`;
      for (const img of post.data.gallery) {
        const src = typeof img.src === 'string' ? img.src : img.src.src;
        customXml += `  <photo:image url="${siteConfig.siteUrl}${src}" caption="${img.caption || ''}" alt="${img.alt || ''}" />\n`;
      }
      customXml += `</photo:gallery>\n`;
    }

    return {
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description || '',
      link: `/posts/${cleanSlug(post.id)}/`,
      categories: post.data.tags,
      customData: customXml,
    };
  });

  const galleryItems = galleries.map(g => ({
    title: `[Gallery] ${g.data.title}`,
    pubDate: g.data.pubDate,
    description: g.data.description || `Photo gallery with ${g.data.photos.length} images`,
    link: `/galleries/${cleanSlug(g.id)}/`,
    categories: g.data.tags,
    customData: `<photo:gallery>\n${g.data.photos.map(p => {
      const src = typeof p.src === 'string' ? p.src : p.src.src;
      return `  <photo:image url="${siteConfig.siteUrl}${src}" caption="${p.caption || ''}" alt="${p.alt || ''}" />`;
    }).join('\n')}\n</photo:gallery>`,
  }));

  const allItems = [...postItems, ...galleryItems].sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: allItems,
    xmlns: {
      photo: 'https://piratesocial.app/ns/photo',
      media: 'http://search.yahoo.com/mrss/',
      social: 'https://piratesocial.app/ns/social',
    },
    customData: `
      <language>en-us</language>
      <social:hub>${siteConfig.hubUrl}</social:hub>
      <social:profilePhoto>${siteConfig.siteUrl}${siteConfig.avatar}</social:profilePhoto>
      <social:bio>${siteConfig.bio}</social:bio>
      <social:author>${siteConfig.author}</social:author>
      ${siteConfig.camera ? `<social:camera>${siteConfig.camera}</social:camera>` : ''}
      ${siteConfig.location ? `<social:location>${siteConfig.location}</social:location>` : ''}
    `,
  });
}
