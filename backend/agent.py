from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
import operator

from core.config import settings
from tools.chroma import search_semantic_memory
from tools.neo import search_relationship_graph, get_decision_chain

# ─── State ────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

# ─── Tools & LLM ──────────────────────────────────────────────────────────────

tools = [search_semantic_memory, search_relationship_graph, get_decision_chain]

llm = ChatGroq(
    api_key=settings.groq_api_key,
    model_name="llama-3.1-8b-instant",
    temperature=0,
    timeout=30,
).bind_tools(tools)

SYSTEM = """You are an organizational memory assistant.
You help teams understand past decisions, reasoning, and their impact.
Use the available tools to search both semantic memory (ChromaDB) and 
relationship graph (Neo4j) before answering.
Always cite the source and explain the reasoning behind decisions."""

# ─── Nodes ────────────────────────────────────────────────────────────────────

def call_llm(state: AgentState) -> AgentState:
    from langchain_core.messages import SystemMessage
    messages = [SystemMessage(content=SYSTEM)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

# ─── Graph ────────────────────────────────────────────────────────────────────

tool_node = ToolNode(tools)

graph = StateGraph(AgentState)
graph.add_node("agent", call_llm)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile()

# ─── Public interface ─────────────────────────────────────────────────────────

def run_agent(question: str) -> dict:
    result = app.invoke({"messages": [HumanMessage(content=question)]})
    messages = result["messages"]
    answer = messages[-1].content

    sources = []
    for msg in messages:
        if hasattr(msg, "tool_calls"):
            for tc in msg.tool_calls:
                sources.append(tc["name"])

    return {"answer": answer, "sources": list(set(sources))}
