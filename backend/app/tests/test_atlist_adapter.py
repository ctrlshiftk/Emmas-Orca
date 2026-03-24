import json

from app.ingest.adapters.atlist_adapter import AtlistMarkersAdapter

SAMPLE = {
    "markers": [
        {
            "name": "Encounter #32 - Jun 11, 2025",
            "useCoordinates": True,
            "lat": 48.58166667,
            "long": -123.2021667,
            "id": "13cc12b1-073b-43f4-acb5-eabb62a374ea",
            "tags": ["Bigg's Killer Whales"],
            "notes": "<p><strong>Pods: </strong>Bigg&#x27;s killer whales</p>",
        },
        {
            "name": "Encounter #80 - Nov 26, 2025",
            "useCoordinates": True,
            "lat": 48.3463333333333,
            "long": -123.442833333333,
            "id": "697fecfc-e3bf-4dcd-ae2e-be0d5f28da59",
            "createdAt": "2025-12-18T22:59:01.017Z",
            "tags": ["Southern Resident Killer Whales", "J Pod"],
        },
    ]
}


def test_atlist_adapter_parses_markers(monkeypatch):
    def fake_get(url, timeout=30):
        class R:
            text = json.dumps(SAMPLE)

            def raise_for_status(self):
                return None

            def json(self):
                return json.loads(self.text)

        return R()

    monkeypatch.setattr("app.ingest.adapters.atlist_adapter.requests.get", fake_get)

    rows = AtlistMarkersAdapter().fetch()
    assert len(rows) == 2
    assert rows[0].source_record_id == "13cc12b1-073b-43f4-acb5-eabb62a374ea"
    assert rows[0].lat == 48.58166667
    assert rows[0].lng == -123.2021667
    assert "Bigg" in (rows[0].pod_or_individual or "")
    assert rows[0].raw_payload["normalized_tags"] == ["Bigg's Killer Whales"]
    assert rows[1].pod_or_individual and "J Pod" in rows[1].pod_or_individual
    assert rows[1].raw_payload["normalized_tags"] == ["J Pod", "Southern Resident Killer Whales"]
