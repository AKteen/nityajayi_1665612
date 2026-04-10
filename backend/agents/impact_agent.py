import logging
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from core.config import settings
from tools.impact_tools import find_related_decisions, find_decisions_by_person

logger = logging.getLogger(__name__)

tools = [find_related_decisions, find_decisions_by_person]
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
2. Use find_decisions_by_person if a person is mentioned
3. Analyze the chain of decisions and reason about what would be affected
4. Give a clear impact assessment with:
   - What would break or change
   - Who would be affected
   - What alternatives exist
   - Risk level (Low / Medium / High)"""


def run_impact_agent(question: str) -> dict:
    logger.info(f"[IMPACT AGENT] Question: {question}")
    messages = [SystemMessage(content=SYSTEM), HumanMessage(content=question)]
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
