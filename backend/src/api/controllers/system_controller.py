from src.services.system_service import SystemService


async def get_system_status(system_service: SystemService):
    """Controller for system status endpoint"""
    return await system_service.get_system_status()


async def get_pipeline_graph(system_service: SystemService):
    """Controller for pipeline graph endpoint"""
    return system_service.get_pipeline_graph()


async def get_system_metrics(system_service: SystemService):
    """Controller for system metrics endpoint"""
    return await system_service.get_system_metrics()


async def get_task_timeline(system_service: SystemService, task_id: str):
    """Controller for task execution timeline endpoint"""
    return await system_service.get_task_timeline(task_id)


async def get_event_stats(system_service: SystemService):
    """Controller for event bus statistics endpoint"""
    return await system_service.get_event_stats()

