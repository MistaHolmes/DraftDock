from prisma import Prisma

_db = Prisma()


async def get_db() -> Prisma:
    """Return a connected Prisma client (singleton)."""
    if not _db.is_connected():
        await _db.connect()
    return _db


async def disconnect_db():
    """Disconnect Prisma — call on app shutdown."""
    if _db.is_connected():
        await _db.disconnect()
