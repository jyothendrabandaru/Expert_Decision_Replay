from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.identity import Role, Team, TeamJoinRequest, TeamMember, User, UserProfile
from app.schemas.auth import RoleOut, UserOut, UserProfileOut, UserProfileUpdate
from app.schemas.identity import (
    RoleAssignRequest,
    TeamCreate,
    TeamJoinRequestCreate,
    TeamJoinRequestOut,
    TeamJoinRequestReview,
    TeamMemberAdd,
    TeamMemberOut,
    TeamOut,
    TeamUpdate,
    UserStatusUpdate,
)
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification, notify_users_with_role

router = APIRouter(tags=["users & teams"])


@router.get("/users", response_model=list[UserOut])
def list_users(
    search: str | None = None,
    role_id: UUID | None = None,
    is_active: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    """List users with optional search and filtering."""
    query = select(User).where(User.deleted_at.is_(None))

    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if role_id:
        query = query.where(User.role_id == role_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.join(UserProfile, UserProfile.user_id == User.id, isouter=True).where(
            or_(User.email.ilike(s), UserProfile.full_name.ilike(s))
        )

    users = db.scalars(query.order_by(User.created_at.desc()).offset(skip).limit(limit)).all()
    results = []
    for u in users:
        role = db.scalar(select(Role).where(Role.id == u.role_id))
        profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
        results.append(
            UserOut(
                id=u.id,
                email=u.email,
                role_id=u.role_id,
                role=RoleOut.model_validate(role) if role else None,
                is_active=u.is_active,
                profile=UserProfileOut.model_validate(profile) if profile else None,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
        )
    return results


@router.get("/users/roles", response_model=list[RoleOut])
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RoleOut]:
    """List all available system roles."""
    roles = db.scalars(select(Role).order_by(Role.name)).all()
    return [RoleOut.model_validate(r) for r in roles]


@router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Retrieve details for a specific user."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    role = db.scalar(select(Role).where(Role.id == u.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(role) if role else None,
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.patch("/users/{user_id}/role", response_model=UserOut)
def assign_user_role(
    user_id: UUID,
    data: RoleAssignRequest,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
) -> UserOut:
    """Assign a role to a user (Administrator only)."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    target_role = db.scalar(select(Role).where(Role.code == data.role_code.lower()))
    if not target_role:
        raise NotFoundError(message=f"Role '{data.role_code}' does not exist.")

    old_role_id = u.role_id
    u.role_id = target_role.id

    log_audit(
        db=db,
        action="user_role_change",
        entity_type="user",
        entity_id=u.id,
        actor_id=current_user.id,
        extra={"old_role_id": str(old_role_id), "new_role": target_role.code},
    )
    db.commit()
    db.refresh(u)

    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(target_role),
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_active_status(
    user_id: UUID,
    data: UserStatusUpdate,
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
) -> UserOut:
    """Activate or deactivate a user account (Administrator only)."""
    u = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not u:
        raise NotFoundError(message="User not found.")

    if u.id == current_user.id and not data.is_active:
        raise ForbiddenError(message="Administrators cannot deactivate their own account.")

    u.is_active = data.is_active
    log_audit(
        db=db,
        action="user_status_toggle",
        entity_type="user",
        entity_id=u.id,
        actor_id=current_user.id,
        extra={"is_active": data.is_active},
    )
    db.commit()
    db.refresh(u)

    role = db.scalar(select(Role).where(Role.id == u.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == u.id))
    return UserOut(
        id=u.id,
        email=u.email,
        role_id=u.role_id,
        role=RoleOut.model_validate(role) if role else None,
        is_active=u.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )


@router.put("/users/profile/me", response_model=UserProfileOut)
def update_own_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileOut:
    """Update profile information for the authenticated user."""
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            full_name=data.full_name or current_user.email,
        )
        db.add(profile)
        db.flush()

    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.job_title is not None:
        profile.job_title = data.job_title
    if data.department is not None:
        profile.department = data.department
    if data.phone is not None:
        profile.phone = data.phone

    db.commit()
    db.refresh(profile)
    return UserProfileOut.model_validate(profile)


# ---------------- TEAM ENDPOINTS ----------------

@router.get("/teams", response_model=list[TeamOut])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TeamOut]:
    """List all active teams with their members."""
    teams = db.scalars(select(Team).where(Team.deleted_at.is_(None)).order_by(Team.name)).all()
    results = []
    for t in teams:
        members_query = (
            select(TeamMember, User, UserProfile, Role)
            .join(User, TeamMember.user_id == User.id)
            .join(UserProfile, UserProfile.user_id == User.id, isouter=True)
            .join(Role, User.role_id == Role.id)
            .where(TeamMember.team_id == t.id, User.deleted_at.is_(None))
        )
        members_data = db.execute(members_query).all()
        m_outs = [
            TeamMemberOut(
                team_id=t.id,
                user_id=row[1].id,
                full_name=row[2].full_name if row[2] else row[1].email,
                email=row[1].email,
                role_code=row[3].code,
                created_at=row[0].created_at,
            )
            for row in members_data
        ]
        results.append(
            TeamOut(
                id=t.id,
                name=t.name,
                description=t.description,
                created_by_id=t.created_by_id,
                members=m_outs,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )
    return results


@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> TeamOut:
    """Create a new team (Administrator or Manager)."""
    team = Team(
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        created_by_id=current_user.id,
    )
    db.add(team)
    db.flush()

    # Automatically add creator as team member
    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    db.flush()

    log_audit(
        db=db,
        action="team_create",
        entity_type="team",
        entity_id=team.id,
        actor_id=current_user.id,
        extra={"name": team.name},
    )
    db.commit()
    db.refresh(team)

    role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    m_out = TeamMemberOut(
        team_id=team.id,
        user_id=current_user.id,
        full_name=profile.full_name if profile else current_user.email,
        email=current_user.email,
        role_code=role.code if role else "employee",
        created_at=member.created_at,
    )
    return TeamOut(
        id=team.id,
        name=team.name,
        description=team.description,
        created_by_id=team.created_by_id,
        members=[m_out],
        created_at=team.created_at,
        updated_at=team.updated_at,
    )


@router.post("/teams/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    data: TeamMemberAdd,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> dict:
    """Add a user as member of a team."""
    team = db.scalar(select(Team).where(Team.id == team_id, Team.deleted_at.is_(None)))
    if not team:
        raise NotFoundError(message="Team not found.")

    user = db.scalar(select(User).where(User.id == data.user_id, User.deleted_at.is_(None)))
    if not user:
        raise NotFoundError(message="User not found.")

    existing = db.scalar(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == data.user_id)
    )
    if existing:
        return {"status": "ok", "message": "User is already a member of this team."}

    tm = TeamMember(team_id=team_id, user_id=data.user_id)
    db.add(tm)
    log_audit(
        db=db,
        action="team_member_add",
        entity_type="team",
        entity_id=team_id,
        actor_id=current_user.id,
        extra={"member_id": str(data.user_id)},
    )
    db.commit()
    return {"status": "ok", "message": "Team member added successfully."}


@router.delete("/teams/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a user from a team."""
    tm = db.scalar(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    if not tm:
        raise NotFoundError(message="Member not found in team.")

    db.delete(tm)
    log_audit(
        db=db,
        action="team_member_remove",
        entity_type="team",
        entity_id=team_id,
        actor_id=current_user.id,
        extra={"member_id": str(user_id)},
    )
    db.commit()
    return {"status": "ok", "message": "Team member removed."}


def build_join_request_out(db: Session, req: TeamJoinRequest) -> TeamJoinRequestOut:
    team = db.scalar(select(Team).where(Team.id == req.team_id))
    user = db.scalar(select(User).where(User.id == req.user_id))
    user_profile = db.scalar(select(UserProfile).where(UserProfile.user_id == req.user_id)) if user else None
    user_role = db.scalar(select(Role).where(Role.id == user.role_id)) if user and user.role_id else None

    reviewer = db.scalar(select(User).where(User.id == req.reviewed_by_id)) if req.reviewed_by_id else None
    reviewer_profile = db.scalar(select(UserProfile).where(UserProfile.user_id == req.reviewed_by_id)) if reviewer else None

    return TeamJoinRequestOut(
        id=req.id,
        team_id=req.team_id,
        team_name=team.name if team else "Unknown Team",
        user_id=req.user_id,
        user_name=user_profile.full_name if user_profile and user_profile.full_name else (user.email if user else "Unknown"),
        user_email=user.email if user else "",
        user_role_code=user_role.code if user_role else "employee",
        reason=req.reason,
        status=req.status,
        reviewed_by_id=req.reviewed_by_id,
        reviewed_by_name=reviewer_profile.full_name if reviewer_profile and reviewer_profile.full_name else (reviewer.email if reviewer else None),
        reviewed_at=req.reviewed_at,
        response_note=req.response_note,
        created_at=req.created_at,
    )


@router.post("/teams/{team_id}/join-requests", response_model=TeamJoinRequestOut, status_code=status.HTTP_201_CREATED)
def submit_team_join_request(
    team_id: UUID,
    data: TeamJoinRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamJoinRequestOut:
    """Submit a request to join an organizational team."""
    team = db.scalar(select(Team).where(Team.id == team_id, Team.deleted_at.is_(None)))
    if not team:
        raise NotFoundError(message="Team not found.")

    # Check if already a member
    is_member = db.scalar(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == current_user.id)
    )
    if is_member:
        raise ConflictError(message="You are already a member of this team.")

    # Check if a pending request already exists
    pending_req = db.scalar(
        select(TeamJoinRequest).where(
            TeamJoinRequest.team_id == team_id,
            TeamJoinRequest.user_id == current_user.id,
            TeamJoinRequest.status == "pending",
        )
    )
    if pending_req:
        raise ConflictError(message="You already have a pending join request for this team.")

    # Create join request
    join_req = TeamJoinRequest(
        team_id=team_id,
        user_id=current_user.id,
        reason=data.reason,
        status="pending",
    )
    db.add(join_req)
    db.flush()

    # User full name or email for notification
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))
    user_display = profile.full_name if profile and profile.full_name else current_user.email

    # Notify team creator/managers and administrators
    notify_users_with_role(
        db=db,
        role_codes=["administrator", "manager"],
        type="team_join_request",
        title=f"New Team Join Request: {team.name}",
        body=f"{user_display} has requested to join {team.name}.",
        payload={"team_id": str(team.id), "request_id": str(join_req.id)},
        exclude_user_id=current_user.id,
    )

    log_audit(
        db=db,
        action="team_join_request_created",
        entity_type="team",
        entity_id=team_id,
        actor_id=current_user.id,
        extra={"request_id": str(join_req.id), "reason": data.reason},
    )
    db.commit()
    db.refresh(join_req)

    return build_join_request_out(db, join_req)


@router.get("/teams/join-requests", response_model=list[TeamJoinRequestOut])
def list_team_join_requests(
    team_id: UUID | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TeamJoinRequestOut]:
    """
    List team join requests.
    Employees see their own requests. Managers and Administrators see all / team requests.
    """
    role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_governance = role and role.code in ["administrator", "manager"]

    query = select(TeamJoinRequest)

    if not is_governance:
        query = query.where(TeamJoinRequest.user_id == current_user.id)

    if team_id:
        query = query.where(TeamJoinRequest.team_id == team_id)

    if status_filter:
        query = query.where(TeamJoinRequest.status == status_filter)

    requests = db.scalars(query.order_by(TeamJoinRequest.created_at.desc())).all()
    return [build_join_request_out(db, r) for r in requests]


@router.post("/teams/join-requests/{request_id}/review", response_model=TeamJoinRequestOut)
def review_team_join_request(
    request_id: UUID,
    data: TeamJoinRequestReview,
    current_user: User = Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
) -> TeamJoinRequestOut:
    """Approve or reject a team join request (Manager & Admin only)."""
    join_req = db.scalar(select(TeamJoinRequest).where(TeamJoinRequest.id == request_id))
    if not join_req:
        raise NotFoundError(message="Join request not found.")

    if join_req.status != "pending":
        raise ConflictError(message=f"Join request is already {join_req.status}.")

    team = db.scalar(select(Team).where(Team.id == join_req.team_id))
    team_name = team.name if team else "the team"

    join_req.reviewed_by_id = current_user.id
    join_req.reviewed_at = datetime.now(UTC)
    join_req.response_note = data.response_note

    if data.action == "approve":
        join_req.status = "approved"
        # Add to team members if not already member
        existing_member = db.scalar(
            select(TeamMember).where(
                TeamMember.team_id == join_req.team_id,
                TeamMember.user_id == join_req.user_id,
            )
        )
        if not existing_member:
            db.add(TeamMember(team_id=join_req.team_id, user_id=join_req.user_id))

        # Notify requester
        create_notification(
            db=db,
            user_id=join_req.user_id,
            type="team_join_approved",
            title=f"Welcome to {team_name}!",
            body=f"Your request to join {team_name} was approved." + (f" Note: {data.response_note}" if data.response_note else ""),
            payload={"team_id": str(join_req.team_id), "request_id": str(join_req.id)},
        )

        log_audit(
            db=db,
            action="team_join_request_approved",
            entity_type="team",
            entity_id=join_req.team_id,
            actor_id=current_user.id,
            extra={"user_id": str(join_req.user_id), "request_id": str(join_req.id)},
        )
    else:  # reject
        join_req.status = "rejected"
        create_notification(
            db=db,
            user_id=join_req.user_id,
            type="team_join_rejected",
            title=f"Join Request Declined: {team_name}",
            body=f"Your request to join {team_name} was declined." + (f" Reason: {data.response_note}" if data.response_note else ""),
            payload={"team_id": str(join_req.team_id), "request_id": str(join_req.id)},
        )

        log_audit(
            db=db,
            action="team_join_request_rejected",
            entity_type="team",
            entity_id=join_req.team_id,
            actor_id=current_user.id,
            extra={"user_id": str(join_req.user_id), "request_id": str(join_req.id), "note": data.response_note},
        )

    db.commit()
    db.refresh(join_req)
    return build_join_request_out(db, join_req)


@router.delete("/teams/join-requests/{request_id}")
def cancel_team_join_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Cancel a pending join request."""
    join_req = db.scalar(select(TeamJoinRequest).where(TeamJoinRequest.id == request_id))
    if not join_req:
        raise NotFoundError(message="Join request not found.")

    role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = role and role.code == "administrator"

    if join_req.user_id != current_user.id and not is_admin:
        raise ForbiddenError(message="You can only cancel your own join requests.")

    if join_req.status != "pending" and not is_admin:
        raise ConflictError(message="Only pending requests can be cancelled.")

    db.delete(join_req)
    log_audit(
        db=db,
        action="team_join_request_cancelled",
        entity_type="team",
        entity_id=join_req.team_id,
        actor_id=current_user.id,
        extra={"request_id": str(request_id)},
    )
    db.commit()
    return {"status": "ok", "message": "Join request cancelled successfully."}


@router.get("/teams/{team_id}", response_model=TeamOut)
def get_team(
    team_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TeamOut:
    """Get single team details with members."""
    t = db.scalar(select(Team).where(Team.id == team_id, Team.deleted_at.is_(None)))
    if not t:
        raise NotFoundError(message="Team not found.")

    members_data = db.execute(
        select(TeamMember, User, UserProfile, Role)
        .join(User, User.id == TeamMember.user_id)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .outerjoin(Role, Role.id == User.role_id)
        .where(TeamMember.team_id == t.id)
    ).all()

    m_outs = [
        TeamMemberOut(
            team_id=t.id,
            user_id=row[1].id,
            full_name=row[2].full_name if row[2] else row[1].email,
            email=row[1].email,
            role_code=row[3].code if row[3] else "employee",
            created_at=row[0].created_at,
        )
        for row in members_data
    ]
    return TeamOut(
        id=t.id,
        name=t.name,
        description=t.description,
        created_by_id=t.created_by_id,
        members=m_outs,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


