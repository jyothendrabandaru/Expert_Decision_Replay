import pytest
from fastapi.testclient import TestClient


def test_team_join_request_lifecycle(
    client: TestClient,
    employee_user: tuple,
    manager_user: tuple,
    admin_user: tuple,
) -> None:
    _, _, emp_headers = employee_user
    _, _, mgr_headers = manager_user
    _, _, adm_headers = admin_user

    # 1. Admin creates a new team
    team_res = client.post(
        "/api/v1/teams",
        json={"name": "Special Operations AI Team", "description": "Experimental AI agents."},
        headers=adm_headers,
    )
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # 2. Employee submits join request
    req_res = client.post(
        f"/api/v1/teams/{team_id}/join-requests",
        json={"reason": "I have experience with LLM agents and want to contribute."},
        headers=emp_headers,
    )
    assert req_res.status_code == 201
    join_req_id = req_res.json()["id"]
    assert req_res.json()["status"] == "pending"
    assert req_res.json()["team_name"] == "Special Operations AI Team"

    # 3. Duplicate request should fail with conflict
    dup_res = client.post(
        f"/api/v1/teams/{team_id}/join-requests",
        json={"reason": "Another attempt."},
        headers=emp_headers,
    )
    assert dup_res.status_code == 409

    # 4. Employee lists their join requests
    emp_list_res = client.get("/api/v1/teams/join-requests", headers=emp_headers)
    assert emp_list_res.status_code == 200
    assert any(r["id"] == join_req_id for r in emp_list_res.json())

    # 5. Manager reviews and approves request
    review_res = client.post(
        f"/api/v1/teams/join-requests/{join_req_id}/review",
        json={"action": "approve", "response_note": "Welcome to the team!"},
        headers=mgr_headers,
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"

    # 6. Verify employee is now a member of the team
    team_detail = client.get(f"/api/v1/teams/{team_id}", headers=emp_headers)
    assert team_detail.status_code == 200
    emp_user_id = req_res.json()["user_id"]
    assert any(m["user_id"] == emp_user_id for m in team_detail.json()["members"])


def test_repository_endpoints(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, emp_headers = employee_user

    # Create a decision so graph and documents have data
    d_res = client.post(
        "/api/v1/decisions",
        json={
            "title": "Cloud Data Mesh Infrastructure Strategy",
            "problem_statement": "Decentralized data product architecture with domain-driven governance.",
        },
        headers=emp_headers,
    )
    assert d_res.status_code == 201
    decision_id = d_res.json()["id"]

    # 1. Repository summary
    sum_res = client.get("/api/v1/repository/summary", headers=emp_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert "total_documents_count" in summary
    assert "decision_documents_count" in summary
    assert "teams_contributed_count" in summary
    assert "recently_added_count" in summary
    assert "popular_topics" in summary
    assert "recent_activity" in summary
    assert "related_insights" in summary

    # 2. Repository documents list
    doc_res = client.get("/api/v1/repository/documents", headers=emp_headers)
    assert doc_res.status_code == 200
    assert isinstance(doc_res.json(), list)

    # 3. Knowledge graph
    graph_res = client.get(f"/api/v1/repository/graph?decision_id={decision_id}", headers=emp_headers)
    assert graph_res.status_code == 200
    graph = graph_res.json()
    assert "nodes" in graph
    assert "links" in graph
    assert len(graph["nodes"]) > 0
    assert len(graph["links"]) > 0

