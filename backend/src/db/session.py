from contextlib import asynccontextmanager


@asynccontextmanager
async def get_session():
    yield None
