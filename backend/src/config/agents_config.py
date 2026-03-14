from src.config.config import get_settings


def get_agent_urls() -> dict[str, str]:
    settings = get_settings()
    return {
        "planner": settings.axon_planner_agent_url,
        "research": settings.axon_research_agent_url,
        "reasoning": settings.axon_reasoning_agent_url,
        "builder": settings.axon_builder_agent_url,
    }


def is_real_mode() -> bool:
    settings = get_settings()
    return settings.axon_mode == "real"
