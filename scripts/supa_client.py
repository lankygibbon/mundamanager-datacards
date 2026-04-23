"""
Shared Supabase helper. Reads/writes token state to .supa_tokens.json
so refresh tokens aren't wasted between script runs.
"""
import urllib.request, urllib.parse, json, os

SUPABASE_URL = "https://iojoritxhpijprgkjfre.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvam9yaXR4aHBpanByZ2tqZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxMDg0NzMsImV4cCI6MjA0MDY4NDQ3M30.6ZRhreN9fEwLN8vRBcd1uDgkyy_Cjm6U5wxeBNoYyKM"
TOKEN_FILE = os.path.join(os.path.dirname(__file__), ".supa_tokens.json")

def _load_tokens():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            return json.load(f)
    return {}

def _save_tokens(access, refresh):
    with open(TOKEN_FILE, "w") as f:
        json.dump({"access_token": access, "refresh_token": refresh}, f)

def _post(url, data, extra_headers={}):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body,
        headers={"Content-Type": "application/json", "apikey": ANON_KEY, **extra_headers})
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def get_token(base64_cookie=None):
    """
    Returns a valid access token. Pass base64_cookie on first use.
    Subsequent calls read from .supa_tokens.json.
    """
    if base64_cookie:
        import base64
        session = json.loads(base64.b64decode(base64_cookie + "==").decode())
        _save_tokens(session["access_token"], session["refresh_token"])
        print(f"[supa_client] Loaded token from cookie")

    tokens = _load_tokens()
    if not tokens:
        raise RuntimeError("No stored tokens. Pass base64_cookie or run with SUPA_COOKIE env var.")

    # Try to refresh (always refresh to ensure we have a fresh token)
    try:
        resp = _post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
            {"refresh_token": tokens["refresh_token"]}
        )
        _save_tokens(resp["access_token"], resp["refresh_token"])
        print(f"[supa_client] Token refreshed")
        return resp["access_token"]
    except Exception as e:
        # Fall back to stored access token (may be expired)
        print(f"[supa_client] Refresh failed ({e}), using stored access token")
        return tokens["access_token"]

def get(path, params={}, token=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    hdrs = {"apikey": ANON_KEY, "Accept": "application/json"}
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=hdrs)
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()}
