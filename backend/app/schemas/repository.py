from datetime import datetime
from uuid import UUID
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class RepositoryTopicOut(BaseModel):
    name: str
    count: int
    trend: str = "+12%"


class RepositoryActivityOut(BaseModel):
    id: str
    action: str
    title: str
    user_name: str
    timestamp: datetime
    file_type: str | None = None
    decision_id: UUID | None = None


class RepositoryInsightOut(BaseModel):
    title: str
    description: str
    category: str
    decision_id: UUID | None = None
    metric: str | None = None


class RepositorySummaryOut(BaseModel):
    total_documents_count: int
    decision_documents_count: int
    teams_contributed_count: int
    recently_added_count: int
    popular_topics: list[RepositoryTopicOut] = []
    recent_activity: list[RepositoryActivityOut] = []
    related_insights: list[RepositoryInsightOut] = []


class KnowledgeGraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'decision' | 'team' | 'person' | 'document' | 'status' | 'topic' | 'impact'
    subLabel: str | None = None
    color: str | None = None
    icon: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphLink(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship: str | None = None


class KnowledgeGraphOut(BaseModel):
    central_decision_id: UUID | None = None
    central_decision_title: str | None = None
    nodes: list[KnowledgeGraphNode] = []
    links: list[KnowledgeGraphLink] = []


class RepositoryDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    file_type: str
    file_size_bytes: int
    uploaded_by_id: UUID | None = None
    uploaded_by_name: str | None = None
    uploaded_at: datetime
    decision_id: UUID | None = None
    decision_title: str | None = None
    team_name: str | None = None
    tags: list[str] = []
    download_url: str
