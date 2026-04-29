from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models.community import CommunityComment, CommunityLike, CommunityPost, CommunityReport
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityCommentResponse,
    CommunityFeedResponse,
    CommunityPostCreate,
    CommunityPostResponse,
    CommunityPostUpdate,
    CommunityReportCreate,
)

router = APIRouter()


ALLOWED_UPLOAD_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


@router.post("/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    actor_user_id: int = Depends(get_current_user_id),
):
    if not file.content_type or file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported media type")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    ext = Path(file.filename or "upload.bin").suffix.lower() or (
        ".mp4" if file.content_type.startswith("video/") else ".jpg"
    )
    filename = f"{actor_user_id}_{uuid4().hex}{ext}"
    uploads_root = Path(__file__).resolve().parents[4] / "uploads" / "community"
    uploads_root.mkdir(parents=True, exist_ok=True)
    saved_path = uploads_root / filename
    saved_path.write_bytes(raw)

    media_path = f"/uploads/community/{filename}"
    media_url = f"{str(request.base_url).rstrip('/')}{media_path}"
    media_type = "video" if file.content_type.startswith("video/") else "photo"
    return {"media_url": media_url, "media_type": media_type}


def _format_comment(comment: CommunityComment) -> CommunityCommentResponse:
    return CommunityCommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        content=comment.content,
        author=comment.author_name or "Anonymous Farmer",
        created_at=comment.created_at,
    )


def _format_post(post: CommunityPost, comments: list[CommunityComment]) -> CommunityPostResponse:
    return CommunityPostResponse(
        id=post.id,
        user_id=post.user_id,
        author=post.title or "Anonymous Farmer",
        location="भारत",
        content=post.content or "",
        media_url=(post.image_urls[0] if post.image_urls else None),
        post_type=post.post_type or "text",
        tags=post.tags or [],
        crop_tags=post.crop_tags or [],
        moderation_status=post.moderation_status or "pending",
        views_count=post.views_count or 0,
        likes_count=post.likes_count or 0,
        comments_count=post.comments_count or 0,
        is_pinned=bool(post.is_pinned),
        created_at=post.created_at,
        comments=[_format_comment(comment) for comment in comments if not comment.is_deleted],
    )


