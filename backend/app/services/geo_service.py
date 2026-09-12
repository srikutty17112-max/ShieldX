import hashlib
from typing import Dict, Any

# Map of simulated IP prefixes to realistic global cyber-incident locations
GEOLOCATION_FALLBACK_NODES = [
    {"country": "United States", "city": "Ashburn, VA", "lat": 39.0438, "lon": -77.4874},
    {"country": "Germany", "city": "Frankfurt", "lat": 50.1109, "lon": 8.6821},
    {"country": "Singapore", "city": "Singapore", "lat": 1.3521, "lon": 103.8198},
    {"country": "Netherlands", "city": "Amsterdam", "lat": 52.3676, "lon": 4.9041},
    {"country": "Japan", "city": "Tokyo", "lat": 35.6762, "lon": 139.6503},
    {"country": "United Kingdom", "city": "London", "lat": 51.5074, "lon": -0.1278},
    {"country": "Brazil", "city": "Sao Paulo", "lat": -23.5505, "lon": -46.6333},
    {"country": "India", "city": "Bengaluru", "lat": 12.9716, "lon": 77.5946},
    {"country": "Australia", "city": "Sydney", "lat": -33.8688, "lon": 151.2093},
    {"country": "Canada", "city": "Montreal", "lat": 45.5017, "lon": -73.5673}
]

def resolve_ip_geo(ip: str) -> Dict[str, Any]:
    """
    Resolves IP to approximate geographic coordinates.
    Consistently maps private or simulated test IPs using hash-modulo for deterministic map markers.
    """
    if not ip or ip in ["127.0.0.1", "localhost", "0.0.0.0"]:
        return {"country": "United States", "city": "Local Network / Test Range", "lat": 38.8951, "lon": -77.0364}

    # Hash IP to get consistent realistic geo for demonstration
    h = int(hashlib.md5(ip.encode()).hexdigest(), 16)
    node = GEOLOCATION_FALLBACK_NODES[h % len(GEOLOCATION_FALLBACK_NODES)]
    # Add slight deterministic jitter
    jitter_lat = ((h % 100) - 50) / 100.0
    jitter_lon = (((h >> 8) % 100) - 50) / 100.0
    return {
        "country": node["country"],
        "city": node["city"],
        "lat": round(node["lat"] + jitter_lat, 4),
        "lon": round(node["lon"] + jitter_lon, 4)
    }
