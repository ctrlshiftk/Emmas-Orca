from app.ingest.adapters.orca_network_adapter import OrcaNetworkAdapter


class _Resp:
    def __init__(self, text: str) -> None:
        self.text = text

    def raise_for_status(self) -> None:
        return None


def test_adapter_extracts_points_from_html_lines(monkeypatch):
    html = """
    <p>June 03, 2025 - J pod near Lime Kiln 48.5162, -123.1520 heading north</p>
    <div>No coords here</div>
    <p>June 04, 2025 - whales spotted 48.6351, -122.9451</p>
    """

    def fake_get(*_args, **_kwargs):
        return _Resp(html)

    monkeypatch.setattr("app.ingest.adapters.orca_network_adapter.requests.get", fake_get)

    points = OrcaNetworkAdapter().fetch()
    assert len(points) == 2
    assert points[0].pod_or_individual == "J Pod"
    assert points[0].lat == 48.5162
    assert points[0].lng == -123.152