@router.get("/feed", response_model=CommunityFeedResponse)
def get_feed(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = (
        db.query(func.count(CommunityPost.id))
        .filter(CommunityPost.is_deleted.is_(False))
        .filter(CommunityPost.moderation_status != "rejected")
        .scalar()
        or 0
    )
    posts = (
        db.query(CommunityPost)
        .filter(CommunityPost.is_deleted.is_(False))
        .filter(CommunityPost.moderation_status != "rejected")
        .order_by(CommunityPost.is_pinned.desc(), CommunityPost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    post_ids = [post.id for post in posts]
    comments_by_post: dict[int, list[CommunityComment]] = {post_id: [] for post_id in post_ids}
    if post_ids:
        comments = (
            db.query(CommunityComment)
            .filter(CommunityComment.post_id.in_(post_ids))
            .filter(CommunityComment.is_deleted.is_(False))
            .order_by(CommunityComment.created_at.asc())
            .all()
        )
        for comment in comments:
            comments_by_post.setdefault(comment.post_id, []).append(comment)

    return CommunityFeedResponse(
        posts=[_format_post(post, comments_by_post.get(post.id, [])) for post in posts],
        page=page,
        size=size,
        total=total,
    )


@router.get("/posts/{post_id}", response_model=CommunityPostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comments = (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .filter(CommunityComment.is_deleted.is_(False))
        .order_by(CommunityComment.created_at.asc())
        .all()
    )
    post.views_count = (post.views_count or 0) + 1
    db.commit()
    db.refresh(post)
    return _format_post(post, comments)


@router.post("/posts", response_model=CommunityPostResponse)
def create_post(
    payload: CommunityPostCreate,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = CommunityPost(
        user_id=actor_user_id,
        post_type=payload.post_type,
        title=payload.author,
        content=payload.content,
        image_urls=[payload.media_url] if payload.media_url else [],
        tags=payload.tags,
        crop_tags=payload.crop_tags,
        lat=payload.lat,
        lon=payload.lon,
        moderation_status="approved",
        likes_count=0,
        comments_count=0,
        views_count=0,
        is_pinned=False,
        is_deleted=False,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _format_post(post, [])


@router.put("/posts/{post_id}", response_model=CommunityPostResponse)
def update_post(
    post_id: int,
    payload: CommunityPostUpdate,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id and post.user_id != actor_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this post")

    if payload.content is not None:
        post.content = payload.content
    if payload.media_url is not None:
        post.image_urls = [payload.media_url] if payload.media_url else []
    if payload.tags is not None:
        post.tags = payload.tags
    if payload.crop_tags is not None:
        post.crop_tags = payload.crop_tags

    db.commit()
    db.refresh(post)
    comments = (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .filter(CommunityComment.is_deleted.is_(False))
        .order_by(CommunityComment.created_at.asc())
        .all()
    )
    return _format_post(post, comments)


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id and post.user_id != actor_user_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")

    post.is_deleted = True
    db.commit()
    return {"success": True, "message": "Post deleted"}


@router.post("/posts/{post_id}/like", response_model=CommunityPostResponse)
def like_post(
    post_id: int,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = (
        db.query(CommunityLike)
        .filter(CommunityLike.post_id == post_id)
        .filter(CommunityLike.user_id == actor_user_id)
        .first()
    )
    if existing_like:
        db.delete(existing_like)
        post.likes_count = max((post.likes_count or 0) - 1, 0)
    else:
        db.add(CommunityLike(post_id=post_id, user_id=actor_user_id))
        post.likes_count = (post.likes_count or 0) + 1

    db.commit()
    db.refresh(post)
    comments = (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .filter(CommunityComment.is_deleted.is_(False))
        .order_by(CommunityComment.created_at.asc())
        .all()
    )
    return _format_post(post, comments)


@router.post("/posts/{post_id}/comments", response_model=CommunityCommentResponse)
def add_comment(
    post_id: int,
    payload: CommunityCommentCreate,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = CommunityComment(
        post_id=post_id,
        user_id=actor_user_id,
        author_name=payload.author or "Anonymous Farmer",
        content=payload.content,
    )
    db.add(comment)
    post.comments_count = (
        db.query(func.count(CommunityComment.id))
        .filter(CommunityComment.post_id == post_id)
        .filter(CommunityComment.is_deleted.is_(False))
        .scalar()
        or 0
    ) + 1
    db.commit()
    db.refresh(comment)
    return _format_comment(comment)


@router.post("/posts/{post_id}/report")
def report_post(
    post_id: int,
    payload: CommunityReportCreate,
    actor_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    post = (
        db.query(CommunityPost)
        .filter(CommunityPost.id == post_id)
        .filter(CommunityPost.is_deleted.is_(False))
        .first()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    report = CommunityReport(
        post_id=post_id,
        user_id=actor_user_id,
        reason=payload.reason,
        details=payload.details,
        status="open",
    )
    db.add(report)
    db.commit()
    return {"success": True, "message": "Report submitted"}


@router.get("/trending")
def get_trending(db: Session = Depends(get_db)):
    """Return top tags and most liked posts (trending)."""
    top_posts = (
        db.query(CommunityPost)
        .filter(CommunityPost.is_deleted.is_(False))
        .filter(CommunityPost.moderation_status != "rejected")
        .order_by(CommunityPost.likes_count.desc())
        .limit(5)
        .all()
    )
    # Aggregate tags from all posts
    all_tags: dict[str, int] = {}
    tag_rows = db.query(CommunityPost.tags).filter(CommunityPost.is_deleted.is_(False)).all()
    for row in tag_rows:
        for tag in (row.tags or []):
            all_tags[tag] = all_tags.get(tag, 0) + 1
    trending_tags = sorted(all_tags.items(), key=lambda x: x[1], reverse=True)[:8]

    return {
        "trending_tags": [{"tag": t, "count": c} for t, c in trending_tags],
        "top_posts": [_format_post(p, []) for p in top_posts],
    }


@router.get("/search", response_model=CommunityFeedResponse)
def search_posts(
    q: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Search posts by content or tags."""
    like = f"%{q}%"
    query = (
        db.query(CommunityPost)
        .filter(CommunityPost.is_deleted.is_(False))
        .filter(CommunityPost.moderation_status != "rejected")
        .filter(
            CommunityPost.content.ilike(like) |
            CommunityPost.title.ilike(like)
        )
        .order_by(CommunityPost.created_at.desc())
    )
    total = query.count()
    posts = query.offset((page - 1) * size).limit(size).all()
    return CommunityFeedResponse(
        posts=[_format_post(p, []) for p in posts],
        page=page, size=size, total=total,
    )


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Return community-level stats."""
    total_posts = db.query(func.count(CommunityPost.id)).filter(CommunityPost.is_deleted.is_(False)).scalar() or 0
    total_likes = db.query(func.sum(CommunityPost.likes_count)).filter(CommunityPost.is_deleted.is_(False)).scalar() or 0
    total_comments = db.query(func.count(CommunityComment.id)).filter(CommunityComment.is_deleted.is_(False)).scalar() or 0
    return {"total_posts": total_posts, "total_likes": total_likes, "total_comments": total_comments}
