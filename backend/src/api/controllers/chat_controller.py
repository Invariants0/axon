from fastapi import HTTPException, status

from src.schemas.chat import ChatCreate, ChatUpdate
from src.services.chat_service import ChatService


async def create_chat(payload: ChatCreate, chat_service: ChatService):
    return await chat_service.create_chat(payload)


async def list_chats(chat_service: ChatService):
    return await chat_service.list_chats()


async def get_chat(chat_id: str, chat_service: ChatService):
    chat = await chat_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


async def get_chat_tasks(chat_id: str, chat_service: ChatService):
    chat = await chat_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return await chat_service.list_chat_tasks(chat_id)


async def update_chat(chat_id: str, payload: ChatUpdate, chat_service: ChatService):
    chat = await chat_service.update_chat_title(chat_id, payload.title)
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


async def delete_chat(chat_id: str, chat_service: ChatService):
    deleted = await chat_service.delete_chat(chat_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return {"status": "ok"}
