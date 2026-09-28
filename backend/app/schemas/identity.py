from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None = None
    is_system: bool = True


class RoleAssignRequest(BaseModel):
    role_code: str


class UserStatusUpdate(BaseModel):
    is_active: bool


class TeamMemberOut(BaseModel):
    team_id: UUID
    user_id: UUID
    full_name: str
    email: str
    role_code: str
    created_at: datetime


class TeamMemberAdd(BaseModel):
    user_id: UUID


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    created_by_id: UUID | None = None
    members: list[TeamMemberOut] = []
    created_at: datetime
    updated_at: datetime


class TeamJoinRequestCreate(BaseModel):
    reason: str | None = None


class TeamJoinRequestReview(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")
    response_note: str | None = None


class TeamJoinRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    team_id: UUID
    team_name: str
    user_id: UUID
    user_name: str
    user_email: str
    user_role_code: str
    reason: str | None = None
    status: str
    reviewed_by_id: UUID | None = None
    reviewed_by_name: str | None = None
    reviewed_at: datetime | None = None
    response_note: str | None = None
    created_at: datetime
