from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import os
from functools import lru_cache

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
security = HTTPBearer()


@lru_cache(maxsize=1)
def get_jwks() -> dict:
    """Fetch Clerk's public keys (cached — only fetched once per process)."""
    resp = httpx.get(CLERK_JWKS_URL)
    resp.raise_for_status()
    return resp.json()


def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Decode and verify a Clerk-issued JWT. Returns the payload dict."""
    token = credentials.credentials
    jwks = get_jwks()

    try:
        header = jwt.get_unverified_header(token)
        key_id = header.get("kid")

        # Find matching RSA key in JWKS
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == key_id:
                rsa_key = key
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token key")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
