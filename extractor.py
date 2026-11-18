import re
import json
import subprocess
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:shorts\/)([0-9A-Za-z_-]{11})',
        r'^([0-9A-Za-z_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    return ""

def get_video_metadata(video_id: str) -> dict:
    """Fetch video metadata using yt-dlp."""
    try:
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-playlist",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=30)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return {
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "channel": data.get("uploader", ""),
                "thumbnail": data.get("thumbnail") or f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                "duration": data.get("duration_string", ""),
                "tags": data.get("tags", [])
            }
    except Exception as e:
        print(f"Error fetching metadata: {e}")
    
    return {
        "title": f"Recipe from Video {video_id}",
        "description": "",
        "channel": "",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "duration": "",
        "tags": []
    }

def get_transcript(video_id: str) -> dict:
    """
    Extract transcript in Hindi or English using YouTubeTranscriptApi.
    """
    transcript_text = ""
    lang_found = "unknown"

    api = YouTubeTranscriptApi()

    # Try preferred languages
    for lang in [['hi'], ['en'], ['hi-Latn'], ['en-IN']]:
        try:
            fetched = api.fetch(video_id, languages=lang)
            if fetched:
                transcript_text = " ".join([item.text for item in fetched])
                lang_found = lang[0]
                break
        except Exception:
            continue

    # Fallback to fetching whatever transcript is available
    if not transcript_text:
        try:
            transcript_list = api.list(video_id)
            for t in transcript_list:
                fetched = t.fetch()
                transcript_text = " ".join([item.text for item in fetched])
                lang_found = t.language_code
                break
        except Exception as e:
            print(f"Transcript list notice: {e}")

    return {
        "text": transcript_text.strip(),
        "language": lang_found
    }

def extract_recipe_from_video(url: str) -> dict:
    video_id = extract_video_id(url)
    if not video_id:
        return {"error": "Invalid YouTube URL"}

    meta = get_video_metadata(video_id)
    transcript_info = get_transcript(video_id)

    return {
        "video_id": video_id,
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
        "title": meta.get("title", ""),
        "description": meta.get("description", ""),
        "channel": meta.get("channel", ""),
        "thumbnail": meta.get("thumbnail", ""),
        "duration": meta.get("duration", ""),
        "tags": meta.get("tags", []),
        "transcript": transcript_info.get("text", ""),
        "detected_language": transcript_info.get("language", "hi")
    }
