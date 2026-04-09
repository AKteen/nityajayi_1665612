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
    with _driver.session() as session:
        session.run(
            """
            MERGE (d:Decision {action: $action})
            SET d.reason      = $reason,
                d.source      = $source,
                d.subject     = $subject,
                d.impact      = $impact,
                d.alternatives= $alternatives,
                d.timestamp   = $timestamp
            WITH d
            UNWIND $people AS person
            MERGE (p:Person {name: person})
            MERGE (p)-[:MADE]->(d)
            """,
            action=action, reason=reason, source=source,
            subject=subject, impact=impact,
            alternatives=alternatives or [],
            timestamp=timestamp,
            people=people or [],
        )
    return f"Stored decision in Neo4j: {action}"


def neo_search(entity: str, limit: int = 5) -> list:
    with _driver.session() as session:
        result = session.run(
            """
            MATCH (p:Person)-[:MADE]->(d:Decision)
            WHERE toLower(d.action)  CONTAINS toLower($entity)
               OR toLower(d.subject) CONTAINS toLower($entity)
               OR toLower(d.reason)  CONTAINS toLower($entity)
            RETURN p.name as person, d.action as action,
                   d.reason as reason, d.impact as impact,
                   d.source as source, d.timestamp as timestamp
            LIMIT $limit
            """,
            entity=entity, limit=limit,
        )
        return result.data()


def neo_decision_chain(topic: str, limit: int = 10) -> list:
    with _driver.session() as session:
        result = session.run(
            """
            MATCH (p:Person)-[:MADE]->(d:Decision)
            WHERE toLower(d.subject) CONTAINS toLower($topic)
            RETURN p.name as person, d.action as action,
                   d.reason as reason, d.timestamp as timestamp,
                   d.source as source
            ORDER BY d.timestamp
            LIMIT $limit
            """,
            topic=topic, limit=limit,
        )
        return result.data()
