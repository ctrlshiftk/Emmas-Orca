from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import FriendChoice, OrcaProfile


SEED_ORCAS = [
    ("Oreo (J22)", "J Pod", "J22s", "J22 „Oreo“ ist ein weiblicher Orca aus der J-Pod der Southern Resident Killerwale, geboren im November oder Dezember 1985. Sie ist eine der ältesten noch lebenden weiblichen Mitglieder ihrer Population und stammt von ihrer Mutter J10 „Tahoma“; ihr Vater ist J1 „Ruffles“. Im Laufe ihres Lebens hatte Oreo mehrere Nachkommen. Ihr erstes Kalb, J34 „Doublestuf“, wurde in den 1990er-Jahren geboren, verstarb jedoch 2016. Später brachte sie J38 „Cookie“ zur Welt, einen männlichen Orca, der bis heute lebt. Sie erlitt zudem den Verlust eines Kalbs kurz nach der Geburt im Jahr 2016 und verlor eine späte Schwangerschaft im Jahr 2023. Oreo ist regelmäßig bei Sichtungen der J-Pod-Familie zu beobachten und lässt sich anhand ihrer individuellen Merkmale zuverlässig identifizieren. Sie spielt eine zentrale Rolle in der Dokumentation und Erforschung der J-Pod-Gemeinschaft, da ihre Lebensgeschichte viele Informationen über die Sozialstrukturen und Fortpflanzung dieser stark gefährdeten Orca-Population liefert."),
    ("Coho (L108)", "L Pod", "L54s", "L108 „Coho“ ist ein männlicher Orca aus der L-Pod der Southern Resident Killerwale, geboren im Jahr 2006. Er ist der Sohn von L77 Matia und ist seit seiner Geburt eng mit seiner Mutter verbunden. Coho wird regelmäßig zusammen mit ihr und anderen Familienmitgliedern gesichtet, wobei er allmählich von einem Jungtier zu einem jungen erwachsenen Orca heranwächst. Im Vergleich zu seinen weiblichen Verwandten zeigt Coho typische männliche Merkmale, wie eine wachsende, sich streckende Rückenflosse und eine kräftigere Körperform. Trotz seiner zunehmenden Größe und Selbstständigkeit bleibt er fest in den sozialen Strukturen seiner Pod verankert und profitiert vom Schutz und der Führung älterer Orcas. Coho ist für Forscher besonders interessant, da seine individuellen Merkmale, wie Rückenflosse und Sattelfleck, eine eindeutige Identifikation ermöglichen. Als Teil einer kleinen, gefährdeten Population trägt sein Überleben direkt zum Fortbestand der L-Pod bei. Ausserdem heißt sein kleiner Bruder Keta."),
    ("Nova (J51)", "J Pod", "J4s", "J51 „Nova“ ist ein junger männlicher Orca aus der stark gefährdeten Population der sogenannten Southern Resident Killerwale im Nordwesten des Pazifiks. Er wurde Anfang 2015 geboren und gehört zur J-Pod, einer von drei Familiengruppen dieser Population. Seine Mutter ist J41 Eclipse, die zum Zeitpunkt seiner Geburt erst etwa zehn Jahre alt war und damit als eine der jüngsten bekannten Orca-Mütter gilt. Aufgrund ihres jungen Alters spielte auch Novas Großmutter J19 Shachi eine wichtige Rolle bei seiner Aufzucht, was vermutlich zu seinem Überleben beigetragen hat. Insgesamt ist Nova ein bedeutendes Mitglied seiner kleinen und bedrohten Population, da jedes überlebende Jungtier für den Fortbestand dieser Orcas von großer Bedeutung ist."),
    ("Kelp (K42)", "K Pod", "K8s", "K42 „Kelp“ ist ein männlicher Southern Resident-Orca aus der K-Pod, der im Juni 2008 geboren wurde und seit seiner Entdeckung am 3. Juni 2008 zusammen mit seiner Mutter K14 Lea gesichtet wird. Er ist das fünfte bekannte Kalb seiner Mutter und wurde später genetisch bestätigt, dass sein Vater L41 Mega ist. Kelp ist Teil der sogenannten K8-Matriline, der letzten bekannten direkten Abstammungslinie dieser Gruppe. Im Laufe seines Lebens hat er sich zu einem kräftigen jungen männlichen Orca entwickelt, wobei er durch individuelle Merkmale wie Rückenflosse und Sattelfleck unterscheidbar bleibt. Er hat mindestens eine Schwester, K36 „Yoda“, und hatte eine enge Beziehung zu seinem älteren Bruder K26 „Lobo“, der jedoch 2024 als vermisst gemeldet wurde. Kelp wurde zuletzt im Juli 2025 vor der Küste von Carmanah Point gesichtet und gehört zu jenen wenigen verbleibenden männlichen Nachkommen in einer Population, die aufgrund geringer Geburtenraten und verschiedener Bedrohungen besonders gefährdet ist."),
]


def ensure_seed_data(db: Session) -> None:
    if db.get(FriendChoice, 1) is None:
        db.add(FriendChoice(id=1, orca_profile_id=None))

    for name, pod, matriline, description in SEED_ORCAS:
        orca = db.scalar(select(OrcaProfile).where(OrcaProfile.display_name == name))
        if orca is None:
            db.add(
                OrcaProfile(
                    display_name=name,
                    pod=pod,
                    matriline=matriline,
                    description=description,
                )
            )
        else:
            orca.pod = pod
            orca.matriline = matriline
            orca.description = description
    db.commit()
