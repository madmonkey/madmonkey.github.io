<div align="center">
  <a href="https://piratesocial.app">
    <img src="public/images/logoImage.svg" alt="Pirate Social Logo" width="200" height="200">
  </a>
  <h1>Pirate Social</h1>
  <h3>Own Your Content • Connect Your Community • Sail the Open Web</h3>

  <p>
    <img src="https://img.shields.io/badge/Astro-6-FF5D01?logo=astro" alt="Astro 6">
    <img src="https://img.shields.io/badge/Preact-10-673AB8?logo=preact" alt="Preact 10">
    <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind 4">
    <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8" alt="PWA Enabled">
  </p>

  <p>
    <a href="https://piratesocial.app">View Demo</a>
    ☠️
    <a href="https://github.com/piratewebsite/piratesocial/issues/new?labels=bug">Report Bug</a>
    ☠️
    <a href="https://github.com/piratewebsite/piratesocial/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

---

Social media shouldn't be owned by a single company, run for profit, or subject to the whims of any one platform. **Pirate Social** is the fix — a completely independent, decentralized social network built on RSS where **every user owns their own website and content**.

Each user gets a free static site deployed on GitHub Pages, Netlify, or Vercel. Sites discover and connect with each other through standard RSS feeds and a shared network. No algorithms. No ads. No corporate overlord. If a platform disappears tomorrow, your content stays right where it is — on your site, under your control.

Built on top of the latest open source tools, Pirate Social adds a full social layer: follows, likes, comments, real-time notifications, Bluesky cross-posting, YouTube playlists, RSS feed aggregation, and more.

<p align="center"><strong>Deploy free on GitHub Pages, Netlify, or Vercel</strong></p>

## How It Works

Every user runs their own independent website. Pirate Social connects these sites into a network using RSS — the same open standard that's powered the web for decades. Your site publishes an RSS feed, Pirate Social aggregates feeds from everyone in the network, and you get a social timeline without giving up ownership of anything.

```
        ┌─────────────-┐     ┌─────────────-┐     ┌─────────────┐
        │  Your Site   │     │  Their Site  │     │  Any Site   │
        │  (Astro SSG) │     │  (Astro SSG) │     │  (Astro SSG)│
        │  GitHub Pages│     │  Netlify     │     │  Vercel     │
        │       │      │     │       │      │     │       │     │
        │   RSS Feed   │     │   RSS Feed   │     │   RSS Feed  │
        └───────┬──────┘     └───────┬──────┘     └───────┬─────┘
                │                    │                    │
                └────────────┬───────┘────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PIRATE SOCIAL  │
                    │                 │
                    │  Aggregates RSS │
                    │  Follows/Likes  │
                    │  Comments       │
                    │  Notifications  │
                    │  Directory      │
                    │  Bluesky bridge │
                    └─────────────────┘
```

## Features

### 📸 Photography Publishing
- **EXIF metadata** — auto-extracted or manual (camera, lens, focal length, aperture, shutter, ISO)
- **Photo galleries** with lightbox overlay
- **Slideshows** with fade, slide, zoom, and Ken Burns transitions
- **Image optimization** via Astro + Sharp
- **Visibility controls** — site only, site + social crosspost, or private (password protected)

### 🌐 Decentralized Social Network
- **RSS-powered federation** — sites connect through open standards, not proprietary APIs
- **Follow** other photographers and creators across the network
- **Like and comment** on posts — comments merge with Bluesky replies
- **Real-time notifications** via Server-Sent Events
- **Discover feed** — browse all public posts across the network
- **User directory** with search
- **Personalized timeline** — posts from people you follow + your RSS subscriptions
- **No vendor lock-in** — your site works independently even without Pirate Social

### 🦋 Bluesky Integration
- **Connect your Bluesky account** via app password
- **Auto-crosspost** photos to Bluesky (controlled per-post via visibility setting)
- **Merged comments** — Bluesky thread replies appear alongside Pirate Social comments
- **Bluesky timeline** — browse your Bluesky feed inside your site
- **Like, reply, and interact** across both platforms

