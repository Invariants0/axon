from __future__ import annotations

import os
import asyncio
from typing import Optional
from urllib.parse import urlparse

import boto3
from botocore import UNSIGNED
from botocore.client import Config as BConfig


class S3Store:
    """Minimal S3-compatible helper (DO Spaces compatible).

    Respects these env vars (in order of precedence):
    - DO_SPACES_URL (endpoint, may include bucket root)
    - DO_SPACES_KEY / DO_SPACES_SECRET
    - DO_SPACES_BUCKET
    - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
    - S3_BUCKET / S3_ENDPOINT
    """

    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        bucket: Optional[str] = None,
    ) -> None:
        endpoint_url = endpoint_url or os.getenv("DO_SPACES_URL") or os.getenv("S3_ENDPOINT")
        access_key = access_key or os.getenv("DO_SPACES_KEY") or os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = secret_key or os.getenv("DO_SPACES_SECRET") or os.getenv("AWS_SECRET_ACCESS_KEY")
        bucket = bucket or os.getenv("DO_SPACES_BUCKET") or os.getenv("S3_BUCKET")

        # If bucket is not provided, attempt to parse it from endpoint (e.g., https://bucket.region.digitaloceanspaces.com)
        parsed_endpoint = None
        if endpoint_url:
            parsed_endpoint = urlparse(endpoint_url)
            host_parts = parsed_endpoint.hostname.split(".") if parsed_endpoint.hostname else []
            if not bucket and host_parts:
                # common pattern: <bucket>.<region>.digitaloceanspaces.com
                bucket = host_parts[0]

        if not bucket:
            raise RuntimeError("S3 bucket not configured (DO_SPACES_BUCKET or S3_BUCKET and not parseable from DO_SPACES_URL)")

        # Prepare boto3 client kwargs
        client_kwargs = {}
        if endpoint_url:
            # if endpoint includes the bucket as leading host part, strip it for client endpoint
            if parsed_endpoint and parsed_endpoint.hostname and parsed_endpoint.hostname.startswith(f"{bucket}."):
                # rebuild endpoint without the leading bucket
                stripped_host = ".".join(parsed_endpoint.hostname.split(".")[1:])
                endpoint_base = f"{parsed_endpoint.scheme}://{stripped_host}"
                if parsed_endpoint.port:
                    endpoint_base = f"{parsed_endpoint.scheme}://{stripped_host}:{parsed_endpoint.port}"
                client_kwargs["endpoint_url"] = endpoint_base
            else:
                client_kwargs["endpoint_url"] = endpoint_url

        # credentials
        if access_key and secret_key:
            client_kwargs.update({
                "aws_access_key_id": access_key,
                "aws_secret_access_key": secret_key,
            })
            botocore_config = None
        else:
            # Use unsigned config when no credentials are provided (anonymous)
            botocore_config = BConfig(signature_version=UNSIGNED)

        # boto3 client is blocking — we will run calls in a thread when used from async code
        if botocore_config is not None:
            self.client = boto3.client("s3", config=botocore_config, **client_kwargs)
        else:
            self.client = boto3.client("s3", **client_kwargs)

        self.bucket = bucket
        self.endpoint_url = endpoint_url

    async def upload_bytes(self, key: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload bytes and return a public URL or s3:// path depending on endpoint."""

        def _put():
            extra = {"ContentType": content_type}
            self.client.put_object(Bucket=self.bucket, Key=key, Body=content, **extra)
            # Construct best-effort public URL
            if self.endpoint_url:
                # If endpoint includes bucket (common for DO Spaces), return endpoint/key
                return f"{self.endpoint_url.rstrip('/')}/{key}"
            return f"s3://{self.bucket}/{key}"

        return await asyncio.to_thread(_put)

    async def download_bytes(self, key: str) -> bytes:
        def _get():
            resp = self.client.get_object(Bucket=self.bucket, Key=key)
            return resp["Body"].read()

        return await asyncio.to_thread(_get)
