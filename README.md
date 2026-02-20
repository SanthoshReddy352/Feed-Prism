# Feed Prism — Your Intelligent News Command Center

Feed Prism is a powerful news aggregator and intelligence platform built with Next.js and Supabase. It fetches and categorizes news from 500+ global sources in real time.

## Key Features

- **Real-time Aggregation**: Automatically fetches news from RSS/Atom feeds every 15 minutes.
- **Intelligent Filtering**: Smart deduplication and categorization of articles.
- **Modern Dashboard**: High-fidelity UI with dark mode, bookmarks, and search.
- **Company Intelligence**: Dedicated monitoring for tech giants and startups.
- **Outbreak Alerts**: Stay informed on global health and security events.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Database/Auth**: [Supabase](https://supabase.com)
- **Styling**: Vanilla CSS with CSS Modules
- **Icons**: [Lucide React](https://lucide.dev)
- **Parsing**: `fast-xml-parser`

## Documentation

- [Ingestion Pipeline](./docs/ingestion-pipeline.md)
