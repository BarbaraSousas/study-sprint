import type { YouTubeVideo, VideoSearchTerm } from '@studysprint/shared';

const AGENTQL_API_KEY = process.env.AGENTQL_API_KEY;
const AGENTQL_API_URL = 'https://api.agentql.com/v1/query-data';
const REQUEST_TIMEOUT = 60000; // 60 seconds - AgentQL needs time to load YouTube
const RATE_LIMIT_DELAY = 2000;
const MAX_REQUESTS_PER_BATCH = 2; // Reduce batch size to avoid overwhelming

interface AgentQLVideo {
  video_link?: string;
  video_title?: string;
  channel_name?: string;
  view_count?: string;
  duration?: string;
  thumbnail_url?: string;
}

interface AgentQLResponse {
  data?: {
    videos?: AgentQLVideo[];
  };
  error?: string;
}

function parseDuration(duration: string): number {
  if (!duration) return 0;

  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseInt(duration) || 0;
}

function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function transformAgentQLVideo(video: AgentQLVideo): YouTubeVideo | null {
  const videoId = extractVideoId(video.video_link || '');
  if (!videoId) return null;

  return {
    videoId,
    title: video.video_title || 'Untitled',
    channel: video.channel_name || 'Unknown Channel',
    thumbnail: video.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    duration: video.duration || '0:00',
    durationSeconds: parseDuration(video.duration || ''),
    views: video.view_count || '0',
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class YouTubeService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = AGENTQL_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async searchVideos(searchTerm: VideoSearchTerm): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      console.log('[YouTubeService] No API key configured, skipping video search');
      return [];
    }

    const maxResults = searchTerm.maxResults || 3;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm.query)}`;

    const query = `
{
  videos[] {
    video_link
    video_title
    channel_name
    view_count
    duration
    thumbnail_url
  }
}`;

    try {
      console.log(`[YouTubeService] Searching for: "${searchTerm.query}"`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const requestBody = {
        url: youtubeUrl,
        query: query.trim(),
        params: {
          wait_for: 5, // Wait 5 seconds for YouTube to load
          mode: 'fast',
          is_scroll_to_bottom_enabled: false,
        },
      };

      console.log(`[YouTubeService] Requesting AgentQL API...`);

      const response = await fetch(AGENTQL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[YouTubeService] API error: ${response.status} ${response.statusText}`, errorText);
        return this.getFallbackResult(searchTerm);
      }

      const data: AgentQLResponse = await response.json();
      console.log(`[YouTubeService] Response received, videos found: ${data.data?.videos?.length || 0}`);

      if (data.error) {
        console.error(`[YouTubeService] Query error: ${data.error}`);
        return this.getFallbackResult(searchTerm);
      }

      const videos = data.data?.videos || [];
      const transformed: YouTubeVideo[] = [];

      for (const video of videos) {
        if (transformed.length >= maxResults) break;
        const ytVideo = transformAgentQLVideo(video);
        if (ytVideo) {
          transformed.push(ytVideo);
        }
      }

      return transformed;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[YouTubeService] Request timeout after ${REQUEST_TIMEOUT/1000}s for query: "${searchTerm.query}"`);
      } else {
        console.error('[YouTubeService] Request failed:', error);
      }
      return [];
    }
  }

  async searchMultiple(searchTerms: VideoSearchTerm[]): Promise<Map<string, YouTubeVideo[]>> {
    const results = new Map<string, YouTubeVideo[]>();

    if (!this.apiKey || searchTerms.length === 0) {
      return results;
    }

    // Process in batches to respect rate limits
    for (let i = 0; i < searchTerms.length; i += MAX_REQUESTS_PER_BATCH) {
      const batch = searchTerms.slice(i, i + MAX_REQUESTS_PER_BATCH);

      const batchResults = await Promise.all(
        batch.map(async (term) => {
          const videos = await this.searchVideos(term);
          return { query: term.query, videos };
        })
      );

      for (const { query, videos } of batchResults) {
        results.set(query, videos);
      }

      // Add delay between batches (except for the last one)
      if (i + MAX_REQUESTS_PER_BATCH < searchTerms.length) {
        await delay(RATE_LIMIT_DELAY);
      }
    }

    return results;
  }

  private getFallbackResult(searchTerm: VideoSearchTerm): YouTubeVideo[] {
    // Return empty array instead of fake result - better UX
    console.log(`[YouTubeService] Using fallback (empty) for: "${searchTerm.query}"`);
    return [];
  }
}

export const youtubeService = new YouTubeService();
