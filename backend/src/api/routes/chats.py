from fastapi import APIRouter, Depends

from src.api.controllers.chat_controller import create_chat, delete_chat, get_chat, get_chat_tasks, list_chats, update_chat
from src.config.dependencies import get_chat_service, rate_limit_hook, require_api_key
from src.schemas.chat import ChatCreate, ChatListResponse, ChatResponse, ChatUpdate
from src.schemas.task import TaskListResponse, TaskResponse
from src.services.chat_service import ChatService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=ChatListResponse)
async def get_chats(chat_service: ChatService = Depends(get_chat_service)) -> ChatListResponse:
    chats = await list_chats(chat_service)
    return ChatListResponse(items=[ChatResponse.model_validate(chat) for chat in chats])


@router.post("/", response_model=ChatResponse, status_code=201)
async def post_chat(
    payload: ChatCreate,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    chat = await create_chat(payload, chat_service)
    return ChatResponse.model_validate(chat)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat_by_id(chat_id: str, chat_service: ChatService = Depends(get_chat_service)) -> ChatResponse:
    chat = await get_chat(chat_id, chat_service)
    return ChatResponse.model_validate(chat)


@router.put("/{chat_id}", response_model=ChatResponse)
async def put_chat(
    chat_id: str,
    payload: ChatUpdate,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    chat = await update_chat(chat_id, payload, chat_service)
    return ChatResponse.model_validate(chat)


@router.delete("/{chat_id}")
async def delete_chat_by_id(
    chat_id: str,
    chat_service: ChatService = Depends(get_chat_service),
) -> dict[str, str]:
    return await delete_chat(chat_id, chat_service)


@router.get("/{chat_id}/tasks", response_model=TaskListResponse)
async def get_tasks_for_chat(
    chat_id: str,
    chat_service: ChatService = Depends(get_chat_service),
) -> TaskListResponse:
    tasks = await get_chat_tasks(chat_id, chat_service)
    return TaskListResponse(items=[TaskResponse.model_validate(task) for task in tasks])
