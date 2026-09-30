#!/usr/bin/env python3
"""Check the agreed recap video format and hard duration limit before upload."""

import json
import subprocess
import sys
from decimal import Decimal
from fractions import Fraction
from pathlib import Path


def verify(path):
    video = Path(path).expanduser().resolve(strict=True)
    if video.suffix.lower() != ".mp4":
        raise ValueError("The recap must be an MP4 file.")
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)],
        check=True, capture_output=True, text=True, timeout=30,
    )
    data = json.loads(probe.stdout)
    if "mp4" not in data["format"]["format_name"].split(","):
        raise ValueError("Expected an MP4 media container, not just an .mp4 filename.")
    # FFprobe shares this demuxer name with QuickTime, 3GP, and other containers.
    brand = data["format"].get("tags", {}).get("major_brand", "")
    mp4_brands = {"isom", "mp41", "mp42", "avc1", "dash", "M4V ", "M4VH", "M4VP", "F4V ", "MSNV"}
    if brand not in mp4_brands and brand not in {f"iso{i}" for i in range(2, 10)}:
        raise ValueError(f"Expected recognized MP4 major branding; got {brand!r}.")
    streams = [stream for stream in data["streams"] if stream.get("codec_type") == "video"]
    if len(streams) != 1:
        raise ValueError("Expected exactly one video stream.")
    stream = streams[0]
    duration = Decimal(data["format"]["duration"])
    if not duration.is_finite() or not Decimal(0) < duration <= Decimal(15):
        raise ValueError(f"Duration is {duration} seconds; it must be greater than 0 and at most 15.")
    if stream["codec_name"] != "h264":
        raise ValueError("Expected H.264 encoding.")
    if (stream["width"], stream["height"]) != (3456, 2234):
        raise ValueError(f"Expected native 3456 x 2234 output; got {stream['width']} x {stream['height']}.")
    if any(Fraction(stream[key]) != 60 for key in ("r_frame_rate", "avg_frame_rate")):
        raise ValueError("Expected 60 FPS in both frame-rate fields.")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-xerror", "-nostdin", "-i", str(video),
         "-map", "0:v:0", "-an", "-f", "null", "-"],
        check=True, capture_output=True, text=True, timeout=60,
    )
    return {"file": str(video), "duration_seconds": float(duration), "fps": 60,
            "width": stream["width"], "height": stream["height"],
            "bytes": video.stat().st_size, "decoded": True}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 verify-video.py <recap.mp4>")
    try:
        print(json.dumps(verify(sys.argv[1]), indent=2))
    except (ValueError, KeyError, OSError, ArithmeticError, subprocess.SubprocessError) as error:
        sys.exit(f"Recap validation failed: {error}")
