import uuid
from neo4j import GraphDatabase
from core.config import settings

_driver = GraphDatabase.driver(
    settings.neo4j_uri,
    auth=(settings.neo4j_username, settings.neo4j_password),
)


def neo_store(
    subject: str,
    action: str,
    reason: str,
    source: str,
    people: list = None,
    impact: str = "",
    alternatives: list = None,
    timestamp: str = "",
) -> str:
    decision_id = str(uuid.uuid4())
    with _driver.session() as session:
        session.run(
            """
            MERGE (d:Decision {action: $action})
            SET d.id        = $decision_id,
                d.subject   = $subject,
                d.impact    = $impact,
                d.source    = $source,
                d.timestamp = $timestamp
            WITH d
            FOREACH (person IN $people |
                MERGE (p:Person {name: person})
                MERGE (d)-[:MADE_BY]->(p)
            )
            WITH d
            FOREACH (alt IN $alternatives |
                MERGE (a:Alternative {text: alt})
                MERGE (d)-[:ALTERNATIVE]->(a)
            )
            WITH d
            FOREACH (r IN CASE WHEN $reason <> '' THEN [$reason] ELSE [] END |
                MERGE (rn:Reason {text: r})
                MERGE (d)-[:BASED_ON]->(rn)
            )
            """,
            action=action, decision_id=decision_id,
            subject=subject, impact=impact,
            source=source, timestamp=timestamp,
            people=people or [],
            alternatives=alternatives or [],
            reason=reason or "",
        )
    return decision_id


def neo_search(query: str, limit: int = 5) -> list:
    with _driver.session() as session:
        result = session.run(
            """
            MATCH (d:Decision)
            OPTIONAL MATCH (d)-[:BASED_ON]->(r:Reason)
            OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
            OPTIONAL MATCH (d)-[:ALTERNATIVE]->(a:Alternative)
            WITH d,
                 collect(DISTINCT r.text) as reasons,
                 collect(DISTINCT p.name) as people,
                 collect(DISTINCT a.text) as alternatives
            WHERE any(word IN split(toLower($q), ' ')
                WHERE toLower(d.action)  CONTAINS word
                   OR toLower(d.subject) CONTAINS word
                   OR any(rr IN reasons WHERE toLower(rr) CONTAINS word)
                   OR any(pp IN people  WHERE toLower(pp) CONTAINS word)
            )
            RETURN d.id as id, d.action as decision, d.subject as topic,
                   d.impact as impact, d.source as source, d.timestamp as timestamp,
                   reasons, people, alternatives
            LIMIT $limit
            """,
            q=query, limit=limit,
        )
        return result.data()
