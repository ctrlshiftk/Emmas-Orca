from datetime import datetime
import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.entities import FriendChoice, OrcaProfile, Sighting
from app.main import app


def _clear_friend_choice() -> None:
    with SessionLocal() as db:
        row = db.get(FriendChoice, 1)
        if row is not None:
            row.orca_profile_id = None
            row.friend_nickname = None
            db.commit()


def test_health():
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


def test_journey_404_when_friend_orca_not_set():
    _clear_friend_choice()
    with TestClient(app) as client:
        resp = client.get("/api/friend-orca/journey")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Friend orca not set"


def test_friend_nickname_returned_on_journey():
    _clear_friend_choice()
    with TestClient(app) as client:
        first_id = client.get("/api/orcas").json()[0]["id"]
        set_resp = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": first_id, "friend_nickname": "Star"},
        )
        assert set_resp.status_code == 200
        journey = client.get("/api/friend-orca/journey")
        assert journey.status_code == 200
        assert journey.json().get("friend_nickname") == "Star"


def test_can_set_friend_orca_and_read_journey():
    _clear_friend_choice()
    with TestClient(app) as client:
        orcas = client.get("/api/orcas")
        assert orcas.status_code == 200
        first_id = orcas.json()[0]["id"]

        set_resp = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": first_id, "friend_nickname": "Testy"},
        )
        assert set_resp.status_code == 200

        with SessionLocal() as db:
            db.add(
                Sighting(
                    source="test",
                    source_record_id=f"seed-{uuid.uuid4()}",
                    observed_at=datetime(2025, 1, 1, 12, 0),
                    lat=48.51,
                    lng=-123.1,
                    region="Salish Sea",
                    pod_or_individual="J Pod",
                    confidence=0.9,
                    notes="Test sighting",
                    raw_payload={"seed": True},
                )
            )
            db.commit()

        journey = client.get("/api/friend-orca/journey")
        assert journey.status_code == 200
        data = journey.json()
        assert "orca" in data
        assert "points" in data


def test_journey_uses_strict_explicit_pod_tags():
    _clear_friend_choice()
    with TestClient(app) as client:
        with SessionLocal() as db:
            j_orca = db.scalar(select(OrcaProfile).where(OrcaProfile.pod == "J Pod"))
            biggs_orca = db.scalar(select(OrcaProfile).where(OrcaProfile.pod == "Bigg's Killer Whales"))
            assert j_orca is not None
            assert biggs_orca is not None
            j_orca_id = j_orca.id
            biggs_orca_id = biggs_orca.id

            base_time = datetime(2025, 2, 1, 12, 0)
            db.add_all(
                [
                    Sighting(
                        source="test",
                        source_record_id=f"j-only-{uuid.uuid4()}",
                        observed_at=base_time,
                        lat=48.5,
                        lng=-123.1,
                        region="Salish Sea",
                        pod_or_individual="J Pod",
                        confidence=0.9,
                        notes="J-only test point",
                        raw_payload={"normalized_tags": ["J Pod"]},
                    ),
                    Sighting(
                        source="test",
                        source_record_id=f"legacy-j-{uuid.uuid4()}",
                        observed_at=base_time.replace(minute=20),
                        lat=48.55,
                        lng=-123.15,
                        region="Salish Sea",
                        pod_or_individual="J Pod",
                        confidence=0.86,
                        notes="Legacy J-only test point",
                        raw_payload={"tags": ["J Pod"]},
                    ),
                    Sighting(
                        source="test",
                        source_record_id=f"sr-only-{uuid.uuid4()}",
                        observed_at=base_time.replace(hour=13),
                        lat=48.6,
                        lng=-123.2,
                        region="Salish Sea",
                        pod_or_individual="Southern Resident Killer Whales",
                        confidence=0.8,
                        notes="Generic SR test point",
                        raw_payload={"normalized_tags": ["Southern Resident Killer Whales"]},
                    ),
                    Sighting(
                        source="test",
                        source_record_id=f"legacy-sr-{uuid.uuid4()}",
                        observed_at=base_time.replace(hour=13, minute=20),
                        lat=48.61,
                        lng=-123.21,
                        region="Salish Sea",
                        pod_or_individual="Southern Resident Killer Whales",
                        confidence=0.78,
                        notes="Legacy Generic SR test point",
                        raw_payload={"tags": ["Southern Resident Killer Whales"]},
                    ),
                    Sighting(
                        source="test",
                        source_record_id=f"biggs-{uuid.uuid4()}",
                        observed_at=base_time.replace(hour=14),
                        lat=48.7,
                        lng=-123.3,
                        region="Salish Sea",
                        pod_or_individual="Bigg's Killer Whales",
                        confidence=0.85,
                        notes="Bigg's test point",
                        raw_payload={"normalized_tags": ["Bigg's Killer Whales"]},
                    ),
                ]
            )
            db.commit()

        set_j = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": j_orca_id, "friend_nickname": "JTest"},
        )
        assert set_j.status_code == 200
        j_journey = client.get(
            "/api/friend-orca/journey?from=2025-02-01T00:00:00&to=2025-02-01T23:59:59"
        )
        assert j_journey.status_code == 200
        j_points = j_journey.json()["points"]
        assert len(j_points) >= 1
        assert any("Legacy J-only" in (p.get("notes") or "") for p in j_points)
        assert all("Bigg's" not in (p.get("notes") or "") for p in j_points)
        assert all("Generic SR" not in (p.get("notes") or "") for p in j_points)

        _clear_friend_choice()
        set_b = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": biggs_orca_id, "friend_nickname": "BiggsTest"},
        )
        assert set_b.status_code == 200
        b_journey = client.get(
            "/api/friend-orca/journey?from=2025-02-01T00:00:00&to=2025-02-01T23:59:59"
        )
        assert b_journey.status_code == 200
        b_points = b_journey.json()["points"]
        assert any("Bigg's" in (p.get("notes") or "") for p in b_points)
        assert all("J-only" not in (p.get("notes") or "") for p in b_points)


