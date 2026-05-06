import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      gallery: z
        .array(
          z.object({
            src: z.string(),
            alt: z.string().optional(),
            caption: z.string().optional(),
          })
        )
        .optional(),
      /** EXIF override (auto-extracted at build if not provided) */
      exif: z
        .object({
          camera: z.string().optional(),
          lens: z.string().optional(),
          focalLength: z.string().optional(),
          aperture: z.string().optional(),
          shutterSpeed: z.string().optional(),
          iso: z.string().optional(),
          dateTaken: z.string().optional(),
        })
        .optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      visibility: z.enum(['site', 'social', 'private']).default('site'),
      privatePassword: z.string().optional(),
    }),
});

const galleries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galleries' }),
  schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      draft: z.boolean().default(false),
      coverImage: z.string().optional(),
      photos: z.array(
        z.object({
          src: z.string(),
          alt: z.string().optional(),
          caption: z.string().optional(),
        })
      ).default([]),
      quickPhotos: z.array(z.string()).optional(),
      tags: z.array(z.string()).default([]),
      /** Slideshow transition style */
      slideshowStyle: z.enum(['fade', 'slide', 'zoom']).default('fade'),
      /** Auto-advance interval in seconds (0 = manual) */
      slideshowInterval: z.number().default(0),
    }),
});

const slideshows = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/slideshows' }),
  schema: z.object({
      title: z.string(),
      description: z.string().optional(),
  draft: z.boolean().default(false),
      transition: z.enum(['fade', 'slide', 'zoom', 'kenburns']).default('fade'),
      interval: z.number().default(5),
      autoplay: z.boolean().default(true),
      loop: z.boolean().default(true),
      showCaptions: z.boolean().default(true),
      showExif: z.boolean().default(false),
      photos: z.array(
        z.object({
          src: z.string(),
          alt: z.string().optional(),
          caption: z.string().optional(),
          credit: z.string().optional(),
        })
      ),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/pages' }),
  schema: z.object({
      title: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      showInNav: z.boolean().default(false),
      blocks: z.array(z.any()).default([]),
    }),
});

export const collections = { posts, galleries, slideshows, pages };
