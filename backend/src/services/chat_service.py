from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import ChatSession, Task
from src.schemas.chat import ChatCreate


class ChatService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_chat(self, payload: ChatCreate) -> ChatSession:
        chat = ChatSession(title=payload.title)
        self.session.add(chat)
        await self.session.flush()
        return chat

    async def list_chats(self) -> list[ChatSession]:
        result = await self.session.execute(select(ChatSession).order_by(ChatSession.updated_at.desc()))
        return list(result.scalars().all())

    async def get_chat(self, chat_id: str) -> ChatSession | None:
        result = await self.session.execute(select(ChatSession).where(ChatSession.id == chat_id))
        return result.scalar_one_or_none()

    async def list_chat_tasks(self, chat_id: str) -> list[Task]:
        result = await self.session.execute(
            select(Task).where(Task.chat_id == chat_id).order_by(Task.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_chat_title(self, chat_id: str, title: str) -> ChatSession | None:
        chat = await self.get_chat(chat_id)
        if not chat:
            return None
        chat.title = title
        await self.session.flush()
        return chat

    async def delete_chat(self, chat_id: str) -> bool:
        chat = await self.get_chat(chat_id)
        if not chat:
            return False
        await self.session.delete(chat)
        await self.session.flush()
        return True
