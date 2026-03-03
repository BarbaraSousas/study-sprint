import { useState } from 'react';
import { Play, Clock, Eye, User } from 'lucide-react';
import type { YouTubeVideo } from '@studysprint/shared';

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
}

export function YouTubeVideoCard({ video }: YouTubeVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-lg overflow-hidden border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => setIsPlaying(true)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h4 className="font-medium text-sm line-clamp-2 leading-snug">
          {video.title}
        </h4>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {video.channel && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{video.channel}</span>
            </span>
          )}

          {video.views && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.views}
            </span>
          )}

          {video.durationSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