def test_post_friend_orca_requires_nickname():
    _clear_friend_choice()
    with TestClient(app) as client:
        first_id = client.get("/api/orcas").json()[0]["id"]
        missing = client.post("/api/friend-orca", json={"orca_profile_id": first_id})
        assert missing.status_code == 422
        empty = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": first_id, "friend_nickname": "   "},
        )
        assert empty.status_code == 422


def test_post_friend_orca_rejects_when_already_set():
    _clear_friend_choice()
    with TestClient(app) as client:
        orcas = client.get("/api/orcas").json()
        assert len(orcas) >= 1
        first_id = orcas[0]["id"]
        second_id = orcas[1]["id"] if len(orcas) > 1 else first_id
        assert (
            client.post(
                "/api/friend-orca",
                json={"orca_profile_id": first_id, "friend_nickname": "A"},
            ).status_code
            == 200
        )
        again = client.post(
            "/api/friend-orca",
            json={"orca_profile_id": second_id, "friend_nickname": "B"},
        )
        assert again.status_code == 409
        assert "already set" in again.json()["detail"]


def test_delete_friend_orca_clears_choice_and_allows_new_set():
    _clear_friend_choice()
    with TestClient(app) as client:
        orcas = client.get("/api/orcas").json()
        first_id = orcas[0]["id"]
        assert (
            client.post(
                "/api/friend-orca",
                json={"orca_profile_id": first_id, "friend_nickname": "Redo"},
            ).status_code
            == 200
        )
        del_resp = client.delete("/api/friend-orca")
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "ok"
        assert client.get("/api/friend-orca/journey").status_code == 404
        assert (
            client.post(
                "/api/friend-orca",
                json={"orca_profile_id": first_id, "friend_nickname": "Again"},
            ).status_code
            == 200
        )


def test_delete_friend_orca_idempotent_when_not_set():
    _clear_friend_choice()
    with TestClient(app) as client:
        del_resp = client.delete("/api/friend-orca")
        assert del_resp.status_code == 200
        assert client.get("/api/friend-orca/journey").status_code == 404
