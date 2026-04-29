from typing import List
from pydantic import BaseModel

class Doc(BaseModel):
    icon: str
    label: str

class Scheme(BaseModel):
    name: str
    nameEn: str
    benefit: str
    eligibility: int
    deadline: str | None
    docs: List[Doc]
    matched: bool
    color: str
    headerColor: str

def get_all_schemes() -> List[Scheme]:
    return [
        Scheme(
            name="PM-KISAN सम्मान निधि",
            nameEn="PM-KISAN Samman Nidhi",
            benefit="₹6,000/साल — 3 किस्तों में सीधा बैंक ट्रांसफर",
            eligibility=100,
            deadline=None,
            docs=[
                Doc(icon="📄", label="आधार कार्ड"),
                Doc(icon="🏡", label="खतौनी/भूमि रिकॉर्ड"),
                Doc(icon="🏦", label="बैंक पासबुक"),
            ],
            matched=True,
            color="bg-green-50",
            headerColor="bg-green-700",
        ),
        Scheme(
            name="PM फसल बीमा योजना",
            nameEn="PM Fasal Bima Yojana",
            benefit="फसल नुकसान पर न्यूनतम प्रीमियम (2%) पर पूरा बीमा",
            eligibility=95,
            deadline="31 जुलाई (खरीफ) / 31 दिसंबर (रबी)",
            docs=[
                Doc(icon="📄", label="आधार कार्ड"),
                Doc(icon="📋", label="बुआई का घोषणा पत्र"),
                Doc(icon="🏡", label="जमीन के कागजात"),
            ],
            matched=True,
            color="bg-blue-50",
            headerColor="bg-blue-700",
        ),
        Scheme(
            name="PM-KUSUM योजना (सोलर पंप)",
            nameEn="PM-KUSUM (Solar Pump)",
            benefit="सोलर पंप लगवाने पर 60% से 90% तक की भारी सब्सिडी",
            eligibility=90,
            deadline="30 जून 2026",
            docs=[
                Doc(icon="📄", label="आधार कार्ड"),
                Doc(icon="🏡", label="भूमि स्वामित्व प्रमाण"),
                Doc(icon="🏦", label="बैंक खाता विवरणी"),
            ],
            matched=True,
            color="bg-orange-50",
            headerColor="bg-orange-600",
        ),
        Scheme(
            name="किसान क्रेडिट कार्ड (KCC)",
            nameEn="Kisan Credit Card",
            benefit="खेती के लिए ₹3 लाख तक का सस्ता लोन (4% ब्याज दर)",
            eligibility=85,
            deadline=None,
            docs=[
                Doc(icon="📄", label="आधार कार्ड"),
                Doc(icon="📋", label="पैन कार्ड"),
                Doc(icon="🏡", label="खसरा-खतौनी"),
            ],
            matched=True,
            color="bg-purple-50",
            headerColor="bg-purple-700",
        ),
        Scheme(
            name="मृदा स्वास्थ्य कार्ड (Soil Health)",
            nameEn="Soil Health Card",
            benefit="मिट्टी की जांच और खाद के उपयोग की सटीक सलाह",
            eligibility=100,
            deadline=None,
            docs=[
                Doc(icon="📄", label="आधार कार्ड"),
                Doc(icon="🧪", label="मिट्टी का नमूना"),
            ],
            matched=True,
            color="bg-amber-50",
            headerColor="bg-amber-700",
        ),
    ]
