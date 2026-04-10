import logging
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from core.config import settings
from tools.neo import search_decisions
from tools.chroma import search_raw_memory

logger = logging.getLogger(__name__)

tools = [search_decisions, search_raw_memory]
tools_map = {t.name: t for t in tools}

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0,
).bind_tools(tools)

SYSTEM = """You are an organizational memory assistant.
Use search_decisions to find structured decisions from Neo4j.
Use search_raw_memory to find raw context, evidence and details from documents and chats.
Always search both before answering.

IMPORTANT: Be concise and direct. Answer ONLY what was asked.
- If asked "who", give names only
- If asked "why", give reasons only
- If asked "what", give the decision only
- If asked "when", give the timeline only

Only provide full details (what, why, who, alternatives, impact) if the user asks for comprehensive information or "tell me about" or "explain".

Always cite the source at the end."""


def run_query_agent(question: str) -> dict:
    logger.info(f"[QUERY AGENT] Question: {question}")
    messages = [SystemMessage(content=SYSTEM), HumanMessage(content=question)]
    tools_used = []
    source_trace = []

    for _ in range(3):
        response = llm.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            break

        for tc in response.tool_calls:
            tools_used.append(tc["name"])
            logger.info(f"[QUERY AGENT] → tool: {tc['name']} args={tc['args']}")
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
