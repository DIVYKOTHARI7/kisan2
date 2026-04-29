from app.database import Base
# This allows Alembic to easily import all models by just importing base.py
from app.models.user import User, SubscriptionPlan
from app.models.crop import CropRecommendation, CropCalendarTask
from app.models.disease import DiseaseDetection
from app.models.expert import ExpertProfile, Consultation
from app.models.community import CommunityPost, CommunityComment, CommunityLike, CommunityReport
from app.models.market import MarketplaceProduct, Payment
from app.models.system import GovernmentScheme, AuditLog