### 🎵 YouTube Player
- **Ad-free playback** — no YouTube API loaded, no ads served
- **Playlist support** with custom track list UI
- **Audio-only mode** for music/podcasts
- **Floating mini-player** — persists across page navigation
- **Docked mode** — inline on any page via content blocks
- **Start/end time trimming** per track

### 📄 Content Management
- **Sveltia CMS** — edit posts, galleries, and settings from the browser via GitHub
- **Drag-and-drop page builder** with 8 block types:
  - Hero banner, Profile card, Recent posts grid, YouTube video, Photo gallery, Text/Markdown, Image, Location/map
- **Markdown + MDX** posts with tags and categories
- **RSS feed generation** with custom photo/social XML namespaces
- **External RSS subscriptions** — follow any RSS feed in your timeline

### ⚡ Performance & PWA
- Static site generation — fast page loads, no server needed per user
- PWA-ready with offline support and installable manifest
- Auto-generated sitemap and SEO meta tags
- Responsive images with Astro Assets

## Getting Started

### Join the network

1. Sign in at [piratesocial.app](https://piratesocial.app) with GitHub
2. Pirate Social provisions your site repo and first build triggers automatically
3. Go to `yoursite.github.io/admin` to manage content via Sveltia CMS
4. Go to `yoursite.github.io/social` to connect your Bluesky account and access your Pirate Social feed

### Local Development

```bash
# Clone the template
git clone https://github.com/piratewebsite/piratesocial.git
cd piratesocial/node-template

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Hosting Options

<table>
  <tr>
    <td align="center" width="33%">
      <strong>GitHub Pages</strong><br>
      <a href="https://github.com/piratewebsite/piratesocial/generate">Use Template</a>
    </td>
    <td align="center" width="33%">
      <strong>Netlify</strong><br>
      <a href="https://app.netlify.com/start/deploy?repository=https://github.com/piratewebsite/piratesocial">Deploy to Netlify</a>
    </td>
    <td align="center" width="33%">
      <strong>Vercel</strong><br>
      <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpiratewebsite%2Fpiratesocial">Deploy to Vercel</a>
    </td>
  </tr>
</table>

## Project Structure

```
node-template/
├── src/
│   ├── components/         # YouTubePlayer, Slideshow, Gallery,
│   │   │                   #   EXIF, SocialActions, Blocks
│   │   └── blocks/         # HeroBlock, ProfileBlock, YouTubeBlock,
│   │                       #   GalleryBlock, TextBlock, ImageBlock,
│   │                       #   LocationBlock, RecentPostsBlock
│   ├── content/            # Posts, galleries, slideshows, pages,
│   │                       #   settings, theme, labels, PWA config
│   ├── layouts/            # BaseLayout with floating player
│   ├── lib/                # API client, site config
│   └── pages/              # index, about, social, posts/,
│                           #   galleries/, settings/, feed.xml
├── public/admin/           # Sveltia CMS configuration
└── .github/workflows/      # Auto-deploy to GitHub Pages
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (Static Site Generation) |
| UI | Preact 10 |
| Styling | Tailwind CSS 4 |
| Content | Markdown + MDX |
| CMS | Sveltia CMS (GitHub backend) |
| Auth | GitHub OAuth |
| Federation | RSS with custom photo/social namespaces |
| Bluesky | AT Protocol (`@atproto/api`) |
| Images | Sharp (auto-optimization) |
| Hosting | GitHub Pages, Netlify, or Vercel (free) |

## Custom RSS Namespace

Posts syndicate with extended metadata for rich social feeds:

```xml
<rss xmlns:photo="https://piratesocial.app/ns/photo"
     xmlns:social="https://piratesocial.app/ns/social">
  <channel>
    <social:profilePhoto>...</social:profilePhoto>
    <social:bio>...</social:bio>
    <item>
      <photo:image>...</photo:image>
      <photo:exif>
        <photo:camera>Sony A7IV</photo:camera>
        <photo:aperture>2.8</photo:aperture>
      </photo:exif>
      <photo:gallery>
        <photo:image url="..." caption="..." />
      </photo:gallery>
    </item>
  </channel>
</rss>
```

## License

MIT