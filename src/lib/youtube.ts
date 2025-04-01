const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: {
    videoId: string;
    kind: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  category?: string; // Optional field for UI purposes
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

// Fallback video data for when API fails
const fallbackVideos: { [key: string]: YouTubeVideo[] } = {
  "Budgeting": [
    {
      id: { videoId: "dQw4w9WgXcQ", kind: "youtube#video" },
      snippet: {
        title: "Budgeting Basics for Beginners",
        description: "Learn the fundamentals of creating and maintaining a budget",
        thumbnails: {
          high: {
            url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
          }
        },
        channelTitle: "Finance Education",
        publishedAt: "2024-01-01T00:00:00Z"
      },
      contentDetails: {
        duration: "PT10M30S"
      }
    }
  ],
  "Investing": [
    {
      id: { videoId: "dQw4w9WgXcQ", kind: "youtube#video" },
      snippet: {
        title: "Investment Fundamentals",
        description: "Understanding the basics of investing and building wealth",
        thumbnails: {
          high: {
            url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
          }
        },
        channelTitle: "Investment Education",
        publishedAt: "2024-01-01T00:00:00Z"
      },
      contentDetails: {
        duration: "PT15M20S"
      }
    }
  ],
  "Savings": [
    {
      id: { videoId: "dQw4w9WgXcQ", kind: "youtube#video" },
      snippet: {
        title: "Emergency Fund Planning",
        description: "Learn how to build and maintain an emergency fund",
        thumbnails: {
          high: {
            url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
          }
        },
        channelTitle: "Savings Education",
        publishedAt: "2024-01-01T00:00:00Z"
      },
      contentDetails: {
        duration: "PT9M45S"
      }
    }
  ],
  "Debt": [
    {
      id: { videoId: "dQw4w9WgXcQ", kind: "youtube#video" },
      snippet: {
        title: "Debt Management Strategies",
        description: "Strategies for managing and eliminating debt",
        thumbnails: {
          high: {
            url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
          }
        },
        channelTitle: "Debt Education",
        publishedAt: "2024-01-01T00:00:00Z"
      },
      contentDetails: {
        duration: "PT11M20S"
      }
    }
  ]
};

interface YouTubeSearchItem {
  id: {
    videoId: string;
    kind: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    channelTitle: string;
  };
}

export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key is not configured. Using fallback data.');
    const category = query.split(' ').find(word => 
      Object.keys(fallbackVideos).includes(word)
    ) || "Budgeting";
    
    // Add category to fallback videos
    return {
      items: fallbackVideos[category].map(video => ({
        ...video,
        category: category
      })),
      nextPageToken: undefined
    };
  }

  try {
    const enhancedQuery = `${query} finance tutorial guide`;
    const response = await fetch(
      `${YOUTUBE_API_URL}/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
        enhancedQuery
      )}&type=video&videoDuration=medium&videoEmbeddable=true&key=${YOUTUBE_API_KEY}${
        pageToken ? `&pageToken=${pageToken}` : ''
      }`
    );

    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }

    const data = await response.json();
    
    const validItems = data.items
      .filter((item: YouTubeSearchItem) => 
        item?.id?.videoId && 
        typeof item.id.videoId === 'string' &&
        item.id.videoId.length > 0
      )
      .map((item: YouTubeSearchItem) => ({
        ...item,
        category: query.split(' ')[0] // Add category from search query
      }));

    if (validItems.length === 0) {
      throw new Error('No valid videos found');
    }

    return {
      items: validItems,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.warn('Error searching YouTube videos:', error);
    const category = query.split(' ').find(word => 
      Object.keys(fallbackVideos).includes(word)
    ) || "Budgeting";
    
    return {
      items: fallbackVideos[category].map(video => ({
        ...video,
        category: category
      })),
      nextPageToken: undefined
    };
  }
}

export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY || !videoIds.length) {
    console.warn('YouTube API key not configured or no video IDs provided. Using fallback data.');
    return Object.values(fallbackVideos).flat();
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails&id=${videoIds.join(
        ','
      )}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    
    // Ensure we have valid video data
    const validVideos = data.items.filter((video: YouTubeVideo) => 
      video?.id && 
      video?.snippet && 
      video?.contentDetails
    );

    if (validVideos.length === 0) {
      throw new Error('No valid video details found');
    }

    return validVideos;
  } catch (error) {
    console.warn('Error fetching video details:', error);
    return Object.values(fallbackVideos).flat();
  }
}

export function formatDuration(duration: string): string {
  // Convert ISO 8601 duration to readable format
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';

  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
  const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getChannelVideos(
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeSearchResponse> {
  return searchYouTubeVideos(`channel:${channelId}`, maxResults);
}

export function getRecommendedVideos(
  videoId: string,
  maxResults: number = 10
): Promise<YouTubeSearchResponse> {
  return searchYouTubeVideos(`related:${videoId}`, maxResults);
} 