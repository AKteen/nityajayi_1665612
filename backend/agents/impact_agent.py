import logging
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from core.config import settings
from tools.impact_tools import find_related_decisions, find_decisions_by_person
from tools.chroma import search_raw_memory

logger = logging.getLogger(__name__)

tools = [find_related_decisions, find_decisions_by_person, search_raw_memory]
tools_map = {t.name: t for t in tools}

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0,
).bind_tools(tools)

SYSTEM = """You are an impact analysis agent.
You answer "what if" and "what breaks" questions about organizational decisions.
Steps:
1. Use find_related_decisions to find all decisions connected to the topic
2. Use search_raw_memory to find raw context and evidence
3. Use find_decisions_by_person if a person is mentioned
4. Analyze the chain of decisions and reason about what would be affected
5. Give a clear, concise impact assessment with:
   - What would break or change
   - Who would be affected
   - Risk level (Low / Medium / High)

Be direct and concise. Focus on the specific impact being asked about."""


def run_impact_agent(question: str, source_context: str = None) -> dict:
    logger.info(f"[IMPACT AGENT] Question: {question} | Source: {source_context or 'all'}")
    
    # Add source context to system message if provided
    system_msg = SYSTEM
    if source_context:
        system_msg += f"\n\nIMPORTANT: Only search and return results from sources matching: {source_context}"
    
    messages = [SystemMessage(content=system_msg), HumanMessage(content=question)]
    tools_used = []
    source_trace = []

    for _ in range(4):
        response = llm.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            break

        for tc in response.tool_calls:
            tools_used.append(tc["name"])
            logger.info(f"[IMPACT AGENT] → tool: {tc['name']} args={tc['args']}")
            
            # Add source_filter to tool args if source_context is provided
            if source_context and "source_filter" in tools_map[tc["name"]].args:
                tc["args"]["source_filter"] = source_context
            
            result = tools_map[tc["name"]].invoke(tc["args"])
            source_trace.append({
                "tool": tc["name"],
                "args": tc["args"],
                "result_preview": result[:300],
            })
            messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))

    return {
        "answer": messages[-1].content,
        "reasoning": f"Tools used: {', '.join(tools_used) if tools_used else 'context only'}",
        "source_trace": source_trace,
    }
