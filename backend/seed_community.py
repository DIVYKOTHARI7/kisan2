"""
Seed script — community posts + comments
Run from project root:
    python backend/seed_community.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal, engine, Base
from app.models.community import CommunityPost, CommunityComment

# Make sure tables exist
Base.metadata.create_all(bind=engine)

POSTS = [
    {
        "title": "रमेश कुमार",
        "content": "इस साल गेहूं की फसल बहुत अच्छी रही! 🌾 DAP और यूरिया की सही मात्रा और समय पर सिंचाई की वजह से प्रति बीघे 18 क्विंटल तक उपज मिली। सभी किसान भाइयों को बधाई!",
        "post_type": "photo",
        "image_urls": ["https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80"],
        "tags": ["सफलता", "गेहूं"],
        "crop_tags": ["Wheat"],
        "likes_count": 142,
        "comments_count": 2,
        "moderation_status": "approved",
        "comments": [
            {"author_name": "सुनीता देवी", "content": "बहुत बढ़िया! कौन सी किस्म का गेहूं बोया था?"},
            {"author_name": "मोहन लाल", "content": "शाबाश भाई! हमारे इलाके में भी 15 क्विंटल आई।"},
        ],
    },
    {
        "title": "सुनीता देवी",
        "content": "प्याज की फसल में पत्तियां पीली हो रही हैं। क्या कोई बता सकता है इसकी क्या वजह हो सकती है? मैंने पानी भी समय पर दिया है। 🙏",
        "post_type": "text",
        "image_urls": [],
        "tags": ["प्रश्न", "प्याज"],
        "crop_tags": ["Onion"],
        "likes_count": 38,
        "comments_count": 2,
        "moderation_status": "approved",
        "comments": [
            {"author_name": "अग्रोनोमिस्ट सिंह", "content": "यह Thrips का असर हो सकता है। Spinosad 45% SC का स्प्रे करें।"},
            {"author_name": "रमेश कुमार", "content": "पोटाश की कमी भी हो सकती है। मिट्टी परीक्षण कराएं।"},
        ],
    },
    {
        "title": "मोहन लाल",
        "content": "सोयाबीन की जैविक खेती शुरू की है इस साल। वर्मीकम्पोस्ट और जीवामृत का उपयोग कर रहा हूँ। उम्मीद है बढ़िया उपज मिलेगी! 🌱",
        "post_type": "photo",
        "image_urls": ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80"],
        "tags": ["तकनीक", "जैविकखेती"],
        "crop_tags": ["Soybean"],
        "likes_count": 95,
        "comments_count": 1,
        "moderation_status": "approved",
        "comments": [
            {"author_name": "गीता बाई", "content": "जैविक खेती सही दिशा है! हम भी कर रहे हैं। 👍"},
        ],
    },
    {
        "title": "किसान कृष्णा",
        "content": "आज मंडी में सरसों का भाव ₹5,400/क्विंटल था जो पिछले हफ्ते से ₹200 ज़्यादा है। बेचने का सही समय है किसान भाइयों! 📈",
        "post_type": "text",
        "image_urls": [],
        "tags": ["बाज़ार", "सरसों"],
        "crop_tags": ["Mustard"],
        "likes_count": 210,
        "comments_count": 2,
        "moderation_status": "approved",
        "comments": [
            {"author_name": "विनोद शर्मा", "content": "धन्यवाद भाई! हम भी कल मंडी जाएंगे।"},
            {"author_name": "सुनीता देवी", "content": "हमारे यहाँ ₹5,200 ही मिला।"},
        ],
    },
    {
        "title": "गीता बाई",
        "content": "ड्रिप इरिगेशन लगवाने के बाद पानी की खपत 40% कम हो गई और कपास की उपज 20% बढ़ गई! PM-KUSUM योजना की मदद से सोलर पंप भी लगाया। सरकारी योजनाओं का जरूर फायदा उठाएं।",
        "post_type": "photo",
        "image_urls": ["https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80"],
        "tags": ["सफलता", "तकनीक"],
        "crop_tags": ["Cotton"],
        "likes_count": 178,
        "comments_count": 0,
        "moderation_status": "approved",
        "comments": [],
    },
    {
        "title": "विनोद शर्मा",
        "content": "टमाटर की फसल में फल मक्खी (Fruit Fly) का प्रकोप बढ़ रहा है। Spinosad या Deltamethrin का प्रयोग करें। Yellow Sticky Trap भी लगाएं। 🍅",
        "post_type": "text",
        "image_urls": [],
        "tags": ["सलाह", "टमाटर"],
        "crop_tags": ["Tomato"],
        "likes_count": 65,
        "comments_count": 1,
        "moderation_status": "approved",
        "comments": [
            {"author_name": "मोहन लाल", "content": "बहुत उपयोगी जानकारी! शेयर करने के लिए धन्यवाद।"},
        ],
    },
    {
        "title": "अर्जुन पाटिल",
        "content": "इस बार बारिश देर से आई फिर भी मक्का की फसल अच्छी रही। संकर बीज HM-4 का कमाल है! 25 क्विंटल/एकड़ उपज मिली। 🌽",
        "post_type": "photo",
        "image_urls": ["https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"],
        "tags": ["सफलता", "मक्का"],
        "crop_tags": ["Maize"],
        "likes_count": 89,
        "comments_count": 0,
        "moderation_status": "approved",
        "comments": [],
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(CommunityPost).count()
        if existing > 0:
            print(f"✅ Already seeded ({existing} posts). Skipping.")
            return

        for p in POSTS:
            comments_data = p.pop("comments", [])
            post = CommunityPost(
                user_id=None,
                **{k: v for k, v in p.items()},
                is_pinned=False,
                is_deleted=False,
                views_count=0,
            )
            db.add(post)
            db.flush()  # get post.id

            for c in comments_data:
                comment = CommunityComment(
                    post_id=post.id,
                    user_id=None,
                    author_name=c["author_name"],
                    content=c["content"],
                    is_deleted=False,
                )
                db.add(comment)

        db.commit()
        print(f"✅ Seeded {len(POSTS)} community posts with comments!")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
